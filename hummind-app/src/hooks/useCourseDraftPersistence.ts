"use client";

import { useEffect, useRef } from "react";
import { shallowEqual } from "react-redux";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { setBuilderModules, updateDraft } from "../store/slices/courseSlice";
import { updateCourseSetup } from "../store/slices/courseSetupSlice";
import {
  clearPersistedCourseDraft,
  loadPersistedCourseDraft,
  type PersistedCourseDraft,
  type PersistedCourseSetupSnapshot,
  type PersistedCourseSnapshot,
  savePersistedCourseDraft,
} from "../lib/courseDraftStorage";

function isDraftStateEmpty(args: {
  course: PersistedCourseSnapshot;
  setup: PersistedCourseSetupSnapshot;
}) {
  const { course, setup } = args;

  return (
    !course.title.trim() &&
    !course.description.trim() &&
    !course.domain.trim() &&
    !course.level.trim() &&
    !course.style.trim() &&
    !course.objectives.trim() &&
    !course.extractedData?.trim() &&
    !course.startDate.trim() &&
    !course.endDate.trim() &&
    !course.link.trim() &&
    course.builder.modules.length === 0 &&
    !setup.title.trim() &&
    !setup.description.trim() &&
    !setup.domain.trim() &&
    !setup.level.trim() &&
    !setup.style.trim() &&
    setup.objectives.length === 0 &&
    !setup.extractedData?.trim()
  );
}

function buildPersistedDraft(args: {
  course: PersistedCourseSnapshot;
  setup: PersistedCourseSetupSnapshot;
}): PersistedCourseDraft {
  return {
    course: {
      mode: args.course.mode,
      title: args.course.title,
      description: args.course.description,
      content: args.course.content,
      visibility: args.course.visibility,
      allowComments: args.course.allowComments,
      domain: args.course.domain,
      level: args.course.level,
      style: args.course.style,
      objectives: args.course.objectives,
      extractedData: args.course.extractedData,
      startDate: args.course.startDate,
      endDate: args.course.endDate,
      link: args.course.link,
      rooms: args.course.rooms,
      status: args.course.status,
      builder: {
        modules: args.course.builder.modules,
      },
    },
    courseSetup: {
      mode: args.setup.mode,
      title: args.setup.title,
      description: args.setup.description,
      domain: args.setup.domain,
      level: args.setup.level,
      style: args.setup.style,
      objectives: args.setup.objectives,
      extractedData: args.setup.extractedData,
    },
  };
}

export function useCourseDraftPersistence({
  storageKey,
  enabled,
}: {
  storageKey: string;
  enabled: boolean;
}) {
  const dispatch = useAppDispatch();
  const course = useAppSelector(
    (state) => ({
      mode: state.course.mode,
      title: state.course.title,
      description: state.course.description,
      content: state.course.content,
      visibility: state.course.visibility,
      allowComments: state.course.allowComments,
      domain: state.course.domain,
      level: state.course.level,
      style: state.course.style,
      objectives: state.course.objectives,
      extractedData: state.course.extractedData,
      startDate: state.course.startDate,
      endDate: state.course.endDate,
      link: state.course.link,
      rooms: state.course.rooms,
      status: state.course.status,
      builder: state.course.builder,
    }),
    shallowEqual,
  ) as PersistedCourseSnapshot;
  const courseSetup = useAppSelector(
    (state) => ({
      mode: state.courseSetup.mode,
      title: state.courseSetup.title,
      description: state.courseSetup.description,
      domain: state.courseSetup.domain,
      level: state.courseSetup.level,
      style: state.courseSetup.style,
      objectives: state.courseSetup.objectives,
      extractedData: state.courseSetup.extractedData,
    }),
    shallowEqual,
  ) as PersistedCourseSetupSnapshot;
  const hydratedRef = useRef(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestDraftRef = useRef<PersistedCourseDraft>(
    buildPersistedDraft({ course, setup: courseSetup }),
  );

  useEffect(() => {
    latestDraftRef.current = buildPersistedDraft({ course, setup: courseSetup });
  }, [course, courseSetup]);

  useEffect(() => {
    hydratedRef.current = false;
  }, [storageKey]);

  useEffect(() => {
    if (!enabled || hydratedRef.current) return;

    hydratedRef.current = true;

    if (!isDraftStateEmpty({ course, setup: courseSetup })) {
      return;
    }

    const persistedDraft = loadPersistedCourseDraft(storageKey);
    const persistedCourse = persistedDraft?.course;
    const persistedCourseSetup = persistedDraft?.courseSetup;

    if (Array.isArray(persistedCourse?.builder?.modules)) {
      dispatch(setBuilderModules(persistedCourse.builder.modules));
    }

    if (persistedCourse) {
      dispatch(
        updateDraft({
          mode: persistedCourse.mode ?? null,
          title: persistedCourse.title ?? "",
          description: persistedCourse.description ?? "",
          content: persistedCourse.content ?? "",
          visibility: persistedCourse.visibility ?? "Illimité",
          allowComments:
            typeof persistedCourse.allowComments === "boolean"
              ? persistedCourse.allowComments
              : true,
          domain: persistedCourse.domain ?? "",
          level: persistedCourse.level ?? "",
          style: persistedCourse.style ?? "",
          objectives: persistedCourse.objectives ?? "",
          extractedData: persistedCourse.extractedData ?? undefined,
          document: null,
          startDate: persistedCourse.startDate ?? "",
          endDate: persistedCourse.endDate ?? "",
          link: persistedCourse.link ?? "",
          rooms: Array.isArray(persistedCourse.rooms)
            ? persistedCourse.rooms
            : [],
          status: persistedCourse.status ?? "DRAFT",
        }),
      );
    }

    if (persistedCourseSetup) {
      dispatch(
        updateCourseSetup({
          mode: persistedCourseSetup.mode ?? null,
          title: persistedCourseSetup.title ?? "",
          description: persistedCourseSetup.description ?? "",
          domain: persistedCourseSetup.domain ?? "",
          level: persistedCourseSetup.level ?? "",
          style: persistedCourseSetup.style ?? "",
          objectives: Array.isArray(persistedCourseSetup.objectives)
            ? persistedCourseSetup.objectives
            : [],
          extractedData: persistedCourseSetup.extractedData ?? undefined,
        }),
      );
    }
  }, [course, courseSetup, dispatch, enabled, storageKey]);

  useEffect(() => {
    if (!enabled || !hydratedRef.current) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      savePersistedCourseDraft(storageKey, latestDraftRef.current);
    }, 180);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [course, courseSetup, enabled, storageKey]);

  useEffect(() => {
    if (!enabled) return;

    const flushDraft = () => {
      savePersistedCourseDraft(storageKey, latestDraftRef.current);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushDraft();
      }
    };

    window.addEventListener("pagehide", flushDraft);
    window.addEventListener("beforeunload", flushDraft);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pagehide", flushDraft);
      window.removeEventListener("beforeunload", flushDraft);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      flushDraft();
    };
  }, [enabled, storageKey]);

  return {
    clearPersistedDraft: () => clearPersistedCourseDraft(storageKey),
  };
}
