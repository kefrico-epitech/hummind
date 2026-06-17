import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { parseSort } from '../common/query.helpers';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { QueryCourseDto } from './dto/query-course.dto';

const MANAGER_ROLES = new Set(['OWNER', 'ADMIN', 'INSTRUCTOR']);

@Injectable()
export class CourseService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertEntityManager(userId: string, entityId: string) {
    const member = await this.prisma.entityMember.findFirst({
      where: { userId, entityId, status: 'ACTIVE' },
      select: { role: true },
    });
    if (!member || !MANAGER_ROLES.has(member.role)) {
      throw new ForbiddenException(
        "Vous n'avez pas les droits pour effectuer cette action sur ce cours.",
      );
    }
  }

  async list(q: QueryCourseDto) {
    const where: Prisma.CourseWhereInput = {
      entity: { status: 'ACTIVE' },
    };
    if (q.entityId) where.entityId = q.entityId;
    if (q.q) {
      where.OR = [
        { title: { contains: q.q, mode: 'insensitive' as const } },
        { description: { contains: q.q, mode: 'insensitive' as const } },
      ];
    }

    const orderBy = parseSort(q.sort);
    const skip = (q.page - 1) * q.pageSize;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.course.findMany({ where, orderBy, skip, take: q.pageSize }),
      this.prisma.course.count({ where }),
    ]);

    return { data, meta: { page: q.page, pageSize: q.pageSize, total } };
  }

  async listByEntity(entityId: string, q: QueryCourseDto) {
    return this.list({ ...q, entityId });
  }

  async create(userId: string, dto: CreateCourseDto) {
    const entity = await this.prisma.entity.findUnique({
      where: { id: dto.entityId },
    });
    if (!entity) throw new BadRequestException('entityId not found');

    await this.assertEntityManager(userId, dto.entityId);

    const course = await this.prisma.course.create({
      data: {
        entityId: dto.entityId,
        title: dto.title,
        description: dto.description,
        content: dto.content as Prisma.InputJsonValue | undefined,
        mode: dto.mode,
        objectives: dto.objectives,
        visibility: dto.visibility,
        startDate: dto.startDate,
        endDate: dto.endDate,
        domain: dto.domain,
        level: dto.level,
        link: dto.link,
        status: dto.status,
        createdById: userId,
        categoryLinks: dto.categoryIds
          ? { create: dto.categoryIds.map((id) => ({ categoryId: id })) }
          : undefined,
      },
      include: {
        categoryLinks: {
          include: { category: { select: { id: true, name: true } } },
        },
      },
    });

    return course;
  }

  async getOne(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        categoryLinks: {
          include: { category: { select: { id: true, name: true } } },
        },
      },
    });
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }

  async update(userId: string, id: string, dto: UpdateCourseDto) {
    const existing = await this.getOne(id);
    await this.assertEntityManager(userId, existing.entityId);

    const { categoryIds, ...rest } = dto;

    const course = await this.prisma.course.update({
      where: { id },
      data: {
        ...rest,
        categoryLinks: categoryIds
          ? {
              deleteMany: {},
              create: categoryIds.map((id) => ({ categoryId: id })),
            }
          : undefined,
      },
      include: {
        categoryLinks: {
          include: { category: { select: { id: true, name: true } } },
        },
      },
    });

    return course;
  }

  async remove(userId: string, id: string) {
    const existing = await this.getOne(id);
    await this.assertEntityManager(userId, existing.entityId);

    await this.prisma.course.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });

    return { message: 'Course archived' };
  }
}
