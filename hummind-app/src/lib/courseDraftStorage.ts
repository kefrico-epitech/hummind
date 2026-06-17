"use client";

import type { RootState } from "../store";

export type PersistedCourseSnapshot = {
  mode: RootState["course"]["mode"];
  title: string;
  description: string;
  content: string;
  visibility: RootState["course"]["visibility"];
  allowComments: boolean;
  domain: string;
  level: string;
  style: string;
  objectives: string;
  extractedData?: string;
  startDate: string;
  endDate: string;
  link: string;
  rooms: string[];
  status?: RootState["course"]["status"];
  builder: {
    modules: RootState["course"]["builder"]["modules"];
  };
};

export type PersistedCourseSetupSnapshot = {
  mode: RootState["courseSetup"]["mode"];
  title: string;
  description: string;
  domain: string;
  level: string;
  style: string;
  objectives: RootState["courseSetup"]["objectives"];
  extractedData?: string;
};

export type PersistedCourseDraft = {
  course: Partial<PersistedCourseSnapshot>;
  courseSetup: Partial<PersistedCourseSetupSnapshot>;
};

type CourseDraftStorageArgs = {
  variant: "v2" | "legacy";
  mode: "creation" | "edition";
  courseId?: string;
  parentId?: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function getCourseDraftStorageKey({
  variant,
  mode,
  courseId,
  parentId,
}: CourseDraftStorageArgs) {
  const targetId =
    (mode === "edition" ? courseId : parentId) || courseId || parentId || "draft";

  return `hummind:course:draft:${variant}:${mode}:${targetId}`;
}

export function loadPersistedCourseDraft(
  storageKey: string,
): PersistedCourseDraft | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as unknown;
    const record = asRecord(parsed);
    if (!record) return null;

    const courseRecord = asRecord(record.course) ?? record;
    const courseSetupRecord = asRecord(record.courseSetup) ?? {};

    courseRecord.document = null;

    return {
      course: courseRecord as Partial<PersistedCourseSnapshot>,
      courseSetup: courseSetupRecord as Partial<PersistedCourseSetupSnapshot>,
    };
  } catch {
    return null;
  }
}

export function savePersistedCourseDraft(
  storageKey: string,
  state: PersistedCourseDraft,
) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        course: state.course,
        courseSetup: state.courseSetup,
      }),
    );
  } catch {
    // ignore storage issues
  }
}

export function clearPersistedCourseDraft(storageKey: string) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(storageKey);
  } catch {
    // ignore storage issues
  }
}
