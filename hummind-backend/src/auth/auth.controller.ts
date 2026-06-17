import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { Env } from '../config/env.schema';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';
import { ChangePasswordDto, SignInDto, UpdateProfileDto } from './dto/auth.dto';

const ACCESS_COOKIE = 'hm_session';
const REFRESH_COOKIE = 'hm_refresh';
const REFRESH_PATH = '/api/v1/auth';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  @Post('signin')
  async signIn(
    @Body() dto: SignInDto,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const { user, accessToken, refreshToken } = await this.auth.signIn(
      dto.email,
      dto.password,
      req.headers['user-agent'],
      req.ip,
    );
    this.setAuthCookies(reply, accessToken, refreshToken);
    return user;
  }

  @Post('refresh')
  async refresh(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const token = this.cookie(req, REFRESH_COOKIE);
    if (!token) throw new UnauthorizedException('Aucune session à rafraîchir.');
    const { accessToken, refreshToken } = await this.auth.refresh(
      token,
      req.headers['user-agent'],
      req.ip,
    );
    this.setAuthCookies(reply, accessToken, refreshToken);
    return { ok: true };
  }

  @Post('signout')
  async signOut(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    await this.auth.signOut(this.cookie(req, REFRESH_COOKIE));
    reply.clearCookie(ACCESS_COOKIE, { path: '/' });
    reply.clearCookie(REFRESH_COOKIE, { path: REFRESH_PATH });
    return { ok: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() userId: string) {
    return this.auth.me(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  updateProfile(@CurrentUser() userId: string, @Body() dto: UpdateProfileDto) {
    return this.auth.updateProfile(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  changePassword(@CurrentUser() userId: string, @Body() dto: ChangePasswordDto) {
    return this.auth.changePassword(userId, dto);
  }

  // ── Helpers cookies ───────────────────────────────────────
  private cookie(req: FastifyRequest, name: string): string | undefined {
    return (req.cookies as Record<string, string> | undefined)?.[name];
  }

  private setAuthCookies(reply: FastifyReply, access: string, refresh: string): void {
    const secure = this.config.get('COOKIE_SECURE', { infer: true });
    const domain = this.config.get('COOKIE_DOMAIN', { infer: true });
    const base = { httpOnly: true, secure, domain, sameSite: 'lax' as const };

    reply.setCookie(ACCESS_COOKIE, access, {
      ...base,
      path: '/',
      maxAge: this.config.get('JWT_ACCESS_TTL', { infer: true }),
    });
    reply.setCookie(REFRESH_COOKIE, refresh, {
      ...base,
      path: REFRESH_PATH,
      maxAge: this.config.get('JWT_REFRESH_TTL', { infer: true }),
    });
  }
}
