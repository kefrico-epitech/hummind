import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction, AuditLogService } from './audit-log.service';

interface SoftDeleteArgs {
  actorId: string;
  targetUserId: string;
  reason?: string;
}

interface ExportArgs {
  userId: string;
}

@Injectable()
export class UserGdprService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogService,
  ) {}

  /**
   * Soft-delete d'un User (GDPR / volonté de l'utilisateur, ou décision ROOT).
   *
   * - Marque `deletedAt = now`
   * - Anonymise email/firstname/lastname pour ne plus exposer de PII
   * - Met status=DISABLED + mustChangePassword=false + invalide passwordHash
   * - L'authentification devient impossible (email factice + hash invalide)
   *
   * Les EntityMember restent en BDD pour préserver l'historique pédagogique
   * (cours créés, progressions, etc.) — mais comme le User est marqué
   * deletedAt, les jointures côté UI doivent filtrer pour afficher
   * "Utilisateur supprimé" plutôt que les données originelles.
   *
   * Refuse :
   * - Si le user n'existe pas ou est déjà supprimé
   * - Si l'acteur essaie de se supprimer en étant le seul ROOT actif
   *   (prévention de l'auto-lockout)
   */
  async softDelete(args: SoftDeleteArgs): Promise<{ id: string; deletedAt: string }> {
    const target = await this.prisma.user.findUnique({
      where: { id: args.targetUserId },
      select: {
        id: true,
        email: true,
        platformRole: true,
        deletedAt: true,
      },
    });
    if (!target) throw new NotFoundException('Compte introuvable');
    if (target.deletedAt) {
      throw new BadRequestException('Compte déjà supprimé');
    }

    // Anti auto-lockout : un ROOT ne peut pas supprimer son compte s'il est
    // le seul ROOT actif. La plateforme deviendrait inadministrable.
    if (target.platformRole === 'ROOT') {
      const otherRoots = await this.prisma.user.count({
        where: {
          platformRole: 'ROOT',
          status: UserStatus.ACTIVE,
          deletedAt: null,
          id: { not: target.id },
        },
      });
      if (otherRoots === 0) {
        throw new ForbiddenException(
          'Impossible de supprimer le dernier compte ROOT actif. Promouvez d\'abord un autre utilisateur.',
        );
      }
    }

    const now = new Date();
    const anonEmail = `deleted-${target.id}@deleted.local`;

    const updated = await this.prisma.user.update({
      where: { id: target.id },
      data: {
        deletedAt: now,
        email: anonEmail,
        firstname: 'Utilisateur',
        lastname: 'supprimé',
        passwordHash: null, // login devient impossible
        googleId: null,
        picture: null,
        mustChangePassword: false,
        status: UserStatus.DISABLED,
        disabledAt: now,
        statusNote: args.reason ?? 'GDPR soft-delete',
        emailVerifiedAt: null,
      },
      select: { id: true, deletedAt: true },
    });

    void this.audit.record({
      actorId: args.actorId,
      action:
        args.actorId === args.targetUserId
          ? AuditAction.USER_DISABLED // self-delete
          : AuditAction.USER_DISABLED,
      targetType: 'user',
      targetId: target.id,
      payload: {
        event: 'soft_delete',
        reason: args.reason ?? null,
        previousEmail: target.email,
      },
    });

    return {
      id: updated.id,
      deletedAt: updated.deletedAt?.toISOString() ?? now.toISOString(),
    };
  }

  /**
   * Export GDPR de toutes les données du user. Renvoie un objet JSON
   * structuré qu'on peut zipper côté client si besoin.
   * Inclut : profil, memberships, courses créés, progressions, sessions,
   * notes, contacts soumis, logs AI usage. Pas les hashes / tokens.
   */
  async exportData(args: ExportArgs): Promise<Record<string, unknown>> {
    const userId = args.userId;
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstname: true,
        lastname: true,
        platformRole: true,
        status: true,
        emailVerifiedAt: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        picture: true,
      },
    });
    if (!user) throw new NotFoundException('Compte introuvable');

    const [memberships, coursesCreated, progress, sessions, notes, aiUsage] =
      await Promise.all([
        this.prisma.entityMember.findMany({
          where: { userId },
          select: {
            entityId: true,
            role: true,
            status: true,
            createdAt: true,
            entity: { select: { id: true, name: true, type: true } },
          },
        }),
        this.prisma.course.findMany({
          where: { createdById: userId },
          select: { id: true, title: true, status: true, createdAt: true },
        }),
        this.prisma.courseProgress.findMany({
          where: { userId },
          select: {
            courseId: true,
            progressPercent: true,
            quizCorrect: true,
            quizTotal: true,
            exercisesCompleted: true,
            exercisesTotal: true,
            startedAt: true,
            lastAccessedAt: true,
            completedAt: true,
          },
        }),
        this.prisma.courseSession.findMany({
          where: { userId },
          select: {
            courseId: true,
            moduleId: true,
            messages: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        this.prisma.courseNote.findMany({
          where: { userId },
          select: {
            courseId: true,
            moduleId: true,
            content: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        this.prisma.aiUsageLog.findMany({
          where: { userId },
          select: {
            route: true,
            model: true,
            totalTokens: true,
            costUsdMicros: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 1000,
        }),
      ]);

    return {
      exportedAt: new Date().toISOString(),
      user,
      memberships,
      coursesCreated,
      progress,
      sessions,
      notes,
      aiUsage,
    };
  }
}
