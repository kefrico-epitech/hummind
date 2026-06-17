import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// ─── Response types ───

export interface LearnerCourseProgress {
  progressPercent: number;
  completedBlockIds: string[];
  lastStepId: string | null;
  quizCorrect: number;
  quizTotal: number;
  exercisesCompleted: number;
  exercisesTotal: number;
  startedAt: string | null;
  lastAccessedAt: string | null;
  completedAt: string | null;
}

export interface LearnerCourse {
  id: string;
  title: string;
  description: string | null;
  picture: string | null;
  objectives: string[];
  content: unknown;
  status: string;
  entityId: string;
  entityName: string;
  createdAt: Date;
  progress: LearnerCourseProgress;
}

export interface LearnerOrg {
  id: string;
  name: string;
  description: string | null;
  picture: string | null;
  type: string;
  departments: { id: string; name: string }[];
  salles: { id: string; name: string; departmentName: string | null }[];
  courses: LearnerCourse[];
}

export interface LearnerDashboardResponse {
  organisations: LearnerOrg[];
}

export interface ProgressUpdateResult {
  progressPercent: number;
  completedBlockIds: string[];
  lastStepId: string | null;
  quizCorrect: number;
  quizTotal: number;
  exercisesCompleted: number;
  exercisesTotal: number;
  completedAt: string | null;
}

// ─── Helper: count trackable blocks from course content ───

interface ContentBlock {
  id: string;
  type: string;
}

interface ContentModule {
  blocks: ContentBlock[];
}

interface CourseContent {
  modules: ContentModule[];
}

function countTrackableBlocks(content: unknown): {
  total: number;
  quizTotal: number;
  exerciseTotal: number;
} {
  const c = content as CourseContent | null;
  if (!c?.modules) return { total: 0, quizTotal: 0, exerciseTotal: 0 };

  let total = 0;
  let quizTotal = 0;
  let exerciseTotal = 0;

  for (const mod of c.modules) {
    for (const block of mod.blocks) {
      if (block.type === 'title' || block.type === 'image') continue;
      total++;
      if (block.type === 'quiz') quizTotal++;
      if (block.type === 'exercise') exerciseTotal++;
    }
  }

  return { total, quizTotal, exerciseTotal };
}

@Injectable()
export class LearnerService {
  constructor(private readonly prisma: PrismaService) {}

  // ════════════════════════════════════════════
  // PROGRESS TRACKING
  // ════════════════════════════════════════════

