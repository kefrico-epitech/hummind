"use client";

import * as React from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "../ui/button";
import { ArchivePill } from "./ArchivePill";

export type OrgCard = {
  id: string;
  name: string;
  description?: string;
  type?:
    | "ORGANISATION"
    | "DEPARTEMENT"
    | "SALLE_ASSOCIEE"
    | "SALLE_INDEPENDANTE";
  picture?: string | null;
};

export function ArchivesTab({
  organisations,
  onUnarchive,
}: {
  organisations: OrgCard[];
  onUnarchive: (org: OrgCard) => void;
}) {
  const card =
    "rounded-xl border border-white/10 bg-white/5 transition hover:bg-white/10";
  const [activeFilter, setActiveFilter] = React.useState<
    OrgCard["type"] | "ALL"
  >("ALL");

  const filteredOrgs =
    activeFilter === "ALL"
      ? organisations
      : organisations.filter((org) => org.type === activeFilter);

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-white/90">
        Gestion des archives
      </h2>

      <div className="flex flex-wrap gap-2">
        <ArchivePill
          active={activeFilter === "ALL"}
          onClick={() => setActiveFilter("ALL")}
        >
          Tout
        </ArchivePill>
        <ArchivePill
          active={activeFilter === "ORGANISATION"}
          onClick={() => setActiveFilter("ORGANISATION")}
        >
          Mes organisations
        </ArchivePill>
        <ArchivePill
          active={activeFilter === "DEPARTEMENT"}
          onClick={() => setActiveFilter("DEPARTEMENT")}
        >
          Mes departements
        </ArchivePill>
        <ArchivePill
          active={activeFilter === "SALLE_ASSOCIEE"}
          onClick={() => setActiveFilter("SALLE_ASSOCIEE")}
        >
          Mes salles associees
        </ArchivePill>
        <ArchivePill
          active={activeFilter === "SALLE_INDEPENDANTE"}
          onClick={() => setActiveFilter("SALLE_INDEPENDANTE")}
        >
          Mes salles independantes
        </ArchivePill>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[320px,1fr]">
        {filteredOrgs.length === 0 ? (
          <div className="col-span-full rounded-lg border border-white/10 bg-white/5 p-6 text-center text-sm text-white/60">
            Aucun element disponible pour ce type
          </div>
        ) : (
          filteredOrgs.map((org) => (
            <div key={org.id} className={`${card} p-4`}>
              <div className="flex items-start gap-3">
                {org.picture ? (
                  // Remote archive images can come from dynamic upload domains.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={org.picture}
                    alt={org.name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white/80">
                    {org.name.charAt(0)}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-white/90">
                      {org.name}
                    </p>
                    {org.type && (
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/60">
                        {org.type}
                      </span>
                    )}
                  </div>

                  <p className="mt-1 line-clamp-2 text-xs text-white/50">
                    {org.description ?? "-"}
                  </p>

                  <div className="mt-4">
                    <Button
                      variant="secondary"
                      className="h-8 rounded-full px-3 text-xs text-white/80 hover:bg-primary/80 hover:text-white"
                      onClick={() => onUnarchive(org)}
                    >
                      Desarchiver <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}

        <div className="min-h-60 rounded-lg bg-transparent" />
      </div>
    </div>
  );
}
