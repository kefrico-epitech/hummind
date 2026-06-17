import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type RequestUser } from '../auth/current-user.decorator';
import { JoinService } from './join.service';
import {
  CreatePublicJoinLinkDto,
  JoinSignupDto,
  UpdatePublicJoinLinkDto,
  VerifyEmailDto,
} from './join.dto';

@Controller()
export class JoinController {
  constructor(private readonly join: JoinService) {}

  // ---------------------------------------------------------------------------
  // OWNER side — gestion des liens publics d'une salle
  // ---------------------------------------------------------------------------

  @Post('public-join-links')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  createLink(
    @CurrentUser() actor: RequestUser,
    @Body() dto: CreatePublicJoinLinkDto,
  ) {
    return this.join.createLink(actor.id, dto);
  }

  @Get('public-join-links')
  @UseGuards(JwtAuthGuard)
  listLinks(
    @CurrentUser() actor: RequestUser,
    @Query('entityId') entityId: string,
  ) {
    return this.join.listLinksForEntity(actor.id, entityId);
  }

  @Patch('public-join-links/:id')
  @UseGuards(JwtAuthGuard)
  updateLink(
    @CurrentUser() actor: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdatePublicJoinLinkDto,
  ) {
    return this.join.updateLink(actor.id, id, dto);
  }

  @Delete('public-join-links/:id')
  @UseGuards(JwtAuthGuard)
  deleteLink(@CurrentUser() actor: RequestUser, @Param('id') id: string) {
    return this.join.deleteLink(actor.id, id);
  }

  // ---------------------------------------------------------------------------
  // PUBLIC side — pas de JwtAuthGuard
  // ---------------------------------------------------------------------------

  @Get('public/join-info/:code')
  getJoinInfo(@Param('code') code: string) {
    return this.join.getJoinInfo(code);
  }

  @Post('public/join/:code/signup')
  @HttpCode(HttpStatus.CREATED)
  signupViaCode(@Param('code') code: string, @Body() dto: JoinSignupDto) {
    return this.join.signupViaCode(code, dto);
  }

  @Post('public/verify-email')
  @HttpCode(HttpStatus.OK)
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.join.verifyEmail(dto);
  }

  // ---------------------------------------------------------------------------
  // Authenticated learner joining an existing salle
  // ---------------------------------------------------------------------------

  @Post('join/:code/accept')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  accept(@CurrentUser() actor: RequestUser, @Param('code') code: string) {
    return this.join.acceptAsAuthenticated(actor.id, code);
  }
}
