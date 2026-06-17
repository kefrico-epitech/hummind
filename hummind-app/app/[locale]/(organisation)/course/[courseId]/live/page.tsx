"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useParams } from "next/navigation";
import { AlertCircle, Check, Menu, RefreshCcw, Scale } from "lucide-react";
import { OrgPageSkeleton } from "../../../../../../src/components/layout/org/OrgPageSkeleton";
import { normalizeCourseDetail } from "../../../../../../src/lib/course/courseDetail";
import { buildCourseLiveViewModel } from "../../../../../../src/lib/course/liveViewModel";
import { cn } from "../../../../../../src/lib/utils";
import { CourseService } from "../../../../../../src/services/course.service";
import { useAppSelector } from "../../../../../../src/store/hooks";
import { CourseLiveChatPanel } from "./_components/CourseLiveChatPanel";
import { CourseMenuOverlay } from "./_components/CourseMenuOverlay";
import { getUserInitials, type CourseMenuTab } from "./_components/course-live-data";

type NormalizedCourseData = NonNullable<ReturnType<typeof normalizeCourseDetail>>;

const liveCourseCache = new Map<string, NormalizedCourseData>();

function getLiveStepStorageKey(courseId: string) {
  return `hummind-live:selected-step:${courseId}`;
}

function readStoredSelectedStep(courseId: string) {
  if (!courseId || typeof window === "undefined") return null;

  try {
    const value = window.sessionStorage.getItem(getLiveStepStorageKey(courseId));
    return value?.trim() ? value : null;
  } catch {
    return null;
  }
}

function HeaderActionButton({
  children,
  highlighted = false,
  label,
  onClick,
}: {
  children: ReactNode;
  highlighted?: boolean;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-full border transition",
        highlighted
          ? "border-[#4E4B83] bg-[#31304C] text-white shadow-[0_12px_32px_rgba(79,75,131,0.28)]"
          : "border-white/8 bg-white/3 text-white/88 hover:bg-white/6",
      )}
    >
      {children}
    </button>
  );
}

function CourseProgressRange({ value }: { value: number }) {
  const normalizedValue = Number.isFinite(value) ? value : 0;
  const clampedValue = Math.max(0, Math.min(100, normalizedValue));
  const markerPosition = Math.max(2, Math.min(98, clampedValue));
  const progressLabel = `${Math.round(clampedValue)}%`;

  return (
    <div className="relative w-full pt-1 pb-1">
      <div className="h-2 rounded-full bg-white/8">
        <div
          className="h-full rounded-full bg-[#00A374] shadow-[0_0_14px_rgba(0,163,116,0.24)]"
          style={{ width: `${clampedValue}%` }}
        />
      </div>

      <div
        className="pointer-events-none absolute top-0 z-10 -translate-x-1/2"
        style={{ left: `${markerPosition}%` }}
      >
        <div className="h-[1.15rem] w-[1.15rem] rounded-full border-[3px] border-[#00A374] bg-[#262628] shadow-[0_0_0_3px_rgba(38,38,40,0.92)]" />
      </div>

      <span
        className="pointer-events-none absolute top-5 -translate-x-1/2 text-[0.78rem] font-semibold tracking-[0.01em] text-white/88"
        style={{ left: `${markerPosition}%` }}
      >
        {progressLabel}
      </span>
    </div>
  );
}

