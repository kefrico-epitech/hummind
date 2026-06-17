import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { paginate, toPaginatedResult } from '../common/query.helpers';
import { AuditAction, AuditLogService } from './audit-log.service';
import type {
  ListAdminUsersQueryDto,
  ListAuditLogQueryDto,
  UpdateAdminUserStatusDto,
} from './admin-users.dto';

@Injectable()
export class AdminUsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogService,
  ) {}

  // ---------------------------------------------------------------------------
  // List users (ROOT-only)
  // ---------------------------------------------------------------------------

  async list(query: ListAdminUsersQueryDto) {
    const where: Prisma.UserWhereInput = {};
    if (query.status) where.status = query.status as UserStatus;
    if (query.platformRole) where.platformRole = query.platformRole;
    if (query.search) {
      const term = query.search.trim();
      if (term.length > 0) {
        where.OR = [
          { email: { contains: term, mode: 'insensitive' } },
          { firstname: { contains: term, mode: 'insensitive' } },
          { lastname: { contains: term, mode: 'insensitive' } },
        ];
      }
    }

    const { skip, take } = paginate({ page: query.page, pageSize: query.pageSize });

    const [data, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: {
          id: true,
          email: true,
          firstname: true,
          lastname: true,
          platformRole: true,
          status: true,
          mustChangePassword: true,
          emailVerifiedAt: true,
          createdAt: true,
          updatedAt: true,
          bannedUntil: true,
          disabledAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return toPaginatedResult(data, total, {
      page: query.page,
      pageSize: query.pageSize,
    });
  }

  // ---------------------------------------------------------------------------
  // Update user status (ACTIVE / DISABLED / BANNED)
  // ---------------------------------------------------------------------------

  async updateStatus(
    actorId: string,
    targetUserId: string,
    dto: UpdateAdminUserStatusDto,
  ) {
    if (actorId === targetUserId) {
      throw new BadRequestException(
        'Impossible de modifier votre propre statut.',
      );
    }
    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, status: true, platformRole: true, email: true },
    });
    if (!target) throw new NotFoundException('Utilisateur introuvable');

    const nextStatus = dto.status as UserStatus;
    const now = new Date();

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: {
        status: nextStatus,
        statusNote: dto.statusNote ?? null,
        bannedUntil: nextStatus === UserStatus.BANNED ? null : null,
        disabledAt: nextStatus === UserStatus.DISABLED ? now : null,
      },
      select: {
        id: true,
        email: true,
        firstname: true,
        lastname: true,
        platformRole: true,
        status: true,
      },
    });

    const action =
      nextStatus === UserStatus.BANNED
        ? AuditAction.USER_BANNED
        : nextStatus === UserStatus.DISABLED
          ? AuditAction.USER_DISABLED
          : AuditAction.USER_REACTIVATED;

    void this.audit.record({
      actorId,
      action,
      targetType: 'user',
      targetId: targetUserId,
      payload: {
        from: target.status,
        to: nextStatus,
        note: dto.statusNote ?? null,
      },
    });

    return updated;
  }

  // ---------------------------------------------------------------------------
  // Audit log read-only
  // ---------------------------------------------------------------------------

  async listAuditLog(query: ListAuditLogQueryDto) {
    const where: Prisma.AdminAuditLogWhereInput = {};
    if (query.action) where.action = query.action;
    if (query.actorId) where.actorId = query.actorId;
    if (query.targetType) where.targetType = query.targetType;
    if (query.targetId) where.targetId = query.targetId;

    const { skip, take } = paginate({ page: query.page, pageSize: query.pageSize });

    const [data, total] = await this.prisma.$transaction([
      this.prisma.adminAuditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          actor: {
            select: { id: true, email: true, firstname: true, lastname: true },
          },
        },
      }),
      this.prisma.adminAuditLog.count({ where }),
    ]);

    return toPaginatedResult(data, total, {
      page: query.page,
      pageSize: query.pageSize,
    });
  }
}
