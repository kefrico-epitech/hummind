import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { parseSort } from '../common/query.helpers';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { QueryCategoryDto } from './dto/query-category.dto';
import { TreeCategoryQueryDto } from './dto/tree-category.dto';
import { MoveCategoryDto } from './dto/move-category.dto';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureEntityMine(userId: string, entityId: string) {
    const entity = await this.prisma.entity.findUnique({
      where: { id: entityId },
      include: {
        members: {
          where: { userId },
          select: { role: true },
        },
      },
    });

    if (!entity) throw new NotFoundException('Entity not found');
    if (entity.status !== 'ACTIVE')
      throw new NotFoundException('Entity not found'); // Hide archived

    // Allow Creator OR Member with OWNER/ADMIN/INSTRUCTOR role
    const isCreator = entity.createdById === userId;
    const hasRole = entity.members.some((m) =>
      ['OWNER', 'ADMIN', 'INSTRUCTOR'].includes(m.role),
    );

    if (!isCreator && !hasRole) throw new ForbiddenException();
    return entity;
  }

  private async ensureEntitiesMine(userId: string, entityIds: string[]) {
    if (!entityIds || entityIds.length === 0) return;

    // Check if user is Creator (Implicit Owner) OR has OWNER/ADMIN role
    const validEntities = await this.prisma.entity.findMany({
      where: {
        id: { in: entityIds },
        status: 'ACTIVE',
        OR: [
          { createdById: userId },
          {
            members: {
              some: {
                userId,
                role: { in: ['OWNER', 'ADMIN', 'INSTRUCTOR'] },
              },
            },
          },
        ],
      },
      select: { id: true },
    });

    if (validEntities.length !== entityIds.length) {
      throw new ForbiddenException(
        'One or more entities in groupIds are invalid or you do not have permission (Owner/Admin)',
      );
    }
  }

  private async ensureCategoryMine(userId: string, categoryId: string) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        entityLinks: {
          include: { entity: { select: { id: true, name: true, type: true } } },
        },
        entity: {
          include: {
            members: {
              where: { userId },
              select: { role: true },
            },
          },
        },
      },
    });

    if (!category) throw new NotFoundException('Category not found');
    if (category.entity.status !== 'ACTIVE')
      throw new NotFoundException('Category not found'); // Hide archived

    // Allow Creator OR Member with OWNER/ADMIN/INSTRUCTOR role
    const isCreator = category.entity.createdById === userId;
    const hasRole = category.entity.members.some((m) =>
      ['OWNER', 'ADMIN', 'INSTRUCTOR'].includes(m.role),
    );

    if (!isCreator && !hasRole) throw new ForbiddenException();
    return category;
  }

  private async ensureNoCycle(
    categoryId: string,
    entityId: string,
    newParentId: string,
  ) {
    const descendants = await this.prisma.$queryRawUnsafe<{ id: string }[]>(
      `
      WITH RECURSIVE tree AS (
        SELECT id FROM "Category" WHERE id = $1 AND "entityId" = $2
        UNION ALL
        SELECT c.id
        FROM "Category" c
        JOIN tree t ON c."parentId" = t.id
        WHERE c."entityId" = $2
      )
      SELECT id FROM tree;
    `,
      categoryId,
      entityId,
    );

    const set = new Set(descendants.map((d) => d.id));
    if (set.has(newParentId))
      throw new BadRequestException(
        'Cycle detected: newParentId is a descendant',
      );
  }

  async list(userId: string, entityId: string, q: QueryCategoryDto) {
    await this.ensureEntityMine(userId, entityId);

    const where: any = { entityId };
    if (q.parentId === null) where.parentId = null;
    if (q.parentId) where.parentId = q.parentId;
    if (q.q) where.name = { contains: q.q, mode: 'insensitive' as const };

    const orderBy = parseSort(q.sort, 'name', 'asc');
    const skip = (q.page - 1) * q.pageSize;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.category.findMany({
        where,
        orderBy,
        skip,
        take: q.pageSize,
        include: {
          entityLinks: {
            include: {
              entity: { select: { id: true, name: true, type: true } },
            },
          },
        },
      }),
      this.prisma.category.count({ where }),
    ]);

    return { data, meta: { page: q.page, pageSize: q.pageSize, total } };
  }

  async create(userId: string, entityId: string, dto: CreateCategoryDto) {
    await this.ensureEntityMine(userId, entityId);
    if (dto.groupIds) await this.ensureEntitiesMine(userId, dto.groupIds);

    let parentId: string | null | undefined = dto.parentId ?? undefined;
    if (dto.parentId) {
      const parent = await this.prisma.category.findFirst({
        where: { id: dto.parentId, entityId },
        select: { id: true },
      });
      if (!parent)
        throw new BadRequestException('parentId not found in this entity');
      parentId = parent.id;
    }

    const category = await this.prisma.category.create({
      data: {
        entityId,
        name: dto.name,
        parentId,
      },
    });

    if (dto.groupIds && dto.groupIds.length > 0) {
      // Use createMany with explicit model
      await this.prisma.entityCategory.createMany({
        data: dto.groupIds.map((gid) => ({
          categoryId: category.id,
          entityId: gid,
        })),
      });
    }

    return category;
  }

  async getOne(userId: string, id: string) {
    const category = await this.ensureCategoryMine(userId, id);
    return category;
  }

  async update(userId: string, id: string, dto: UpdateCategoryDto) {
    const category = await this.ensureCategoryMine(userId, id);
    if (dto.groupIds) await this.ensureEntitiesMine(userId, dto.groupIds);

    let parentId: string | null | undefined = undefined;
    if (dto.parentId !== undefined) {
      if (dto.parentId === id)
        throw new BadRequestException('parentId cannot equal category id');

      if (dto.parentId === null) {
        parentId = null;
      } else {
        const parent = await this.prisma.category.findFirst({
          where: { id: dto.parentId, entityId: category.entityId },
          select: { id: true },
        });
        if (!parent)
          throw new BadRequestException('parentId not found in this entity');
        await this.ensureNoCycle(id, category.entityId, parent.id);
        parentId = parent.id;
      }
    }

    const updated = await this.prisma.category.update({
      where: { id },
      data: {
        name: dto.name,
        parentId,
      },
    });

    if (dto.groupIds) {
      // Replace existing links using explicit model
      await this.prisma.entityCategory.deleteMany({
        where: { categoryId: id },
      });
      if (dto.groupIds.length > 0) {
        await this.prisma.entityCategory.createMany({
          data: dto.groupIds.map((gid) => ({
            categoryId: id,
            entityId: gid,
          })),
        });
      }
    }

    // Return the fresh, full object including new links
    return this.getOne(userId, id);
  }

  async remove(userId: string, id: string) {
    await this.ensureCategoryMine(userId, id);
    return this.prisma.category.delete({ where: { id } });
  }

  async children(userId: string, id: string) {
    const category = await this.ensureCategoryMine(userId, id);
    return this.prisma.category.findMany({
      where: { parentId: id, entityId: category.entityId },
      orderBy: [{ name: 'asc' }],
    });
  }

  async tree(userId: string, id: string, q: TreeCategoryQueryDto) {
    const category = await this.ensureCategoryMine(userId, id);
    const cap = q.depth != null ? Math.min(q.depth, 20) : null;

    const rows = await this.prisma.$queryRawUnsafe<any[]>(
      `
      WITH RECURSIVE tree AS (
        SELECT c.id, c."parentId", c.name, c."entityId", 0 AS depth
        FROM "Category" c
        WHERE c.id = $1 AND c."entityId" = $2
        UNION ALL
        SELECT c.id, c."parentId", c.name, c."entityId", t.depth + 1
        FROM "Category" c
        JOIN tree t ON c."parentId" = t.id
        WHERE c."entityId" = $2
        ${cap !== null ? `AND t.depth + 1 <= ${cap}` : ``}
      )
      SELECT t.*
      FROM tree t
      ORDER BY depth ASC, name ASC;
    `,
      id,
      category.entityId,
    );

    if (q.flat) return rows;

    const map = new Map<string, any>();
    rows.forEach((r) => map.set(r.id, { ...r, children: [] as any[] }));
    const root = map.get(id);
    rows.forEach((r) => {
      if (r.parentId && map.has(r.parentId)) {
        map.get(r.parentId).children.push(map.get(r.id));
      }
    });
    return root;
  }

  async ancestors(userId: string, id: string) {
    const category = await this.ensureCategoryMine(userId, id);

    const rows = await this.prisma.$queryRawUnsafe<any[]>(
      `
      WITH RECURSIVE parents AS (
        SELECT c.id, c."parentId", c.name, c."entityId", 0 AS depth
        FROM "Category" c
        WHERE c.id = $1 AND c."entityId" = $2
        UNION ALL
        SELECT p.id, p."parentId", p.name, p."entityId", parents.depth + 1
        FROM "Category" p
        JOIN parents ON parents."parentId" = p.id
        WHERE p."entityId" = $2
      )
      SELECT * FROM parents ORDER BY depth ASC;
    `,
      id,
      category.entityId,
    );

    return rows;
  }

  async move(userId: string, id: string, dto: MoveCategoryDto) {
    const category = await this.ensureCategoryMine(userId, id);

    const newParentId = dto.newParentId ?? null;
    if (newParentId === id)
      throw new BadRequestException('newParentId cannot equal category id');

    if (newParentId) {
      const parent = await this.prisma.category.findFirst({
        where: { id: newParentId, entityId: category.entityId },
        select: { id: true },
      });
      if (!parent)
        throw new BadRequestException('newParentId not found in this entity');
      await this.ensureNoCycle(id, category.entityId, parent.id);
    }

    return this.prisma.category.update({
      where: { id },
      data: { parentId: newParentId },
    });
  }
}