export default function CourseLivePage() {
  const params = useParams<{ courseId: string; locale: string }>();
  const user = useAppSelector((state) => state.user.user);
  const courseId = useMemo(() => {
    if (typeof params?.courseId === "string") return params.courseId;
    return Array.isArray(params?.courseId) ? params.courseId[0] : "";
  }, [params]);
  const locale = useMemo(() => {
    if (typeof params?.locale === "string") return params.locale;
    return Array.isArray(params?.locale) ? params.locale[0] : "fr";
  }, [params]);
  const initialCourseData = useMemo(
    () => (courseId ? liveCourseCache.get(courseId) ?? null : null),
    [courseId],
  );

  const [showCourseMenu, setShowCourseMenu] = useState(false);
  const [menuTab, setMenuTab] = useState<CourseMenuTab>("modules");
  const [selectedStepId, setSelectedStepId] = useState<string | null>(() =>
    readStoredSelectedStep(courseId),
  );
  const [retryKey, setRetryKey] = useState(0);
  const [loading, setLoading] = useState(() =>
    courseId ? initialCourseData === null : false,
  );
  const [error, setError] = useState<string | null>(null);
  const [courseData, setCourseData] = useState<NormalizedCourseData | null>(
    initialCourseData,
  );

  const userInitials = getUserInitials(user?.firstname, user?.lastname);
  const liveViewModel = useMemo(
    () =>
      courseData ? buildCourseLiveViewModel(courseData, selectedStepId) : null,
    [courseData, selectedStepId],
  );
  const currentStep = liveViewModel?.steps[liveViewModel.currentStepIndex] ?? null;
  const nextStep = currentStep
    ? liveViewModel?.steps[liveViewModel.currentStepIndex + 1] ?? null
    : null;
  const currentModuleSteps = useMemo(
    () =>
      currentStep
        ? liveViewModel?.steps.filter(
            (stepItem) => stepItem.moduleId === currentStep.moduleId,
          ) ?? []
        : [],
    [currentStep, liveViewModel?.steps],
  );

  useEffect(() => {
    const cachedCourse = courseId ? liveCourseCache.get(courseId) ?? null : null;
    setCourseData(cachedCourse);
    setSelectedStepId(readStoredSelectedStep(courseId));
    setError(null);
    setLoading(courseId ? cachedCourse === null : false);
  }, [courseId]);

  useEffect(() => {
    if (!courseId || typeof window === "undefined") return;

    try {
      const storageKey = getLiveStepStorageKey(courseId);

      if (selectedStepId) {
        window.sessionStorage.setItem(storageKey, selectedStepId);
      } else {
        window.sessionStorage.removeItem(storageKey);
      }
    } catch {
      // Ignore storage errors and keep the live usable.
    }
  }, [courseId, selectedStepId]);

  useEffect(() => {
    let cancelled = false;

    const loadCourse = async () => {
      if (!courseId) {
        setCourseData(null);
        setError("Cours introuvable.");
        setLoading(false);
        return;
      }

      const cachedCourse = retryKey === 0 ? liveCourseCache.get(courseId) ?? null : null;

      if (cachedCourse) {
        setCourseData(cachedCourse);
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(cachedCourse === null);
      setError(null);

      try {
        const { data, status, error: serviceError } =
          await CourseService.getCourseByID(courseId);

        if (cancelled) return;

        if (status !== 200 || !data) {
          setCourseData(null);
          setError(serviceError || "Impossible de charger le cours.");
          return;
        }

        const normalizedCourse = normalizeCourseDetail(data, courseId);

        if (!normalizedCourse) {
          setCourseData(null);
          setError("Format de cours invalide.");
          return;
        }

        liveCourseCache.set(courseId, normalizedCourse);
        setCourseData(normalizedCourse);
      } catch {
        if (cancelled) return;
        setCourseData(null);
        setError("Impossible de charger le cours.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadCourse();

    return () => {
      cancelled = true;
    };
  }, [courseId, retryKey]);

  if (loading) {
    return (
      <div className="h-full overflow-y-auto bg-[#262628] px-4 py-6 sm:px-6 lg:px-8">
        <OrgPageSkeleton variant="course" />
      </div>
    );
  }

  if (error || !liveViewModel) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center bg-[#262628] px-4 py-6 text-white">
        <div className="w-full max-w-md rounded-[1.5rem] border border-white/8 bg-[#2E2F34] p-6 text-center shadow-[0_24px_60px_rgba(0,0,0,0.24)]">
          <div className="mx-auto inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#3A3131] text-[#F0B4B4]">
            <AlertCircle className="h-5 w-5" />
          </div>
          <h1 className="mt-4 text-lg font-semibold text-white">
            Impossible d&apos;afficher ce live
          </h1>
          <p className="mt-2 text-sm leading-6 text-white/65">
            {error || "Le cours n&apos;a pas pu etre charge correctement."}
          </p>
          <button
            type="button"
            onClick={() => setRetryKey((current) => current + 1)}
            className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
          >
            <RefreshCcw className="h-4 w-4" />
            Reessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden bg-[#262628] text-white">
        <header className="sticky top-0 z-30 shrink-0 border-b border-white/6 bg-background/96 px-4 py-4 backdrop-blur sm:px-6 lg:px-10">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 md:grid-cols-[minmax(0,18rem)_minmax(18rem,34rem)_18rem] md:gap-5 lg:grid-cols-[minmax(0,20rem)_minmax(20rem,40rem)_20rem]">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/12 text-[#D7D7D7]">
                <Check className="h-3 w-3" />
              </div>

              <p className="min-w-0 truncate text-[0.86rem] font-semibold tracking-[0.01em] text-white/95 sm:text-[0.94rem]">
                {liveViewModel.section}
              </p>
            </div>

            <div className="hidden w-full max-w-[40rem] justify-self-center md:block">
              <CourseProgressRange value={liveViewModel.progressPercentage} />
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <HeaderActionButton highlighted label="Outils juridiques">
                <Scale className="h-4 w-4" />
              </HeaderActionButton>

              <HeaderActionButton
                label="Menu du cours"
                onClick={() => setShowCourseMenu(true)}
              >
                <Menu className="h-4 w-4" />
              </HeaderActionButton>
            </div>
          </div>

          <div className="mt-2.5 md:hidden">
            <CourseProgressRange value={liveViewModel.progressPercentage} />
          </div>
        </header>

        {courseData && currentStep ? (
          <CourseLiveChatPanel
            key={courseId}
            course={courseData}
            step={currentStep}
            moduleSteps={currentModuleSteps}
            courseSteps={liveViewModel.steps}
            stepIndex={liveViewModel.currentStepIndex}
            stepTotal={liveViewModel.steps.length}
            nextStep={nextStep}
            locale={locale}
            userInitials={userInitials}
            onSelectStep={setSelectedStepId}
          />
        ) : null}
      </div>

      <AnimatePresence>
        {showCourseMenu ? (
          <CourseMenuOverlay
            modules={liveViewModel.menuModules}
            scorePanels={liveViewModel.scorePanels}
            onSelectStep={setSelectedStepId}
            tab={menuTab}
            onTabChange={setMenuTab}
            onClose={() => setShowCourseMenu(false)}
          />
        ) : null}
      </AnimatePresence>
    </>
  );
}
