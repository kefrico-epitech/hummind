import type { Module } from "../../components/course/types";

type CourseStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED" | "";

export type CourseDetail = {
  id: string;
  title: string;
  description: string;
  domain: string;
  level: string;
  objectives: string[];
  status: CourseStatus;
  entityId: string;
  modules: Module[];
  raw: Record<string, unknown>;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asTrimmed(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asModules(value: unknown): Module[] {
  return Array.isArray(value) ? (value as Module[]) : [];
}

function normalizeStatus(value: unknown): CourseStatus {
  return value === "DRAFT" || value === "PUBLISHED" || value === "ARCHIVED"
    ? value
    : "";
}

export function normalizeObjectives(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => asTrimmed(item)).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  }

  return [];
}

export function extractRawCourse(data: unknown): Record<string, unknown> | null {
  const root = asRecord(data);
  if (!root) return null;

  const nested = asRecord(root.data);
  if (nested && (nested.id || nested.title || nested.content || nested.builder)) {
    return nested;
  }

  return root;
}

export function extractModules(raw: Record<string, unknown>): Module[] {
  const builder = asRecord(raw.builder);
  const content = asRecord(raw.content);

  const fromBuilder = asModules(builder?.modules);
  if (fromBuilder.length > 0) return fromBuilder;

  const fromContent = asModules(content?.modules);
  if (fromContent.length > 0) return fromContent;

  return asModules(raw.modules);
}

export function normalizeCourseDetail(
  data: unknown,
  fallbackCourseId = "",
): CourseDetail | null {
  const raw = extractRawCourse(data);
  if (!raw) return null;

  const fallbackDescription =
    typeof raw.content === "string" ? asTrimmed(raw.content) : "";

  return {
    id: asTrimmed(raw.id) || fallbackCourseId || "course",
    title: asTrimmed(raw.title) || "Cours",
    description: asTrimmed(raw.description) || fallbackDescription,
    domain: asTrimmed(raw.domain),
    level: asTrimmed(raw.level),
    objectives: normalizeObjectives(raw.objectives),
    status: normalizeStatus(raw.status),
    entityId: asTrimmed(raw.entityId),
    modules: extractModules(raw),
    raw,
  };
}
