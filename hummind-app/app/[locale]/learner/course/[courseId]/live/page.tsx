"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useParams } from "next/navigation";
import { AlertCircle, ArrowLeft, Check, Menu, PenLine, RefreshCcw, Scale } from "lucide-react";
import Link from "next/link";
import { normalizeCourseDetail } from "../../../../../../src/lib/course/courseDetail";
import { buildCourseLiveViewModel } from "../../../../../../src/lib/course/liveViewModel";
import { buildLiveSteps } from "../../../../../../src/lib/course/liveCourse";
import { cn } from "../../../../../../src/lib/utils";
import { CourseService } from "../../../../../../src/services/course.service";
import { useAppSelector } from "../../../../../../src/store/hooks";
import { useLearnerLiveSync } from "../../../../../../src/hooks/useLearnerLiveSync";
import { useLearnerNotes } from "../../../../../../src/hooks/useLearnerNotes";
import { safeFetch } from "../../../../../../src/services/safeFetch";

// Reuse the org live components
import { CourseLiveChatPanel } from "../../../../(organisation)/course/[courseId]/live/_components/CourseLiveChatPanel";
import { CourseMenuOverlay } from "../../../../(organisation)/course/[courseId]/live/_components/CourseMenuOverlay";
import { getUserInitials, type CourseMenuTab } from "../../../../(organisation)/course/[courseId]/live/_components/course-live-data";

import { NotesPanel } from "../../../../../../src/components/learner/NotesPanel";

type NormalizedCourseData = NonNullable<ReturnType<typeof normalizeCourseDetail>>;

const liveCourseCache = new Map<string, NormalizedCourseData>();

// ─── UI helpers ───

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
  const clampedValue = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  const markerPosition = Math.max(2, Math.min(98, clampedValue));

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
        {Math.round(clampedValue)}%
      </span>
    </div>
  );
}

// ─── Main page ───

