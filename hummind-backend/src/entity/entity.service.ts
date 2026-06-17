import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { parseSort } from '../common/query.helpers';
import { QueryEntityDto } from './dto/query-entity.dto';
import { CreateEntityDto } from './dto/create-entity.dto';
import { UpdateEntityDto } from './dto/update-entity.dto';
import { TreeQueryDto } from './dto/tree-query.dto';
import { MoveEntityDto } from './dto/move-entity.dto';

export interface EntityGraphNode {
  id: string;
  parentId: string | null;
  name: string;
  type: string; // Using string to avoid EntityType enum import issues for now
  description: string | null;
  picture: string | null;
  // Computed
  myRole?: string;
  children?: EntityGraphNode[];
  counts?: {
    children: number;
    members: number;
    courses: number;
  };
  // Optional for tree traversal
  depth?: number;
}

@Injectable()
export class EntityService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, q: QueryEntityDto) {
    const where: any = { createdById: userId, status: 'ACTIVE' };
    if (q.parentId) where.parentId = q.parentId;
    if (q.type) where.type = q.type;
    if (q.q) {
      where.OR = [
        { name: { contains: q.q, mode: 'insensitive' as const } },
        { description: { contains: q.q, mode: 'insensitive' as const } },
      ];
    }
    const orderBy = parseSort(q.sort);
    const skip = (q.page - 1) * q.pageSize;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.entity.findMany({ where, orderBy, skip, take: q.pageSize }),
      this.prisma.entity.count({ where }),
    ]);

    return { data, meta: { page: q.page, pageSize: q.pageSize, total } };
  }

  // --- CRUD ---

  async create(userId: string, dto: CreateEntityDto) {
    if (dto.parentId) {
      await this.ensureManager(userId, dto.parentId);
    }

    try {
      const entity = await this.prisma.entity.create({
        data: {
          ...dto,
          createdById: userId,
          members: {
            create: {
              userId: userId,
              role: 'OWNER',
            },
          },
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  firstname: true,
                  lastname: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      return entity;
    } catch (e: any) {
      throw new BadRequestException(e?.message ?? 'Create entity failed');
    }
  }

  async update(userId: string, id: string, dto: UpdateEntityDto) {
    await this.ensureManager(userId, id);

    if (dto.parentId) {
      await this.ensureManager(userId, dto.parentId);
    }

    try {
      const updated = await this.prisma.entity.update({
        where: { id },
        data: {
          name: dto.name ?? undefined,
          description: dto.description ?? undefined,
          parentId: dto.parentId ?? undefined,
        },
      });

      return updated;
    } catch (e: any) {
      throw new BadRequestException(e?.message ?? 'Update entity failed');
    }
  }

  async remove(userId: string, id: string) {
    const item = await this.ensureManager(userId, id);
    const entity = item.entity;

    await this.prisma.entity.delete({ where: { id } });

    return { message: 'Entity deleted' };
  }

  // --- Tree & Children ---

  async children(userId: string, id: string, includeCounts = false) {
    const graph = await this.getAccessibleEntityGraph(userId);
    if (!graph.has(id)) throw new ForbiddenException();

    const children: EntityGraphNode[] = Array.from(graph.values())
      .filter((item) => item.entity.parentId === id)
      .map((item) => item.entity);

    children.sort((a, b) => a.name.localeCompare(b.name));

    if (!includeCounts) return children;

    const visibleIds = Array.from(graph.keys());
    const childIds = children.map((c) => c.id);
    if (childIds.length === 0) return [];

    const [childCounts, memberCounts, courseCounts] =
      (await this.prisma.$transaction([
        this.prisma.entity.groupBy({
          by: ['parentId'],
          _count: { _all: true },
          where: {
            parentId: { in: childIds },
            id: { in: visibleIds },
          },
        }) as any, // Cast to any to avoid strict Prisma type errors on orderBy
        this.prisma.entityMember.groupBy({
          by: ['entityId'],
          _count: { _all: true },
          where: { entityId: { in: childIds } },
        }) as any,
        this.prisma.course.groupBy({
          by: ['entityId'],
          _count: { _all: true },
          where: { entityId: { in: childIds } },
        }) as any,
      ])) as [any[], any[], any[]];

    const cMap = new Map<string, number>();
    childCounts.forEach((r: any) =>
      cMap.set(r.parentId, r._count._all as number),
    );
    const mMap = new Map<string, number>();
    memberCounts.forEach((r: { entityId: string; _count: { _all: number } }) =>
      mMap.set(r.entityId, r._count._all),
    );
    const crMap = new Map<string, number>();
    courseCounts.forEach((r: { entityId: string; _count: { _all: number } }) =>
      crMap.set(r.entityId, r._count._all),
    );

    return children.map((c) => ({
      ...c,
      counts: {
        children: cMap.get(c.id) ?? 0,
        members: mMap.get(c.id) ?? 0,
        courses: crMap.get(c.id) ?? 0,
      },
    }));
  }

  async tree(userId: string, id: string, q: TreeQueryDto) {
    const graph = await this.getAccessibleEntityGraph(userId);
    if (!graph.has(id)) throw new ForbiddenException();

    // Build subtree from graph
    const all = Array.from(graph.values());
    const idMap = new Map<string, EntityGraphNode>();
    all.forEach((item) =>
      idMap.set(item.entity.id, {
        ...item.entity,
        myRole: item.myRole,
        children: [],
      }),
    );

    // Link
    idMap.forEach((node) => {
      if (node.parentId && idMap.has(node.parentId)) {
        idMap.get(node.parentId)!.children!.push(node);
      }
    });

    const root = idMap.get(id);

    // Helper to sort and limit depth if needed
    // q.depth, q.flat, q.includeCounts
    // Note: implementing flat/depth locally is easier.

    if (q.flat) {
      // Traverse and flatten
      const list: EntityGraphNode[] = [];
      const traverse = (node: EntityGraphNode, depth: number) => {
        if (q.depth != null && depth > q.depth) return;
        const { children, ...rest } = node;
        void children; // Suppress unused
        list.push({ ...rest, depth });
        if (node.children) {
          node.children.sort((a, b) => a.name.localeCompare(b.name));
          node.children.forEach((c) => traverse(c, depth + 1));
        }
      };
      if (root) traverse(root, 0);
      return list;
    }

    // Tree structure already built. Just need to prune by depth if needed and sort.
    const prune = (node: EntityGraphNode, depth: number) => {
      if (q.depth != null && depth >= q.depth) {
        node.children = [];
        return;
      }
      if (node.children) {
        node.children.sort((a, b) => a.name.localeCompare(b.name));
        node.children.forEach((c) => prune(c, depth + 1));
      }
    };
    if (root) prune(root, 0);

    return root;
  }

  async ancestors(userId: string, id: string) {
    const graph = await this.getAccessibleEntityGraph(userId);
    if (!graph.has(id)) throw new ForbiddenException();

    const list: EntityGraphNode[] = [];
    let currentId: string | null = id;
    while (currentId && graph.has(currentId)) {
      list.unshift(graph.get(currentId)!.entity);
      currentId = graph.get(currentId)!.entity.parentId;
    }
    return list;
  }

  async move(userId: string, id: string, dto: MoveEntityDto) {
    await this.ensureManager(userId, id);

    const newParentId = dto.newParentId ?? null;
    if (newParentId === id) throw new BadRequestException('Cycle detected');

    if (newParentId) {
      await this.ensureManager(userId, newParentId);

      // Anti-cycle check using graph
      const graph = await this.getAccessibleEntityGraph(userId);
      let curr = newParentId;
      while (curr && graph.has(curr)) {
        if (curr === id) throw new BadRequestException('Cycle detected');
        const node = graph.get(curr);
        if (!node || !node.entity.parentId) break;
        curr = node.entity.parentId;
      }
    }

    const moved = await this.prisma.entity.update({
      where: { id },
      data: { parentId: newParentId },
    });

    return moved;
  }

  async counts(userId: string, id: string) {
    const graph = await this.getAccessibleEntityGraph(userId);
    if (!graph.has(id)) throw new ForbiddenException();

    // Restricted to what user can see
    const accessibleIds = Array.from(graph.keys());

    const [children, members, courses] = await this.prisma.$transaction([
      this.prisma.entity.count({
        where: { parentId: id, id: { in: accessibleIds } },
      }),
      this.prisma.entityMember.count({ where: { entityId: id } }),
      this.prisma.course.count({ where: { entityId: id } }),
    ]);
    return { children, members, courses };
  }

  // --- Sub-resources (kept for controller usage if needed) ---

  async members(userId: string, id: string) {
    await this.ensureReadable(userId, id);
    return this.prisma.entityMember.findMany({
      where: { entityId: id },
      include: {
        user: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true,
            status: true,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  async courses(userId: string, id: string) {
    await this.ensureReadable(userId, id);
    return this.prisma.course.findMany({
      where: { entityId: id },
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  async invitations(userId: string, id: string) {
    // Only Manager can see invitations
    await this.ensureManager(userId, id);
    return this.prisma.entityInvitation.findMany({
      where: { entityId: id },
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  async getAccessibleEntityGraph(
    userId: string,
  ): Promise<Map<string, { entity: EntityGraphNode; myRole: string }>> {
    // 1. Fetch all explicit memberships and creations
    // Memberships first (we don't filter memberships by status, but we will filter the entity later)
    const [memberships, created] = await this.prisma.$transaction([
      this.prisma.entityMember.findMany({
        where: { userId, status: 'ACTIVE' },
        select: { entityId: true, role: true },
      }),
      this.prisma.entity.findMany({
        where: { createdById: userId, status: 'ACTIVE' },
        select: { id: true },
      }),
    ]);

    const directRoles = new Map<string, string>();
    memberships.forEach((m) => directRoles.set(m.entityId, m.role));
    created.forEach((c) => directRoles.set(c.id, 'OWNER'));

    // 2. Identify "Manager Roots"
    const managerRootIds: string[] = [];
    for (const [id, role] of directRoles.entries()) {
      if (['OWNER', 'ADMIN'].includes(role)) {
        managerRootIds.push(id);
      }
    }

    // 3. Identify "Member Leaves"
    const memberLeafIds = Array.from(directRoles.keys());

    // 4. Recursive Queries (Filtered by ACTIVE)
    let descendants: { id: string; parentId: string | null }[] = [];
    if (managerRootIds.length > 0) {
      descendants = await this.prisma.$queryRawUnsafe<
        { id: string; parentId: string | null }[]
      >(
        `
        WITH RECURSIVE children AS (
          SELECT id, "parentId" FROM "Entity" 
          WHERE id IN (${managerRootIds.map((id) => `'${id}'`).join(',')}) 
          AND status = 'ACTIVE'
          UNION
          SELECT c.id, c."parentId" FROM "Entity" c 
          INNER JOIN children p ON c."parentId" = p.id
          WHERE c.status = 'ACTIVE'
        )
        SELECT * FROM children
      `,
      );
    }

    let ancestors: EntityGraphNode[] = [];

    // Combine all IDs we know so far
    const allKnownIds = new Set([
      ...memberLeafIds,
      ...descendants.map((d) => d.id),
    ]);

    if (allKnownIds.size > 0) {
      ancestors = await this.prisma.$queryRawUnsafe<EntityGraphNode[]>(
        `
        WITH RECURSIVE parents AS (
          SELECT id, "parentId", name, type, description, picture FROM "Entity" 
          WHERE id IN (${Array.from(allKnownIds)
            .map((id) => `'${id}'`)
            .join(',')})
          AND status = 'ACTIVE'
          UNION
          SELECT p.id, p."parentId", p.name, p.type, p.description, p.picture FROM "Entity" p 
          INNER JOIN parents c ON c."parentId" = p.id
          WHERE p.status = 'ACTIVE'
        )
        SELECT DISTINCT * FROM parents
      `,
      );
    }

    // 5. Build the comprehensive Map
    // ID -> { entity, myRole }
    const accessMap = new Map<
      string,
      { entity: EntityGraphNode; myRole: string }
    >();

    // First, populate with Ancestors (Default Role = VIEWER)
    ancestors.forEach((row: EntityGraphNode) => {
      accessMap.set(row.id, {
        entity: {
          id: row.id,
          parentId: row.parentId,
          name: row.name,
          type: row.type,
          description: row.description,
          picture: row.picture,
        },
        myRole: 'VIEWER',
      });
    });

    // Apply Computed Roles
    accessMap.forEach((val, id) => {
      let role = 'VIEWER';

      // 1. Explicit Role?
      if (directRoles.has(id)) {
        role = directRoles.get(id)!;
      }

      // 2. Inherited Admin? (Is this ID a descendant of a Manager Root?)
      // If I am a descendant of a Manager Root, I should contain ADMIN rights.
      // However, if I am explicitly the OWNER, I stay OWNER.
      // If I am explicitly a MEMBER/LEARNER, but I own the parent, I should be ADMIN.
      if (descendants.some((d) => d.id === id)) {
        if (role !== 'OWNER') {
          role = 'ADMIN';
        }
      }

      val.myRole = role;
    });

    return accessMap;
  }

  // Check if user has OWNER or ADMIN role (explicit or inherited) on the entity
  private async ensureManager(userId: string, entityId: string) {
    const graph = await this.getAccessibleEntityGraph(userId);
    const item = graph.get(entityId);

    if (!item) throw new ForbiddenException('Access denied');
    if (!['OWNER', 'ADMIN'].includes(item.myRole)) {
      throw new ForbiddenException(
        'Insufficient permissions (Manager required)',
      );
    }
    return item;
  }

  async listRootEntitiesForUser(userId: string) {
    const graph = await this.getAccessibleEntityGraph(userId);
    const entities = Array.from(graph.values());

    // Build Tree
    const idMap = new Map<string, EntityGraphNode>();
    entities.forEach((item) => {
      idMap.set(item.entity.id, {
        ...item.entity,
        myRole: item.myRole,
        children: [],
      });
    });

    const roots: EntityGraphNode[] = [];
    idMap.forEach((node) => {
      if (node.parentId && idMap.has(node.parentId)) {
        idMap.get(node.parentId)!.children!.push(node);
      } else {
        roots.push(node); // It's a root relative to what the user can see
      }
    });

    // Sort by name
    const sortParams = (a: EntityGraphNode, b: EntityGraphNode) =>
      a.name.localeCompare(b.name);
    roots.sort(sortParams);
    const recursiveSort = (nodes: EntityGraphNode[]) => {
      nodes.sort(sortParams);
      if (nodes.some((n) => n.children && n.children.length > 0)) {
        nodes.forEach((n) => {
          if (n.children) recursiveSort(n.children);
        });
      }
    };
    recursiveSort(roots);

    return roots;
  }

  // Override getOne to inject myRole
  async getOne(userId: string, id: string) {
    const graph = await this.getAccessibleEntityGraph(userId);
    if (!graph.has(id)) throw new ForbiddenException();

    const item = graph.get(id)!;
    const accessibleIds = Array.from(graph.keys());

    const fullEntity = await this.prisma.entity.findUnique({
      where: { id },
      include: {
        children: {
          where: {
            id: { in: accessibleIds },
          },
          orderBy: { name: 'asc' },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstname: true,
                lastname: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!fullEntity) throw new NotFoundException();

    // Map children to inject their roles
    const childrenWithRoles = fullEntity.children.map((child) => ({
      ...child,
      myRole: graph.get(child.id)?.myRole ?? 'VIEWER',
    }));

    return {
      ...fullEntity,
      children: childrenWithRoles,
      myRole: item.myRole,
    };
  }

  // --- Keep legacy helpers for internal checks (write operations) ---

  // Wrapper for backward compatibility (used by children, etc.)
  // --- Archiving ---

  async archive(userId: string, id: string) {
    // Standard manager check works because entity is currently ACTIVE
    await this.ensureManager(userId, id);

    const archived = await this.prisma.entity.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });

    return archived;
  }

  async unarchive(userId: string, id: string) {
    // CANNOT use ensureManager because it relies on getAccessibleEntityGraph which filters out ARCHIVED.
    // We must manually verify Manager role on the specific (archived) entity.

    // 1. Fetch entity + user membership
    const entity = await this.prisma.entity.findUnique({
      where: { id },
      include: {
        members: {
          where: { userId },
        },
      },
    });

    if (!entity) throw new NotFoundException();

    // 2. Check Permissions
    let isManager = false;
    if (entity.createdById === userId) isManager = true;
    else {
      const role = entity.members[0]?.role;
      if (role && ['OWNER', 'ADMIN'].includes(role)) isManager = true;
    }

    if (!isManager) throw new ForbiddenException('Manager access required');

    // 3. Unarchive
    const unarchived = await this.prisma.entity.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });

    return unarchived;
  }

  async listArchives(userId: string) {
    // Fetch entities where:
    // 1. User is Creator (Implicit Owner)
    // 2. User is Member with Role OWNER or ADMIN
    // AND Status is ARCHIVED

    const archived = await this.prisma.entity.findMany({
      where: {
        status: 'ARCHIVED',
        OR: [
          { createdById: userId },
          {
            members: {
              some: {
                userId,
                role: { in: ['OWNER', 'ADMIN'] },
              },
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        picture: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return archived;
  }

  private async getMemberVisibleEntityIds(
    userId: string,
  ): Promise<Set<string>> {
    const graph = await this.getAccessibleEntityGraph(userId);
    return new Set(graph.keys());
  }

  private async ensureReadable(
    userId: string,
    id: string,
    visibleIds?: Set<string>,
  ) {
    const ids = visibleIds ?? (await this.getMemberVisibleEntityIds(userId));
    if (!ids.has(id)) throw new ForbiddenException();
  }

  // Deprecated: use ensureManager instead
  private async ensureMine(userId: string, id: string) {
    return this.ensureManager(userId, id);
  }
}
