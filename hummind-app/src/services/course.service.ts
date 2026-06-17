import { safeFetch, type SafeResponse } from "./safeFetch";

const COURSE_API_URL = "/courses";

export type CourseSummary = {
  id: string;
  title: string;
  description?: string | null;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  visibility?: "UNLIMITED" | "LIMITED" | "PUBLIC";
  createdAt?: string;
  updatedAt?: string;
  entityId?: string;
};

export class CourseService {
  static async getEntityCourse(
    entityId: string,
  ): Promise<SafeResponse<CourseSummary[]>> {
    return safeFetch<CourseSummary[]>(`${COURSE_API_URL}/entity/${entityId}`, {
      method: "GET",
    });
  }

  static async getCourseByID(
    courseId: string,
  ): Promise<SafeResponse<unknown>> {
    return safeFetch<unknown>(`${COURSE_API_URL}/${courseId}`, {
      method: "GET",
    });
  }

  static async create(payload: unknown): Promise<SafeResponse<unknown>> {
    return safeFetch(`${COURSE_API_URL}`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  static async update(
    courseId: string,
    payload: unknown,
  ): Promise<SafeResponse<unknown>> {
    return safeFetch(`${COURSE_API_URL}/${courseId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  static async delete(courseId: string): Promise<SafeResponse<void>> {
    return safeFetch<void>(`${COURSE_API_URL}/${courseId}`, {
      method: "DELETE",
    });
  }
}
