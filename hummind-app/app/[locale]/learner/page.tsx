"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, ChevronRight, Folder, Users } from "lucide-react";
import {
  LearnerService,
  type LearnerOrg,
} from "../../../src/services/learner.service";
import { OrgDetailView } from "../../../src/components/learner/OrgDetailView";

export default function LearnerDashboard() {
  const [orgs, setOrgs] = useState<LearnerOrg[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const res = await LearnerService.getDashboard();
      if (cancelled) return;
      setOrgs(res.data?.organisations ?? []);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // Learner has no organisation membership at all
  if (orgs.length === 0) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
        <Folder className="h-12 w-12 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          Vous n&apos;êtes membre d&apos;aucune organisation pour le moment.
        </p>
      </div>
    );
  }

  // ─── Single org → direct detail ───
  if (orgs.length === 1) {
    return <OrgDetailView org={orgs[0]} />;
  }

  // ─── Multiple orgs → card grid ───
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <h2 className="text-xl font-bold sm:text-2xl">Mes organisations</h2>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {orgs.map((org) => (
          <OrgCard key={org.id} org={org} />
        ))}
      </div>
    </div>
  );
}

// ─── Org Card ───

function OrgCard({ org }: { org: LearnerOrg }) {
  return (
    <Link href={`/learner/org/${org.id}`}>
      <div className="group flex flex-col rounded-2xl border border-border bg-white/2 p-5 transition-colors hover:border-primary/40 hover:bg-white/4">
        {/* Header */}
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-muted">
            {org.picture ? (
              <img
                src={org.picture}
                alt={org.name}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <Folder className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-semibold">{org.name}</h3>
            {org.description && (
              <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                {org.description}
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            {org.salles.length} salle{org.salles.length > 1 ? "s" : ""}
          </span>
          <span className="flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5" />
            {org.courses.length} cours
          </span>
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-end text-xs font-medium text-primary opacity-0 transition group-hover:opacity-100">
          Voir les cours
          <ChevronRight className="ml-1 h-3.5 w-3.5" />
        </div>
      </div>
    </Link>
  );
}
