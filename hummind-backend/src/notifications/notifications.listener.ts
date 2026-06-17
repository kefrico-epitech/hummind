import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from './notifications.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class NotificationListener {
  private readonly logger = new Logger(NotificationListener.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly mailService: MailService,
  ) {}

  @OnEvent('join-request.created')
  async handleJoinRequestCreated(payload: {
    entityId: string;
    requesterId: string;
  }) {
    try {
      const entity = await this.prisma.entity.findUnique({
        where: { id: payload.entityId },
        select: { name: true },
      });
      if (!entity) return;

      const managers = await this.prisma.entityMember.findMany({
        where: {
          entityId: payload.entityId,
          role: { in: ['OWNER', 'ADMIN', 'INSTRUCTOR'] },
        },
        select: { userId: true },
      });

      const pendingCount = await this.prisma.entityInvitation.count({
        where: {
          entityId: payload.entityId,
          requesterId: { not: null },
          acceptedAt: null,
          revokedAt: null,
        },
      });

      const title = `Nouvelles demandes d'adhésion`;
      const message = `Vous avez ${pendingCount} demande(s) en attente pour rejoindre ${entity.name}`;

      for (const manager of managers) {
        const existing = await this.prisma.notification.findFirst({
          where: {
            userId: manager.userId,
            entityId: payload.entityId,
            type: 'PENDING_JOIN_REQUESTS',
            readAt: null,
          },
        });

        if (existing) {
          await this.prisma.notification.update({
            where: { id: existing.id },
            data: { message, createdAt: new Date() },
          });
        } else {
          await this.notificationsService.create(
            undefined,
            {
              userId: manager.userId,
              entityId: payload.entityId,
              type: 'PENDING_JOIN_REQUESTS',
              title,
              message,
            },
            { isSystem: true },
          );
        }
      }
    } catch (error) {
      this.logger.error('Error handling join-request.created event', error);
    }
  }

  @OnEvent('join-request.approved')
  async handleJoinRequestApproved(payload: {
    entityId: string;
    requesterId: string;
    entityName: string;
  }) {
    try {
      await this.notificationsService.create(
        undefined,
        {
          userId: payload.requesterId,
          entityId: payload.entityId,
          type: 'JOIN_REQUEST_APPROVED',
          title: 'Adhésion validée',
          message: `Votre demande pour rejoindre ${payload.entityName} a été approuvée ! Vous y avez maintenant accès.`,
        },
        { isSystem: true },
      );

      const user = await this.prisma.user.findUnique({
        where: { id: payload.requesterId },
        select: { email: true },
      });

      if (user && user.email) {
        await this.mailService.sendJoinRequestApprovedEmail(
          user.email,
          payload.entityName,
        );
      }
    } catch (error) {
      this.logger.error('Error handling join-request.approved event', error);
    }
  }

  @OnEvent('join-request.rejected')
  async handleJoinRequestRejected(payload: {
    entityId: string;
    requesterId: string;
    entityName: string;
  }) {
    try {
      await this.notificationsService.create(
        undefined,
        {
          userId: payload.requesterId,
          entityId: payload.entityId,
          type: 'JOIN_REQUEST_REJECTED',
          title: 'Adhésion refusée',
          message: `Votre demande pour rejoindre ${payload.entityName} a été refusée.`,
        },
        { isSystem: true },
      );
    } catch (error) {
      this.logger.error('Error handling join-request.rejected event', error);
    }
  }
}
