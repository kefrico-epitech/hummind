"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Circle,
  FileText,
  HelpCircle,
  Layers,
  PenLine,
  PlayCircle,
} from "lucide-react";
import { Button } from "../../../../../src/components/ui/button";
import {
  LearnerService,
  computeCourseStats,
  type CourseDetail,
  type CourseModule,
  type CourseBlock,
  type LearnerCourseProgress,
} from "../../../../../src/services/learner.service";

// ─── Block icon helper ───

function blockIcon(type: string) {
  switch (type) {
    case "quiz":
      return <HelpCircle className="h-3.5 w-3.5" />;
    case "exercise":
      return <PenLine className="h-3.5 w-3.5" />;
    default:
      return null;
  }
}

// ─── Module progress helpers ───

function getModuleProgress(
  mod: CourseModule,
  completedBlockIds: string[],
) {
  const trackable = (mod.blocks || []).filter(
    (b) => b.type !== "title" && b.type !== "image",
  );
  if (!trackable.length) return { done: 0, total: 0, percent: 0 };
  const done = trackable.filter((b) => completedBlockIds.includes(b.id)).length;
  return {
    done,
    total: trackable.length,
    percent: Math.round((done / trackable.length) * 100),
  };
}

type ModuleStatus = "not_started" | "in_progress" | "completed";

function getModuleStatus(percent: number): ModuleStatus {
  if (percent >= 100) return "completed";
  if (percent > 0) return "in_progress";
  return "not_started";
}

function getResumeModule(
  modules: CourseModule[],
  completedBlockIds: string[],
): { module: CourseModule; index: number } | null {
  // Find first module that is in_progress or not_started
  for (let i = 0; i < modules.length; i++) {
    const prog = getModuleProgress(modules[i], completedBlockIds);
    if (prog.percent < 100) return { module: modules[i], index: i };
  }
  return null;
}

// ─── Component ───

