import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthedRequest } from './types';

/** Injecte l'`userId` (posé par JwtAuthGuard) dans un handler. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    return req.userId;
  },
);
