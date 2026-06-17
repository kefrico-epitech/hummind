"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, MoreHorizontal, Search } from "lucide-react";
import { Button } from "../ui/button";
import {
  computeCourseStats,
  type LearnerOrg,
  type LearnerCourse,
} from "../../services/learner.service";

function progressColor(pct: number) {
  if (pct >= 100) return "bg-emerald-500";
  if (pct > 0) return "bg-primary";
  return "bg-muted-foreground/30";
}

function progressLabel(pct: number) {
  if (pct >= 100) return "Reprendre mon cours";
  if (pct > 0) return "Continuer mon cours";
  return "Commencer mon cours";
}

// ─── Main component ───

interface OrgDetailViewProps {
  org: LearnerOrg;
  showBackLink?: boolean;
}

export function OrgDetailView({ org, showBackLink = false }: OrgDetailViewProps) {
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | string>("all");

  const courses = org.courses;

  const departments = useMemo(
    () =>
      org.salles
        .map((s) => s.departmentName)
        .filter(Boolean)
        .filter((v, i, a) => a.indexOf(v) === i),
    [org.salles],
  );

  const filteredCourses = useMemo(() => {
    let list = courses;
    if (filter !== "all") {
      list = list.filter((c) => c.entityId === filter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [courses, filter, search]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      {/* Back link */}
      {showBackLink && (
        <Link
          href="/learner"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <span>←</span> Mes organisations
        </Link>
      )}

      {/* ─── Organization card ─── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-muted sm:h-28 sm:w-28">
          {org.picture ? (
            <img
              src={org.picture}
              alt={org.name}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            <BookOpen className="h-10 w-10 text-muted-foreground" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold sm:text-2xl">{org.name}</h2>
          {org.description && (
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {org.description}
            </p>
          )}
          {departments.length > 0 && (
            <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-muted-foreground/40" />
              Vous appartenez aux départements {departments.join(", ")}
            </p>
          )}
        </div>
      </div>

      {/* ─── Mes salles ─── */}
      {org.salles.length > 0 && (
        <section>
          <h3 className="mb-3 text-lg font-semibold">Mes salles</h3>
          <div className="flex flex-wrap gap-2">
            {org.salles.map((s) => (
              <span
                key={s.id}
                className="inline-flex items-center rounded-full bg-primary/80 px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                {s.name}
              </span>
            ))}
          </div>
        </section>
      )}

      <hr className="border-border" />

      {/* ─── Mes cours ─── */}
      <section>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold">Mes cours</h3>

          <div className="flex items-center gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="all">Tous</option>
              {org.salles.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              aria-label="Rechercher un cours"
              onClick={() => setSearchOpen((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:bg-secondary"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Search input */}
        {searchOpen && (
          <input
            autoFocus
            type="search"
            placeholder="Rechercher un cours..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-4 h-9 w-full max-w-xs rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none ring-1 ring-primary"
          />
        )}

        {/* Course grid */}
        {filteredCourses.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Aucun cours disponible pour le moment.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ─── Course Card ───

function CourseCard({ course }: { course: LearnerCourse }) {
  const stats = computeCourseStats(course.content);
  const pct = course.progress.progressPercent;

  return (
    <div className="flex flex-col rounded-2xl border border-border bg-white/2 p-4">
      {/* Header */}
      <div className="mb-3 flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted">
          {course.picture ? (
            <img
              src={course.picture}
              alt={course.title}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            <BookOpen className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-semibold">{course.title}</h4>
          <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {course.description ?? `${stats.modules} modules`}
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-4 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all ${progressColor(pct)}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="shrink-0 text-xs font-medium text-muted-foreground">
          {pct}%
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button asChild size="sm" className="flex-1 rounded-full text-xs">
          <Link href={`/learner/course/${course.id}`}>
            {progressLabel(pct)}
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Link>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          aria-label="Plus d'options"
          className="h-8 w-8 shrink-0 rounded-full"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
