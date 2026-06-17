import type { Role } from '@prisma/client';

export type TokenKind = 'access' | 'refresh';

export interface JwtPayload {
  sub: string; // userId
  role: Role;
  kind: TokenKind;
  jti: string;
}

/** Requête enrichie par JwtAuthGuard. */
export interface AuthedRequest {
  userId: string;
  userRole: Role;
}
