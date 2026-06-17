"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "../../ui/button";
import type { Entity } from "../../../dto/entity.dto";
import { OrgCardMenu } from "../../common/OrgCardMenu";
import { getEntityOpenLabel } from "../../../lib/entityNavigation";

interface OrgCardListProps {
  orgs: Entity[];
  type: "organisation" | "departement" | "salle";
  onArchived?: () => void | Promise<void>;
}

export default function OrgCardList({
  orgs,
  type,
  onArchived,
}: OrgCardListProps) {
  const goLink = (entity: Entity) => `/${type}/${entity.id}`;

  return (
    <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
      {orgs.map((org) => {
        const isAuthorised = org.myRole === "OWNER" || org.myRole === "ADMIN";

        return (
          <div
            key={org.id}
            className="min-h-[200px] w-full min-w-0 rounded-2xl border border-white/10 bg-white/2 p-4 text-white shadow-[0_18px_45px_rgba(0,0,0,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/7"
          >
            <div className="relative z-10 flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
                <span className="text-sm font-semibold text-white/90">
                  {(org.name?.[0] || "O").toUpperCase()}
                </span>
              </div>
              {isAuthorised && (
                <OrgCardMenu org={org} type={type} onArchived={onArchived} />
              )}
            </div>

            <div className="relative z-10 mt-3 space-y-1.5">
              <h3 className="line-clamp-1 text-sm font-semibold text-white/90">
                {org.name}
              </h3>
              <p className="line-clamp-2 text-xs leading-relaxed text-white/55">
                {org.description || "Aucune description n'a ete fournie."}
              </p>
            </div>

            <div className="relative z-10 mt-4 flex items-center gap-2">
              <Link href={goLink(org)} className="flex-1">
                <Button
                  className={[
                    "h-9 w-full justify-between rounded-full px-4 text-xs font-medium",
                    "bg-[#6D64FF] text-white hover:bg-[#6157FF]",
                  ].join(" ")}
                >
                  {getEntityOpenLabel(type)}
                  <ArrowRight className="h-4 w-4 opacity-90 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Button>
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
