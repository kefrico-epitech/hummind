import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { FastifyRequest } from 'fastify';
import type { Env } from '../config/env.schema';
import type { JwtPayload } from './types';

/** Vérifie le JWT d'accès porté par le cookie httpOnly `hm_session`. */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<FastifyRequest & Record<string, unknown>>();
    const token = (req.cookies as Record<string, string> | undefined)?.hm_session;
    if (!token) throw new UnauthorizedException('Session manquante.');

    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token, {
        secret: this.config.get('JWT_ACCESS_SECRET', { infer: true }),
      });
      if (payload.kind !== 'access') throw new Error('mauvais type de token');
      req.userId = payload.sub;
      req.userRole = payload.role;
      return true;
    } catch {
      throw new UnauthorizedException('Session invalide ou expirée.');
    }
  }
}
