import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

import { EntityService } from '../entity/entity.service';
import { EntityGraphNode } from '../entity/entity.service';

@Injectable()
export class StatsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entityService: EntityService,
  ) {}

  // Main Global Dashboard Endpoint
  async getGlobalStats(userId: string) {
    // 1. Get Accessible Graph
    // map<entityId, { entity, myRole }>
    const graphMap: Map<string, { entity: EntityGraphNode; myRole: string }> =
      await this.entityService.getAccessibleEntityGraph(userId);

    // If no access, return empty
    if (graphMap.size === 0) {
      return {
        kpis: {
          organisations: 0,
          departments: 0,
          rooms: 0,
          courses: 0,
          participants: 0,
          responsibles: 0,
        },
        organisationStats: [],
      };
    }

    const allEntityIds = Array.from(graphMap.keys());

    // 2. Fetch Bulk Data (Courses & Members)
    // We group by entityId to avoid N+1
    const [courses, members] = await Promise.all([
      this.prisma.course.findMany({
        where: { entityId: { in: allEntityIds } },
        select: { entityId: true },
      }),
      this.prisma.entityMember.findMany({
        where: { entityId: { in: allEntityIds } },
        select: { entityId: true, userId: true, role: true },
      }),
    ]);

    // 3. Prepare In-Memory Lookups
    const courseCountMap = new Map<string, number>();
    courses.forEach((c) => {
      courseCountMap.set(c.entityId, (courseCountMap.get(c.entityId) || 0) + 1);
    });

    // Map<entityId, { participants: Set<userId>, responsables: Set<userId> }>
    const memberMap = new Map<
      string,
      { participants: Set<string>; responsables: Set<string> }
    >();

    members.forEach((m) => {
      if (!memberMap.has(m.entityId)) {
        memberMap.set(m.entityId, {
          participants: new Set(),
          responsables: new Set(),
        });
      }
      const entry = memberMap.get(m.entityId)!;

      if (['LEARNER', 'VIEWER'].includes(m.role)) {
        entry.participants.add(m.userId);
      } else if (['OWNER', 'ADMIN', 'INSTRUCTOR'].includes(m.role)) {
        entry.responsables.add(m.userId);
      }
    });

    // 4. Calculate Global KPIs (Unique Users across the whole universe)
    const globalParticipants = new Set<string>();
    const globalResponsables = new Set<string>();
    let totalCourses = 0;
    let countOrg = 0;
    let countDept = 0;
    let countRoom = 0;

    graphMap.forEach((node) => {
      const type = node.entity.type;
      if (type === 'ORGANISATION') countOrg++;
      if (type === 'DEPARTEMENT') countDept++;
      if (type === 'SALLE') countRoom++;

      // Valid entity in graph -> add its metrics
      if (courseCountMap.has(node.entity.id)) {
        totalCourses += courseCountMap.get(node.entity.id)!;
      }
      if (memberMap.has(node.entity.id)) {
        const m = memberMap.get(node.entity.id)!;
        m.participants.forEach((uid) => globalParticipants.add(uid));
        m.responsables.forEach((uid) => globalResponsables.add(uid));
      }
    });

    const kpis = {
      organisations: countOrg,
      departments: countDept,
      rooms: countRoom,
      courses: totalCourses,
      participants: globalParticipants.size,
      responsibles: globalResponsables.size,
    };

    // 5. Calculate Per-Organization Stats
    // Identify Roots from Graph
    const roots: string[] = [];
    graphMap.forEach((node, id) => {
      if (!node.entity.parentId || !graphMap.has(node.entity.parentId)) {
        roots.push(id);
      }
    });

    // Build adjacency list
    const childrenMap = new Map<string, string[]>();
    graphMap.forEach((node) => {
      if (node.entity.parentId && graphMap.has(node.entity.parentId)) {
        const pid = node.entity.parentId;
        if (!childrenMap.has(pid)) childrenMap.set(pid, []);
        childrenMap.get(pid)!.push(node.entity.id);
      }
    });

    const detailedOrgStats = await Promise.all(
      roots.map(async (rootId) => {
        const rootNode = graphMap.get(rootId)!;

        let subDepts = 0;
        let subRooms = 0;
        let subCourses = 0;
        const subParticipants = new Set<string>();
        const subResponsables = new Set<string>();

        const stack = [rootId];
        while (stack.length > 0) {
          const currId = stack.pop()!;
          const curr = graphMap.get(currId);
          if (!curr) continue;

          // Type Counters
          if (curr.entity.type === 'DEPARTEMENT') subDepts++;
          if (curr.entity.type === 'SALLE') subRooms++;

          // Courses & People
          if (courseCountMap.has(currId))
            subCourses += courseCountMap.get(currId)!;
          if (memberMap.has(currId)) {
            memberMap
              .get(currId)!
              .participants.forEach((u) => subParticipants.add(u));
            memberMap
              .get(currId)!
              .responsables.forEach((u) => subResponsables.add(u));
          }

          // Push children
          const kids = childrenMap.get(currId);
          if (kids) {
            kids.forEach((k) => stack.push(k));
          }
        }

        const rootEntityDB = await this.prisma.entity.findUnique({
          where: { id: rootId },
          select: { createdAt: true },
        });

        return {
          id: rootNode.entity.id,
          name: rootNode.entity.name,
          departments: subDepts,
          rooms: subRooms,
          participants: subParticipants.size,
          responsables: subResponsables.size,
          courses: subCourses,
          createdAt: rootEntityDB?.createdAt ?? new Date(),
        };
      }),
    );

    return {
      kpis,
      organisationStats: detailedOrgStats,
    };
  }
}