export default function LearnerCourseDetail() {
  const params = useParams();
  const courseId = params.courseId as string;

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [progress, setProgress] = useState<LearnerCourseProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);

      const [courseRes, progressRes] = await Promise.all([
        LearnerService.getCourse(courseId),
        LearnerService.getProgress(courseId),
      ]);

      if (cancelled) return;
      setCourse(courseRes.data ?? null);
      setProgress(progressRes.data ?? null);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">Cours introuvable.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/learner">Retour</Link>
        </Button>
      </div>
    );
  }

  const stats = computeCourseStats(course.content);
  const pct = progress?.progressPercent ?? 0;
  const modules = course.content?.modules ?? [];
  const completedBlockIds = progress?.completedBlockIds ?? [];
  const resumeModule = getResumeModule(modules, completedBlockIds);

  const actionLabel =
    pct >= 100
      ? "Reviser mon cours"
      : pct > 0
        ? `Continuer : ${resumeModule?.module.title ?? "Mon cours"}`
        : "Commencer mon cours";

  const completedModules = modules.filter(
    (m) => getModuleProgress(m, completedBlockIds).percent >= 100,
  ).length;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      {/* Back link */}
      <Link
        href="/learner"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <span>←</span> Retour
      </Link>

      {/* ─── Course header ─── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-primary/10 sm:h-24 sm:w-24">
          {course.picture ? (
            <img
              src={course.picture}
              alt=""
              className="h-full w-full rounded-2xl object-cover"
            />
          ) : (
            <BookOpen className="h-8 w-8 text-primary" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold sm:text-2xl">{course.title}</h1>
          {course.description && (
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {course.description}
            </p>
          )}

          {/* Global progress bar */}
          {pct > 0 && (
            <div className="mt-3">
              <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                <span>Progression globale</span>
                <span className="font-semibold text-foreground">{pct}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Objectives ─── */}
      {course.objectives?.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Objectifs du cours</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {course.objectives.map((obj, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="text-sm">{obj}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <hr className="border-border" />

      {/* ─── Main content: Timeline + Stats sidebar ─── */}
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Timeline */}
        <section className="min-w-0 flex-1">
          <h2 className="mb-5 text-lg font-semibold">Mes modules de cours</h2>
          <div className="space-y-4">
            {modules.map((mod, modIdx) => (
              <ModuleTimeline
                key={mod.id}
                module={mod}
                index={modIdx}
                completedBlockIds={completedBlockIds}
              />
            ))}
          </div>
        </section>

        {/* Stats sidebar */}
        <aside className="w-full shrink-0 lg:w-72">
          <div className="sticky top-6 rounded-2xl border border-border bg-white/2 p-5">
            <h3 className="mb-4 text-base font-bold">{course.title}</h3>

            <div className="space-y-3 text-sm">
              <StatRow icon={Layers} label="Modules" value={`${completedModules}/${stats.modules}`} />
              <StatRow icon={FileText} label="Lecons" value={stats.lessons} />
              <StatRow icon={HelpCircle} label="Quiz" value={`${progress?.quizCorrect ?? 0}/${stats.quizzes}`} />
              <StatRow icon={PenLine} label="Exercices" value={`${progress?.exercisesCompleted ?? 0}/${stats.exercises ?? stats.quizzes}`} />
              <StatRow icon={BarChart3} label="Progres" value={`${pct}%`} />
            </div>

            {/* ─── CTA: go to live ─── */}
            <Button className="mt-5 w-full rounded-full" asChild>
              <Link href={`/learner/course/${courseId}/live`}>
                <PlayCircle className="mr-1.5 h-4 w-4" />
                {pct > 0 && pct < 100
                  ? `Continuer`
                  : pct >= 100
                    ? "Reviser"
                    : "Commencer"}
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>

            {/* Resume hint */}
            {pct > 0 && pct < 100 && resumeModule && (
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Chapitre {resumeModule.index + 1} : {resumeModule.module.title}
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

// ─── Module timeline with progress ───

function ModuleTimeline({
  module: mod,
  index,
  completedBlockIds,
}: {
  module: CourseModule;
  index: number;
  completedBlockIds: string[];
}) {
  const items = mod.blocks.filter((b) => b.type !== "title" && b.type !== "image");
  const prog = getModuleProgress(mod, completedBlockIds);
  const status = getModuleStatus(prog.percent);

  const statusIcon =
    status === "completed" ? (
      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
    ) : status === "in_progress" ? (
      <PlayCircle className="h-5 w-5 text-primary" />
    ) : (
      <Circle className="h-5 w-5 text-muted-foreground/40" />
    );

  const bgClass =
    status === "completed"
      ? "bg-emerald-500/10 border-emerald-500/20"
      : status === "in_progress"
        ? "bg-primary/10 border-primary/20"
        : "bg-muted/30 border-border";

  return (
    <div>
      <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${bgClass}`}>
        {statusIcon}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">
              Module {index + 1}
            </p>
            {prog.total > 0 && (
              <span className="text-xs font-semibold text-muted-foreground">
                {prog.percent}%
              </span>
            )}
          </div>
          <p className="truncate text-sm font-semibold">{mod.title}</p>
          {/* Mini progress bar */}
          {prog.total > 0 && (
            <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-black/10">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  status === "completed" ? "bg-emerald-500" : "bg-primary"
                }`}
                style={{ width: `${prog.percent}%` }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="ml-5 border-l-2 border-border pl-6 pt-2">
        {items.map((block, i) => (
          <TimelineItem
            key={block.id}
            block={block}
            index={i}
            completed={completedBlockIds.includes(block.id)}
          />
        ))}
      </div>
    </div>
  );
}

function TimelineItem({
  block,
  index,
  completed,
}: {
  block: CourseBlock;
  index: number;
  completed: boolean;
}) {
  const isQuizOrExercise = block.type === "quiz" || block.type === "exercise";
  const label =
    block.title ||
    block.text?.split("\n")[0]?.slice(0, 80) ||
    `Element ${index + 1}`;

  return (
    <div className="relative flex items-start gap-3 pb-5">
      <div
        className={[
          "absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full border-2 text-[10px] font-bold",
          completed
            ? "border-emerald-500 bg-emerald-500 text-white"
            : isQuizOrExercise
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background text-muted-foreground",
        ].join(" ")}
      >
        {completed ? (
          <CheckCircle2 className="h-3.5 w-3.5" />
        ) : (
          blockIcon(block.type) ?? index + 1
        )}
      </div>
      <span
        className={`text-sm ${completed ? "text-muted-foreground line-through" : "text-muted-foreground"}`}
      >
        {label}
      </span>
    </div>
  );
}

// ─── Stat row ───

function StatRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  value: number | string;
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="text-muted-foreground">
        {label} : <span className="font-medium text-foreground">{value}</span>
      </span>
    </div>
  );
}
