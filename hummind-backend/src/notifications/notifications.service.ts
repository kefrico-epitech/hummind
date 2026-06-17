import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { parseSort } from '../common/query.helpers';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { QueryNotificationDto } from './dto/query-notification.dto';
import { ReadNotificationDto } from './dto/read-notification.dto';
import { ReadAllNotificationsDto } from './dto/read-all-notifications.dto';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  private ensureAdmin(role?: string, isSystem = false) {
    if (!isSystem && role !== 'ADMIN')
      throw new ForbiddenException('Admin only');
  }

  async list(userId: string, q: QueryNotificationDto) {
    const where: Prisma.NotificationWhereInput = { userId };
    if (q.unread === true) where.readAt = null;
    if (q.entityId) where.entityId = q.entityId;
    if (q.type) where.type = q.type;

    const orderBy = parseSort(q.sort);
    const skip = (q.page - 1) * q.pageSize;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        orderBy,
        skip,
        take: q.pageSize,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return { data, meta: { page: q.page, pageSize: q.pageSize, total } };
  }

  async getOne(userId: string, id: string, isAdmin = false) {
    const notification = await this.prisma.notification.findFirst({
      where: isAdmin ? { id } : { id, userId },
    });
    if (!notification) throw new NotFoundException('Notification not found');
    return notification;
  }

  async create(
    actor: { id?: string; role?: string } | undefined,
    dto: CreateNotificationDto,
    options?: { isSystem?: boolean },
  ) {
    const isSystem = options?.isSystem === true;
    this.ensureAdmin(actor?.role, isSystem);

    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      select: { id: true },
    });
    if (!user) throw new BadRequestException('userId not found');

    if (dto.entityId) {
      const entity = await this.prisma.entity.findUnique({
        where: { id: dto.entityId },
        select: { id: true },
      });
      if (!entity) throw new BadRequestException('entityId not found');
    }

    return this.prisma.notification.create({
      data: {
        userId: dto.userId,
        entityId: dto.entityId ?? null,
        type: dto.type,
        title: dto.title,
        message: dto.message,
        data: dto.data as Prisma.InputJsonValue,
      },
    });
  }

  async markRead(
    userId: string,
    id: string,
    dto: ReadNotificationDto,
    isAdmin = false,
  ) {
    const notification = await this.getOne(userId, id, isAdmin);

    let readAt: Date | null = new Date();
    if (dto.readAt === null) readAt = null;
    if (typeof dto.readAt === 'string') readAt = new Date(dto.readAt);

    return this.prisma.notification.update({
      where: { id: notification.id },
      data: { readAt },
    });
  }

  async readAll(userId: string, dto: ReadAllNotificationsDto) {
    const where: Prisma.NotificationWhereInput = { userId, readAt: null };
    if (dto.entityId) where.entityId = dto.entityId;
    if (dto.type) where.type = dto.type;

    const res = await this.prisma.notification.updateMany({
      where,
      data: { readAt: new Date() },
    });

    return { count: res.count };
  }

  async counts(userId: string, q: QueryNotificationDto) {
    const base: Prisma.NotificationWhereInput = { userId };
    if (q.entityId) base.entityId = q.entityId;
    if (q.type) base.type = q.type;

    const [total, unread] = await this.prisma.$transaction([
      this.prisma.notification.count({ where: base }),
      this.prisma.notification.count({ where: { ...base, readAt: null } }),
    ]);

    return { total, unread };
  }

  async remove(userId: string, id: string, isAdmin = false) {
    const notification = await this.getOne(userId, id, isAdmin);
    return this.prisma.notification.delete({ where: { id: notification.id } });
  }
}
