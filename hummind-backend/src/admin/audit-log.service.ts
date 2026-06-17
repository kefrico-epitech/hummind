import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

// Constantes pour éviter les typos sur les noms d'actions.
export const AuditAction = {
  CONTACT_ACCEPTED: 'CONTACT_ACCEPTED',
  CONTACT_CONTACTED: 'CONTACT_CONTACTED',
  CONTACT_REJECTED: 'CONTACT_REJECTED',
  CONTACT_ARCHIVED: 'CONTACT_ARCHIVED',
  USER_CREATED_BY_ROOT: 'USER_CREATED_BY_ROOT',
  USER_CREATED_BY_ADMIN: 'USER_CREATED_BY_ADMIN',
  USER_BANNED: 'USER_BANNED',
  USER_DISABLED: 'USER_DISABLED',
  USER_REACTIVATED: 'USER_REACTIVATED',
  USER_ROLE_CHANGED: 'USER_ROLE_CHANGED',
  PASSWORD_RESET_BY_ADMIN: 'PASSWORD_RESET_BY_ADMIN',
  PUBLIC_JOIN_LINK_TOGGLED: 'PUBLIC_JOIN_LINK_TOGGLED',
} as const;

export type AuditActionValue = (typeof AuditAction)[keyof typeof AuditAction];

export interface AuditLogInput {
  actorId: string | null;
  action: AuditActionValue;
  targetType?: string | null;
  targetId?: string | null;
  payload?: Prisma.InputJsonValue;
  ip?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Insère une ligne dans AdminAuditLog. Conçu pour être appelé en
   * fire-and-forget : ne throw jamais (un échec d'audit ne doit pas
   * casser la requête utilisateur, mais est loggué via Pino).
   */
  async record(input: AuditLogInput): Promise<void> {
    try {
      await this.prisma.adminAuditLog.create({
        data: {
          actorId: input.actorId,
          action: input.action,
          targetType: input.targetType ?? null,
          targetId: input.targetId ?? null,
          payload: input.payload ?? Prisma.JsonNull,
          ip: input.ip ?? null,
          userAgent: input.userAgent ?? null,
        },
      });
    } catch (err) {
      this.logger.error(
        `Failed to persist audit log (action=${input.action}, target=${
          input.targetId ?? 'n/a'
        }): ${(err as Error).message}`,
      );
    }
  }
}