  /**
   * Get or create progress for a course.
   * Called when the learner opens a course (start).
   */
  async startCourse(
    userId: string,
    courseId: string,
  ): Promise<ProgressUpdateResult> {
    const existing = await this.prisma.courseProgress.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });

    if (existing) {
      // Just update lastAccessedAt
      const updated = await this.prisma.courseProgress.update({
        where: { id: existing.id },
        data: { lastAccessedAt: new Date() },
      });
      return this.toProgressResult(updated);
    }

    // Create new progress
    const created = await this.prisma.courseProgress.create({
      data: { userId, courseId },
    });
    return this.toProgressResult(created);
  }

  /**
   * Mark a block as completed.
   * Recalculates progressPercent based on course content.
   */
  async completeBlock(
    userId: string,
    courseId: string,
    blockId: string,
    meta?: {
      quizCorrect?: boolean;
      isExercise?: boolean;
      lastStepId?: string;
    },
  ): Promise<ProgressUpdateResult> {
    // Ensure progress row exists
    let progress = await this.prisma.courseProgress.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });

    if (!progress) {
      progress = await this.prisma.courseProgress.create({
        data: { userId, courseId },
      });
    }

    // Skip if already completed
    if (progress.completedBlockIds.includes(blockId)) {
      // Still update lastAccessedAt and lastStepId
      const updated = await this.prisma.courseProgress.update({
        where: { id: progress.id },
        data: {
          lastAccessedAt: new Date(),
          ...(meta?.lastStepId ? { lastStepId: meta.lastStepId } : {}),
        },
      });
      return this.toProgressResult(updated);
    }

    // Get course content to compute percentage
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { content: true },
    });

    const { total, quizTotal, exerciseTotal } = countTrackableBlocks(
      course?.content,
    );

    const newCompletedBlockIds = [...progress.completedBlockIds, blockId];
    const newPercent =
      total > 0 ? Math.round((newCompletedBlockIds.length / total) * 100) : 0;

    const quizCorrect =
      progress.quizCorrect + (meta?.quizCorrect ? 1 : 0);
    const exercisesCompleted =
      progress.exercisesCompleted + (meta?.isExercise ? 1 : 0);

    const isComplete = newPercent >= 100;

    const updated = await this.prisma.courseProgress.update({
      where: { id: progress.id },
      data: {
        completedBlockIds: newCompletedBlockIds,
        progressPercent: Math.min(newPercent, 100),
        quizCorrect,
        quizTotal,
        exercisesCompleted,
        exercisesTotal: exerciseTotal,
        lastAccessedAt: new Date(),
        lastStepId: meta?.lastStepId ?? progress.lastStepId,
        completedAt: isComplete && !progress.completedAt ? new Date() : progress.completedAt,
      },
    });

    return this.toProgressResult(updated);
  }

  /**
   * Update the last step the learner was on (for resume).
   */
  async updateLastStep(
    userId: string,
    courseId: string,
    lastStepId: string,
  ): Promise<ProgressUpdateResult> {
    const progress = await this.prisma.courseProgress.upsert({
      where: { userId_courseId: { userId, courseId } },
      create: { userId, courseId, lastStepId },
      update: { lastStepId, lastAccessedAt: new Date() },
    });
    return this.toProgressResult(progress);
  }

  /**
   * Get progress for a single course.
   */
  async getProgress(
    userId: string,
    courseId: string,
  ): Promise<LearnerCourseProgress> {
    const progress = await this.prisma.courseProgress.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });

    if (!progress) {
      return {
        progressPercent: 0,
        completedBlockIds: [],
        lastStepId: null,
        quizCorrect: 0,
        quizTotal: 0,
        exercisesCompleted: 0,
        exercisesTotal: 0,
        startedAt: null,
        lastAccessedAt: null,
        completedAt: null,
      };
    }

    return {
      progressPercent: progress.progressPercent,
      completedBlockIds: progress.completedBlockIds,
      lastStepId: progress.lastStepId,
      quizCorrect: progress.quizCorrect,
      quizTotal: progress.quizTotal,
      exercisesCompleted: progress.exercisesCompleted,
      exercisesTotal: progress.exercisesTotal,
      startedAt: progress.startedAt?.toISOString() ?? null,
      lastAccessedAt: progress.lastAccessedAt?.toISOString() ?? null,
      completedAt: progress.completedAt?.toISOString() ?? null,
    };
  }

  /**
   * Get all progress for the user (batch, for dashboard).
   */
  async getAllProgress(
    userId: string,
  ): Promise<Map<string, LearnerCourseProgress>> {
    const rows = await this.prisma.courseProgress.findMany({
      where: { userId },
    });

    const map = new Map<string, LearnerCourseProgress>();
    for (const r of rows) {
      map.set(r.courseId, {
        progressPercent: r.progressPercent,
        completedBlockIds: r.completedBlockIds,
        lastStepId: r.lastStepId,
        quizCorrect: r.quizCorrect,
        quizTotal: r.quizTotal,
        exercisesCompleted: r.exercisesCompleted,
        exercisesTotal: r.exercisesTotal,
        startedAt: r.startedAt?.toISOString() ?? null,
        lastAccessedAt: r.lastAccessedAt?.toISOString() ?? null,
        completedAt: r.completedAt?.toISOString() ?? null,
      });
    }
    return map;
  }

  private toProgressResult(row: {
    progressPercent: number;
    completedBlockIds: string[];
    lastStepId: string | null;
    quizCorrect: number;
    quizTotal: number;
    exercisesCompleted: number;
    exercisesTotal: number;
    completedAt: Date | null;
  }): ProgressUpdateResult {
    return {
      progressPercent: row.progressPercent,
      completedBlockIds: row.completedBlockIds,
      lastStepId: row.lastStepId,
      quizCorrect: row.quizCorrect,
      quizTotal: row.quizTotal,
      exercisesCompleted: row.exercisesCompleted,
      exercisesTotal: row.exercisesTotal,
      completedAt: row.completedAt?.toISOString() ?? null,
    };
  }

  // ════════════════════════════════════════════
  // DASHBOARD (with progress included)
  // ════════════════════════════════════════════

  private readonly defaultProgress: LearnerCourseProgress = {
    progressPercent: 0,
    completedBlockIds: [],
    lastStepId: null,
    quizCorrect: 0,
    quizTotal: 0,
    exercisesCompleted: 0,
    exercisesTotal: 0,
    startedAt: null,
    lastAccessedAt: null,
    completedAt: null,
  };

  async getDashboard(userId: string): Promise<LearnerDashboardResponse> {
    // 1. Memberships
    const memberships = await this.prisma.entityMember.findMany({
      where: { userId, status: 'ACTIVE' },
      select: {
        entity: {
          select: { id: true, name: true, description: true, picture: true, type: true, parentId: true },
        },
      },
    });

    const memberEntityIds = memberships.map((m) => m.entity.id);

    // 2. Published courses + progress in parallel
    const [courses, progressMap] = await Promise.all([
      this.prisma.course.findMany({
        where: { entityId: { in: memberEntityIds }, status: 'PUBLISHED' },
        select: {
          id: true, title: true, description: true, picture: true,
          objectives: true, content: true, status: true, entityId: true, createdAt: true,
          entity: { select: { id: true, name: true, parentId: true, type: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.getAllProgress(userId),
    ]);

    // 3. Build entity tree (same logic as before)
    const entityIdToRootOrg = new Map<string, string>();
    const allEntityIds = new Set<string>();

    for (const m of memberships) {
      allEntityIds.add(m.entity.id);
      if (m.entity.parentId) allEntityIds.add(m.entity.parentId);
    }
    for (const c of courses) {
      allEntityIds.add(c.entity.id);
      if (c.entity.parentId) allEntityIds.add(c.entity.parentId);
    }

    const allEntities = await this.prisma.entity.findMany({
      where: { id: { in: [...allEntityIds] } },
      select: { id: true, name: true, description: true, picture: true, type: true, parentId: true },
    });

    const parentIds = allEntities
      .map((e) => e.parentId)
      .filter((id): id is string => !!id && !allEntityIds.has(id));

    let extraParents: typeof allEntities = [];
    if (parentIds.length > 0) {
      extraParents = await this.prisma.entity.findMany({
        where: { id: { in: parentIds } },
        select: { id: true, name: true, description: true, picture: true, type: true, parentId: true },
      });

      const grandParentIds = extraParents
        .map((e) => e.parentId)
        .filter((id): id is string => !!id && !allEntityIds.has(id) && !parentIds.includes(id));

      if (grandParentIds.length > 0) {
        const gp = await this.prisma.entity.findMany({
          where: { id: { in: grandParentIds } },
          select: { id: true, name: true, description: true, picture: true, type: true, parentId: true },
        });
        extraParents = [...extraParents, ...gp];
      }
    }

    const entityMap = new Map<string, (typeof allEntities)[0]>();
    for (const e of [...allEntities, ...extraParents]) entityMap.set(e.id, e);

    function findRootOrg(entityId: string): string {
      if (entityIdToRootOrg.has(entityId)) return entityIdToRootOrg.get(entityId)!;
      const visited = new Set<string>();
      let cur = entityId;
      while (cur) {
        if (visited.has(cur)) break;
        visited.add(cur);
        const ent = entityMap.get(cur);
        if (!ent) break;
        if (ent.type === 'ORGANISATION' || !ent.parentId) {
          for (const v of visited) entityIdToRootOrg.set(v, ent.id);
          return ent.id;
        }
        cur = ent.parentId;
      }
      entityIdToRootOrg.set(entityId, entityId);
      return entityId;
    }

    // 4. Group courses by org — now with progress
    const orgCoursesMap = new Map<string, LearnerCourse[]>();

    // Seed with every org the learner is member of, even those without courses,
    // so the dashboard lists the full set of organisations.
    for (const m of memberships) {
      const rootOrgId = findRootOrg(m.entity.id);
      if (!orgCoursesMap.has(rootOrgId)) orgCoursesMap.set(rootOrgId, []);
    }

    for (const c of courses) {
      const rootOrgId = findRootOrg(c.entityId);
      if (!orgCoursesMap.has(rootOrgId)) orgCoursesMap.set(rootOrgId, []);

      orgCoursesMap.get(rootOrgId)!.push({
        id: c.id,
        title: c.title,
        description: c.description,
        picture: c.picture,
        objectives: c.objectives,
        content: c.content,
        status: c.status,
        entityId: c.entityId,
        entityName: c.entity.name,
        createdAt: c.createdAt,
        progress: progressMap.get(c.id) ?? this.defaultProgress,
      });
    }

    // 5. Build org responses
    const organisations: LearnerOrg[] = [];

    for (const [orgId, orgCourses] of orgCoursesMap) {
      const orgEntity = entityMap.get(orgId);
      if (!orgEntity) continue;

      const departments: { id: string; name: string }[] = [];
      const salles: { id: string; name: string; departmentName: string | null }[] = [];

      for (const [, entity] of entityMap) {
        if (findRootOrg(entity.id) !== orgId) continue;
        if (entity.type === 'DEPARTEMENT') {
          departments.push({ id: entity.id, name: entity.name });
        } else if (entity.type === 'SALLE') {
          const parent = entity.parentId ? entityMap.get(entity.parentId) : null;
          salles.push({ id: entity.id, name: entity.name, departmentName: parent?.name ?? null });
        }
      }

      organisations.push({
        id: orgEntity.id,
        name: orgEntity.name,
        description: orgEntity.description,
        picture: orgEntity.picture,
        type: orgEntity.type,
        departments,
        salles,
        courses: orgCourses,
      });
    }

    return { organisations };
  }

  async getOrgDetail(userId: string, orgId: string): Promise<LearnerOrg | null> {
    const dashboard = await this.getDashboard(userId);
    return dashboard.organisations.find((o) => o.id === orgId) ?? null;
  }

  // ════════════════════════════════════════════
  // SESSIONS (conversation persistence per module)
  // ════════════════════════════════════════════

  async getSessions(userId: string, courseId: string) {
    const sessions = await this.prisma.courseSession.findMany({
      where: { userId, courseId },
      orderBy: { updatedAt: 'desc' },
    });

    // Return as a map keyed by moduleId for easy frontend consumption
    const result: Record<
      string,
      {
        moduleId: string;
        messages: unknown;
        quizAnswers: unknown;
        exerciseDrafts: unknown;
        exerciseEvaluations: unknown;
        completedStepIds: string[];
        lastStepId: string | null;
        updatedAt: string;
      }
    > = {};

    for (const s of sessions) {
      result[s.moduleId] = {
        moduleId: s.moduleId,
        messages: s.messages,
        quizAnswers: s.quizAnswers,
        exerciseDrafts: s.exerciseDrafts,
        exerciseEvaluations: s.exerciseEvaluations,
        completedStepIds: s.completedStepIds,
        lastStepId: s.lastStepId,
        updatedAt: s.updatedAt.toISOString(),
      };
    }

    return result;
  }

  async saveSession(
    userId: string,
    courseId: string,
    moduleId: string,
    data: {
      messages?: unknown[];
      quizAnswers?: Record<string, unknown>;
      exerciseDrafts?: Record<string, string>;
      exerciseEvaluations?: Record<string, string>;
      completedStepIds?: string[];
      lastStepId?: string;
    },
  ) {
    const session = await this.prisma.courseSession.upsert({
      where: {
        userId_courseId_moduleId: { userId, courseId, moduleId },
      },
      create: {
        userId,
        courseId,
        moduleId,
        messages: (data.messages ?? []) as any,
        quizAnswers: (data.quizAnswers ?? {}) as any,
        exerciseDrafts: (data.exerciseDrafts ?? {}) as any,
        exerciseEvaluations: (data.exerciseEvaluations ?? {}) as any,
        completedStepIds: data.completedStepIds ?? [],
        lastStepId: data.lastStepId ?? null,
      },
      update: {
        ...(data.messages !== undefined
          ? { messages: data.messages as any }
          : {}),
        ...(data.quizAnswers !== undefined
          ? { quizAnswers: data.quizAnswers as any }
          : {}),
        ...(data.exerciseDrafts !== undefined
          ? { exerciseDrafts: data.exerciseDrafts as any }
          : {}),
        ...(data.exerciseEvaluations !== undefined
          ? { exerciseEvaluations: data.exerciseEvaluations as any }
          : {}),
        ...(data.completedStepIds !== undefined
          ? { completedStepIds: data.completedStepIds }
          : {}),
        ...(data.lastStepId !== undefined
          ? { lastStepId: data.lastStepId }
          : {}),
      },
    });

    // ─── Sync completed steps to CourseProgress ───
    // Gather ALL completedStepIds across ALL sessions for this course
    await this.syncSessionsToProgress(userId, courseId, data.lastStepId);

    return {
      moduleId: session.moduleId,
      updatedAt: session.updatedAt.toISOString(),
    };
  }

  /**
   * Synchronize all session completedStepIds into CourseProgress.
   * This keeps the progress table in sync with live session activity.
   */
  private async syncSessionsToProgress(
    userId: string,
    courseId: string,
    lastStepId?: string,
  ) {
    // 1. Gather all completedStepIds from all module sessions
    const allSessions = await this.prisma.courseSession.findMany({
      where: { userId, courseId },
      select: {
        completedStepIds: true,
        lastStepId: true,
        quizAnswers: true,
        exerciseEvaluations: true,
      },
    });

    const allCompletedIds = new Set<string>();
    let quizCorrectCount = 0;
    let exercisesCompletedCount = 0;

    for (const s of allSessions) {
      for (const stepId of s.completedStepIds) {
        allCompletedIds.add(stepId);
      }

      // Count quiz correct answers from quizAnswers JSON
      const qa = s.quizAnswers as Record<string, { correct?: boolean }> | null;
      if (qa) {
        for (const val of Object.values(qa)) {
          if (val?.correct) quizCorrectCount++;
        }
      }

      // Count completed exercises from exerciseEvaluations JSON
      const ee = s.exerciseEvaluations as Record<string, string> | null;
      if (ee) {
        for (const val of Object.values(ee)) {
          if (val === 'strong' || val === 'partial') exercisesCompletedCount++;
        }
      }
    }

    if (allCompletedIds.size === 0 && !lastStepId) return;

    // 2. Get course content for % calculation
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { content: true },
    });

    const { total, quizTotal, exerciseTotal } = countTrackableBlocks(
      course?.content,
    );

    const completedBlockIds = [...allCompletedIds];
    const progressPercent =
      total > 0
        ? Math.min(Math.round((completedBlockIds.length / total) * 100), 100)
        : 0;
    const isComplete = progressPercent >= 100;

    // 3. Upsert CourseProgress
    await this.prisma.courseProgress.upsert({
      where: { userId_courseId: { userId, courseId } },
      create: {
        userId,
        courseId,
        completedBlockIds,
        progressPercent,
        quizCorrect: quizCorrectCount,
        quizTotal,
        exercisesCompleted: exercisesCompletedCount,
        exercisesTotal: exerciseTotal,
        lastStepId: lastStepId ?? null,
        startedAt: new Date(),
        lastAccessedAt: new Date(),
      },
      update: {
        completedBlockIds,
        progressPercent,
        quizCorrect: quizCorrectCount,
        quizTotal,
        exercisesCompleted: exercisesCompletedCount,
        exercisesTotal: exerciseTotal,
        lastAccessedAt: new Date(),
        ...(lastStepId ? { lastStepId } : {}),
        ...(isComplete ? { completedAt: new Date() } : {}),
      },
    });
  }

  // ════════════════════════════════════════════
  // NOTES
  // ════════════════════════════════════════════

  async getNotes(userId: string, courseId: string) {
    return this.prisma.courseNote.findMany({
      where: { userId, courseId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        moduleId: true,
        stepId: true,
        content: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async createNote(
    userId: string,
    courseId: string,
    data: { content: string; moduleId?: string; stepId?: string },
  ) {
    return this.prisma.courseNote.create({
      data: {
        userId,
        courseId,
        content: data.content,
        moduleId: data.moduleId ?? null,
        stepId: data.stepId ?? null,
      },
      select: {
        id: true,
        moduleId: true,
        stepId: true,
        content: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async updateNote(userId: string, noteId: string, content: string) {
    // Verify ownership first
    const note = await this.prisma.courseNote.findFirst({
      where: { id: noteId, userId },
    });
    if (!note) return null;

    return this.prisma.courseNote.update({
      where: { id: noteId },
      data: { content },
      select: {
        id: true,
        moduleId: true,
        stepId: true,
        content: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async deleteNote(userId: string, noteId: string) {
    const note = await this.prisma.courseNote.findFirst({
      where: { id: noteId, userId },
    });
    if (!note) return null;

    await this.prisma.courseNote.delete({ where: { id: noteId } });
    return { id: noteId, deleted: true };
  }
}
