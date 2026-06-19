import { Injectable } from '@nestjs/common';
import { EntityRole, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrgService {
  constructor(private readonly prisma: PrismaService) {}

  async mine(userId: string, role: Role) {
    const where =
      role === Role.ROOT
        ? {}
        : {
            members: {
              some: {
                userId,
                role: { in: [EntityRole.OWNER, EntityRole.ADMIN, EntityRole.INSTRUCTOR] },
              },
            },
          };

    const entities = await this.prisma.entity.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        members: true,
        subscription: true,
        courses: {
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return entities.map((entity) => ({
      id: entity.id,
      name: entity.name,
      type: entity.type,
      city: entity.city,
      country: entity.country,
      description: entity.description,
      membersCount: entity.members.length,
      coursesCount: entity.courses.length,
      subscription: entity.subscription
        ? {
            tier: entity.subscription.tier,
            status: entity.subscription.status,
            tokensLimit: entity.subscription.tokensLimit,
            tokensUsed: entity.subscription.tokensUsed,
          }
        : null,
      courses: entity.courses,
    }));
  }
}
