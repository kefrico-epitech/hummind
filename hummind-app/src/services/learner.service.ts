import { safeFetch, type SafeResponse } from "./safeFetch";

// ─── Course content types (from JSON structure) ───

export type BlockType = "title" | "content" | "quiz" | "exercise" | "image";

export interface CourseBlock {
  id: string;
  type: BlockType;
  title: string;
  text: string;
  status: string;
  data?: Record<string, unknown>;
}

export interface CourseModule {
  id: string;
  title: string;
  blocks: CourseBlock[];
}

export interface CourseContent {
  modules: CourseModule[];
}

// ─── Progress types (from backend) ───

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

// ─── Backend response types ───

export interface LearnerCourse {
  id: string;
  title: string;
  description: string | null;
  picture: string | null;
  objectives: string[];
  content: CourseContent | null;
  status: string;
  entityId: string;
  entityName: string;
  createdAt: string;
  progress: LearnerCourseProgress;
}

export interface LearnerSalle {
  id: string;
  name: string;
  departmentName: string | null;
}

export interface LearnerOrg {
  id: string;
  name: string;
  description: string | null;
  picture: string | null;
  type: string;
  departments: { id: string; name: string }[];
  salles: LearnerSalle[];
  courses: LearnerCourse[];
}

export interface LearnerDashboardResponse {
  organisations: LearnerOrg[];
}

// Keep for course detail page compatibility
export interface CourseDetail {
  id: string;
  title: string;
  description?: string | null;
  picture?: string | null;
  objectives: string[];
  content: CourseContent | null;
  status: string;
  entityId: string;
  createdAt: string;
}

// ─── Stats computed from content ───

export interface CourseStats {
  modules: number;
  lessons: number;
  quizzes: number;
  exercises: number;
}

export function computeCourseStats(content: CourseContent | null): CourseStats {
  if (!content?.modules) return { modules: 0, lessons: 0, quizzes: 0, exercises: 0 };

  let lessons = 0;
  let quizzes = 0;
  let exercises = 0;

  for (const mod of content.modules) {
    for (const block of mod.blocks) {
      if (block.type === "content") lessons++;
      else if (block.type === "quiz") quizzes++;
      else if (block.type === "exercise") exercises++;
    }
  }

  return { modules: content.modules.length, lessons, quizzes, exercises };
}

// ─── API calls ───

export class LearnerService {
  /** Dashboard: orgs + salles + courses with progress (single call) */
  static async getDashboard(): Promise<SafeResponse<LearnerDashboardResponse>> {
    return safeFetch<LearnerDashboardResponse>("/learner/dashboard", { method: "GET" });
  }

  /** Single org detail */
  static async getOrgDetail(orgId: string): Promise<SafeResponse<LearnerOrg>> {
    return safeFetch<LearnerOrg>(`/learner/org/${orgId}`, { method: "GET" });
  }

  /** Course details (uses existing endpoint) */
  static async getCourse(courseId: string): Promise<SafeResponse<CourseDetail>> {
    return safeFetch<CourseDetail>(`/courses/${courseId}`, { method: "GET" });
  }

  /** Get progress for a course */
  static async getProgress(courseId: string): Promise<SafeResponse<LearnerCourseProgress>> {
    return safeFetch<LearnerCourseProgress>(`/learner/progress/${courseId}`, { method: "GET" });
  }

  /** Start a course */
  static async startCourse(courseId: string): Promise<SafeResponse<unknown>> {
    return safeFetch(`/learner/progress/${courseId}/start`, { method: "POST" });
  }

  /** Mark a block as completed */
  static async completeBlock(
    courseId: string,
    blockId: string,
    meta?: { quizCorrect?: boolean; isExercise?: boolean; lastStepId?: string },
  ): Promise<SafeResponse<unknown>> {
    return safeFetch(`/learner/progress/${courseId}/block/${blockId}`, {
      method: "POST",
      body: meta ?? {},
    });
  }

  /** Update last step for resume */
  static async updateStep(courseId: string, lastStepId: string): Promise<SafeResponse<unknown>> {
    return safeFetch(`/learner/progress/${courseId}/step`, {
      method: "POST",
      body: { lastStepId },
    });
  }
}
