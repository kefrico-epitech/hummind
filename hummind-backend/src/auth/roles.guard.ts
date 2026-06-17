import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Role } from '@prisma/client';
import type { AuthedRequest } from './types';
import { ROLES_KEY } from './roles.decorator';

/** Vérifie que le rôle de l'utilisateur (posé par JwtAuthGuard) est autorisé. */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const req = context.switchToHttp().getRequest<AuthedRequest>();
    if (!required.includes(req.userRole)) {
      throw new ForbiddenException('Accès refusé pour votre rôle.');
    }
    return true;
  }
}
