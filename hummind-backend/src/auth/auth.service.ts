import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomUUID } from 'crypto';
import * as argon2 from 'argon2';
import type { Role, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { Env } from '../config/env.schema';
import type { JwtPayload } from './types';
import type { ChangePasswordDto, UpdateProfileDto } from './dto/auth.dto';

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
}

/** Vue publique d'un utilisateur (alignée sur la Session côté frontend). */
export function sanitizeUser(u: User) {
  return {
    id: u.id,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    role: u.role,
    avatarUrl: u.avatarUrl,
    locale: u.locale,
    mustChangePassword: u.mustChangePassword,
    onboardingCompleted: u.onboardingCompleted,
    profileCompleted: u.profileCompleted,
  };
}

const sha256 = (v: string) => createHash('sha256').update(v).digest('hex');

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  // ── Connexion ─────────────────────────────────────────────
  async signIn(email: string, password: string, ua?: string, ip?: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user || user.deletedAt) throw new UnauthorizedException('Identifiants invalides.');

    const valid = await argon2.verify(user.passwordHash, password).catch(() => false);
    if (!valid) throw new UnauthorizedException('Identifiants invalides.');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.issueTokens(user.id, user.role, ua, ip);
    return { user: sanitizeUser(user), ...tokens };
  }

  // ── Profil courant ────────────────────────────────────────
  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt) throw new UnauthorizedException();
    return sanitizeUser(user);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { ...dto, profileCompleted: true },
    });
    return sanitizeUser(user);
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();

    const valid = await argon2.verify(user.passwordHash, dto.currentPassword).catch(() => false);
    if (!valid) throw new UnauthorizedException('Mot de passe actuel incorrect.');

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: await argon2.hash(dto.newPassword, { type: argon2.argon2id }),
        mustChangePassword: false,
      },
    });
    // Révoque toutes les autres sessions.
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { ok: true };
  }

  // ── Rotation du refresh token ─────────────────────────────
  async refresh(refreshToken: string, ua?: string, ip?: string): Promise<IssuedTokens> {
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET', { infer: true }),
      });
    } catch {
      throw new UnauthorizedException('Refresh token invalide.');
    }
    if (payload.kind !== 'refresh') throw new UnauthorizedException();

    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: sha256(refreshToken) },
    });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Session expirée.');
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokens(payload.sub, payload.role, ua, ip);
  }

  async signOut(refreshToken?: string): Promise<void> {
    if (!refreshToken) return;
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: sha256(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  // ── Émission des tokens ───────────────────────────────────
  private async issueTokens(
    userId: string,
    role: Role,
    ua?: string,
    ip?: string,
  ): Promise<IssuedTokens> {
    const accessToken = await this.jwt.signAsync(
      { sub: userId, role, kind: 'access', jti: randomUUID() } satisfies JwtPayload,
      {
        secret: this.config.get('JWT_ACCESS_SECRET', { infer: true }),
        expiresIn: this.config.get('JWT_ACCESS_TTL', { infer: true }),
      },
    );

    const refreshToken = await this.jwt.signAsync(
      { sub: userId, role, kind: 'refresh', jti: randomUUID() } satisfies JwtPayload,
      {
        secret: this.config.get('JWT_REFRESH_SECRET', { infer: true }),
        expiresIn: this.config.get('JWT_REFRESH_TTL', { infer: true }),
      },
    );

    const ttl = this.config.get('JWT_REFRESH_TTL', { infer: true });
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: sha256(refreshToken),
        userAgent: ua,
        ip,
        expiresAt: new Date(Date.now() + ttl * 1000),
      },
    });

    return { accessToken, refreshToken };
  }
}
