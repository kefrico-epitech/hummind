import type {
  CourseLiveRelatedTopic,
  CourseMenuItem,
  CourseMenuModule,
  CourseMenuScoreMetric,
  CourseMenuScorePanel,
} from "../../../../../../../src/lib/course/liveViewModel";

export type RelatedTopic = CourseLiveRelatedTopic;

export type CourseMenuTab = "modules" | "scores";

export function createMessageId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getUserInitials(
  firstname?: string | null,
  lastname?: string | null,
) {
  const initials = [firstname?.[0], lastname?.[0]]
    .filter(Boolean)
    .join("")
    .toUpperCase();

  return initials || "U";
}

export type {
  CourseMenuItem,
  CourseMenuModule,
  CourseMenuScoreMetric,
  CourseMenuScorePanel,
};