export default function LearnerCourseLivePage() {
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

  const [showCourseMenu, setShowCourseMenu] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [menuTab, setMenuTab] = useState<CourseMenuTab>("modules");
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sessionsReady, setSessionsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [courseData, setCourseData] = useState<NormalizedCourseData | null>(null);
  const [backendProgress, setBackendProgress] = useState(0);

  const userInitials = getUserInitials(user?.firstname, user?.lastname);

  // ─── Build step→module map from course data ───
  const stepToModule = useMemo(() => {
    const map = new Map<string, string>();
    if (!courseData) return map;

    try {
      const steps = buildLiveSteps(courseData.modules, courseData.description);
      for (const step of steps) {
        map.set(step.id, step.moduleId);
      }
    } catch {
      // Ignore build errors
    }
    return map;
  }, [courseData]);

  // ─── Sync hook ───
  const onSessionsLoaded = useCallback((lastStepId: string | null) => {
    if (lastStepId) setSelectedStepId(lastStepId);
    setSessionsReady(true);
  }, []);

  const { syncToBackend, syncNow } = useLearnerLiveSync({
    courseId,
    stepToModule,
    onSessionsLoaded,
  });

  // ─── Notes hook ───
  const {
    notes,
    addNote,
    updateNote,
    deleteNote,
  } = useLearnerNotes(courseId);

  // ─── ViewModel ───
  const liveViewModel = useMemo(
    () => courseData ? buildCourseLiveViewModel(courseData, selectedStepId) : null,
    [courseData, selectedStepId],
  );

  const currentStep = liveViewModel?.steps[liveViewModel.currentStepIndex] ?? null;
  const nextStep = currentStep
    ? liveViewModel?.steps[liveViewModel.currentStepIndex + 1] ?? null
    : null;
  const currentModuleSteps = useMemo(
    () =>
      currentStep
        ? liveViewModel?.steps.filter((s) => s.moduleId === currentStep.moduleId) ?? []
        : [],
    [currentStep, liveViewModel?.steps],
  );

  // ─── Load course ───
  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!courseId) {
        setError("Cours introuvable");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Load course data
        let normalized = liveCourseCache.get(courseId) ?? null;

        if (!normalized) {
          const courseRes = await CourseService.getCourseByID(courseId);
          if (cancelled) return;

          if (courseRes.status !== 200 || !courseRes.data) {
            setError("Impossible de charger le cours");
            setLoading(false);
            return;
          }

          normalized = normalizeCourseDetail(courseRes.data, courseId);
          if (normalized) liveCourseCache.set(courseId, normalized);
        }

        if (!normalized) {
          setError("Format de cours invalide");
          setLoading(false);
          return;
        }

        setCourseData(normalized);

        // Get backend progress
        const progressRes = await safeFetch<{ progressPercent: number; lastStepId: string | null }>(
          `/learner/progress/${courseId}`,
          { method: "GET" },
        );
        if (!cancelled && progressRes.data) {
          setBackendProgress(progressRes.data.progressPercent);
          if (progressRes.data.lastStepId && !selectedStepId) {
            setSelectedStepId(progressRes.data.lastStepId);
          }
        }

        // Mark course as started
        void safeFetch(`/learner/progress/${courseId}/start`, { method: "POST" });

        if (!cancelled) setLoading(false);
      } catch {
        if (!cancelled) {
          setError("Impossible de charger le cours");
          setLoading(false);
        }
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [courseId, retryKey]);

  // ─── Track step changes ───
  const handleSelectStep = useCallback(
    (stepId: string | null) => {
      setSelectedStepId(stepId);
      if (stepId && courseId) {
        void safeFetch(`/learner/progress/${courseId}/step`, {
          method: "POST",
          body: { lastStepId: stepId },
        });
        // Sync session to backend on step change
        syncToBackend();
      }
    },
    [courseId, syncToBackend],
  );

  // ─── Sync on any interaction (polling the sessionStorage) ───
  useEffect(() => {
    if (!sessionsReady) return;
    const interval = setInterval(syncToBackend, 4000);
    return () => clearInterval(interval);
  }, [sessionsReady, syncToBackend]);

  // ─── Save on unmount ───
  useEffect(() => {
    return () => { syncNow(); };
  }, [syncNow]);

  const displayProgress = backendProgress > 0
    ? backendProgress
    : liveViewModel?.progressPercentage ?? 0;

  // ─── Loading state ───
  if (loading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-[#262628]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // ─── Error state ───
  if (error || !liveViewModel) {
    return (
      <div className="flex h-dvh items-center justify-center bg-[#262628] px-4 text-white">
        <div className="w-full max-w-md rounded-[1.5rem] border border-white/8 bg-[#2E2F34] p-6 text-center shadow-lg">
          <div className="mx-auto inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#3A3131] text-[#F0B4B4]">
            <AlertCircle className="h-5 w-5" />
          </div>
          <h1 className="mt-4 text-lg font-semibold">Impossible d&apos;afficher ce live</h1>
          <p className="mt-2 text-sm leading-6 text-white/65">
            {error || "Le cours n'a pas pu être chargé."}
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <Link
              href={`/learner/course/${courseId}`}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4" /> Retour
            </Link>
            <button
              type="button"
              onClick={() => setRetryKey((c) => c + 1)}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
            >
              <RefreshCcw className="h-4 w-4" /> Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid h-dvh min-h-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden bg-[#262628] text-white">
        {/* Header */}
        <header className="sticky top-0 z-30 shrink-0 border-b border-white/6 bg-background/96 px-4 py-4 backdrop-blur sm:px-6 lg:px-10">
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 md:grid-cols-[minmax(0,18rem)_minmax(18rem,34rem)_18rem] md:gap-5">
            <div className="flex min-w-0 items-center gap-2.5">
              <Link
                href={`/learner/course/${courseId}`}
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/12 text-[#D7D7D7] transition hover:bg-white/20"
              >
                <ArrowLeft className="h-3 w-3" />
              </Link>

              <p className="min-w-0 truncate text-[0.86rem] font-semibold tracking-[0.01em] text-white/95 sm:text-[0.94rem]">
                {liveViewModel.section}
              </p>
            </div>

            <div className="hidden w-full max-w-[40rem] justify-self-center md:block">
              <CourseProgressRange value={displayProgress} />
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <HeaderActionButton
                highlighted={showNotes}
                label="Mes notes"
                onClick={() => setShowNotes((v) => !v)}
              >
                <PenLine className="h-4 w-4" />
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
            <CourseProgressRange value={displayProgress} />
          </div>
        </header>

        {/* Content */}
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
            onSelectStep={handleSelectStep}
          />
        ) : null}
      </div>

      {/* Menu overlay */}
      <AnimatePresence>
        {showCourseMenu ? (
          <CourseMenuOverlay
            modules={liveViewModel.menuModules}
            scorePanels={liveViewModel.scorePanels}
            onSelectStep={handleSelectStep}
            tab={menuTab}
            onTabChange={setMenuTab}
            onClose={() => setShowCourseMenu(false)}
          />
        ) : null}
      </AnimatePresence>

      {/* Notes panel */}
      <AnimatePresence>
        {showNotes ? (
          <NotesPanel
            notes={notes}
            moduleId={currentStep?.moduleId}
            stepId={currentStep?.id}
            onAdd={addNote}
            onUpdate={updateNote}
            onDelete={deleteNote}
            onClose={() => setShowNotes(false)}
          />
        ) : null}
      </AnimatePresence>
    </>
  );
}
