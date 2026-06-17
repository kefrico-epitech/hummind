"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "../../ui/button";
import { Entity } from "../../../dto/entity.dto";
import { OrgCardMenu } from "../../common/OrgCardMenu";
import { CourseService } from "../../../services/course.service";
import { EntityBreadcrumbs } from "./EntityBreadcrumbs";
import {
  getEntityEditLabel,
  getEntityManagementLabel,
} from "../../../lib/entityNavigation";

interface HeaderCardProps {
  data: Entity;
  type: "organisation" | "departement" | "salle";
  archiveRedirectHref?: string;
}

function countCourses(value: unknown): number {
  if (Array.isArray(value)) {
    return value.length;
  }

  if (
    value &&
    typeof value === "object" &&
    "data" in value &&
    Array.isArray((value as { data?: unknown }).data)
  ) {
    return (value as { data: unknown[] }).data.length;
  }

  return 0;
}

export function HeaderCard({
  type,
  data,
  archiveRedirectHref,
}: HeaderCardProps) {
  const isAutorised = data.myRole === "OWNER" || data.myRole === "ADMIN";
  const isProfessor = data.myRole === "INSTRUCTOR";
  const isSalle = type === "salle";
  const [courseCount, setCourseCount] = useState(0);

  const headerDescription = !isSalle
    ? data.description || "Aucune description fournie."
    : null;

  const participantCount = useMemo(
    () =>
      data.members?.filter((member) => member.role === "LEARNER").length ?? 0,
    [data.members],
  );

  const responsible = useMemo(
    () =>
      data.members?.find(
        (member) => member.role === "OWNER" || member.role === "ADMIN",
      ) ??
      data.members?.[0] ??
      null,
    [data.members],
  );

  useEffect(() => {
    if (!isSalle) return;

    let mounted = true;
    const run = async () => {
      const res = await CourseService.getEntityCourse(data.id);
      if (!mounted) return;

      if (res.status === 200) {
        setCourseCount(countCourses(res.data));
      } else {
        setCourseCount(0);
      }
    };

    run();
    return () => {
      mounted = false;
    };
  }, [isSalle, data.id]);

  if (isSalle) {
    return (
      <div className="space-y-3">
        <EntityBreadcrumbs current={data} />

        <h1 className="text-[26px] font-semibold leading-tight tracking-tight sm:text-[30px]">
          {data.name}
        </h1>

        <div className="flex flex-wrap items-center gap-5 text-base sm:gap-6 sm:text-lg">
          <span className="text-white/80">
            <strong className="font-semibold text-white">{courseCount}</strong>{" "}
            Cours
          </span>
          <span className="text-white/80">
            <strong className="font-semibold text-white">
              {participantCount}
            </strong>{" "}
            Participants
          </span>
        </div>

        <div className="flex items-center gap-2.5 text-xs text-muted-foreground sm:text-sm">
          <div className="h-6 w-6 rounded-full border border-white/30 bg-white/70" />
          <span>
            {responsible?.user?.firstname
              ? `${responsible.user.firstname} est le responsable de la salle de ${data.name}`
              : `Responsable non defini pour la salle de ${data.name}`}
          </span>
        </div>

        <div className="flex flex-wrap gap-2.5 pt-2">
          {isAutorised && (
            <>
              <Link href={`/${type}/${data.id}/edit`}>
                <Button
                  variant="outline"
                  className="h-9 rounded-full px-4 text-sm"
                >
                  {getEntityEditLabel(type)}
                </Button>
              </Link>

              <Link href={`/${type}/${data.id}/members`}>
                <Button
                  variant="outline"
                  className="h-9 rounded-full px-4 text-sm"
                >
                  {getEntityManagementLabel(type)}
                </Button>
              </Link>

              <OrgCardMenu
                org={data}
                type={type}
                redirectTo={archiveRedirectHref}
              />
            </>
          )}
          {isProfessor && (
            <Link href={`/${type}/${data.id}/members`}>
              <Button
                variant="outline"
                className="h-9 rounded-full px-4 text-sm"
              >
                {getEntityManagementLabel(type, "view")}
              </Button>
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-7">
      <div className="flex h-18 w-18 items-center justify-center rounded-full border border-white/10 bg-linear-to-br from-white/10 to-white/5 shadow-inner sm:h-20 sm:w-20">
        <span className="text-3xl font-semibold text-white/90 sm:text-4xl">
          {data.name.charAt(0).toUpperCase()}
        </span>
      </div>

      <div className="flex-1 space-y-3">
        <EntityBreadcrumbs current={data} />

        <h1 className="font-display text-[26px] font-semibold tracking-tight sm:text-[30px]">
          {data.name}
        </h1>

        {headerDescription && (
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-[15px] sm:leading-6">
            {headerDescription}
          </p>
        )}

        <div className="flex items-center gap-3">
          <div className="flex -space-x-3">
            {data.members?.slice(0, 3).map((member, i) => (
              <div
                key={i}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-linear-to-br from-white/10 to-white/5 shadow-inner sm:h-8 sm:w-8"
              >
                <span className="text-xs font-semibold text-white/90">
                  {member.user.firstname.charAt(0).toUpperCase()}
                </span>
              </div>
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            sont les responsables
          </span>
        </div>

        {isAutorised && (
          <div className="flex flex-wrap gap-2.5 pt-2">
            <Link href={`/${type}/${data.id}/edit`}>
              <Button
                variant="outline"
                className="h-9 rounded-full px-4 text-sm"
              >
                {getEntityEditLabel(type)}
              </Button>
            </Link>

            <Link href={`/${type}/${data.id}/members`}>
              <Button
                variant="outline"
                className="h-9 rounded-full px-4 text-sm"
              >
                {getEntityManagementLabel(type)}
              </Button>
            </Link>

            <OrgCardMenu
              org={data}
              type={type}
              redirectTo={archiveRedirectHref}
            />
          </div>
        )}
      </div>
    </div>
  );
}
