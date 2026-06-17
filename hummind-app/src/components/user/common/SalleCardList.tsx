"use client";

import Link from "next/link";
import { Button } from "../../ui/button";
import { ArrowRight } from "lucide-react";
import type { Entity } from "../../../dto/entity.dto";
import { OrgCardMenu } from "../../common/OrgCardMenu";
import { getEntityOpenLabel } from "../../../lib/entityNavigation";

interface SalleCardListProps {
  orgs: Entity[];
  onArchived?: () => void | Promise<void>;
}

export default function SalleCardList({
  orgs,
  onArchived,
}: SalleCardListProps) {
  const goLink = (entity: Entity) => {
    return `/salle/${entity.id}`;
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {orgs.map((org) => {
        const isAutorised = org.myRole === "OWNER" || org.myRole === "ADMIN";

        return (
          <div
            key={org.id}
            className="min-h-[100px] w-full min-w-0 rounded-2xl border border-white/10 bg-white/4 p-4 text-white shadow-[0_18px_45px_rgba(0,0,0,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:border-white/15"
          >
            {/* Header */}
            <div className="relative z-10 flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
                <span className="text-sm font-semibold text-white/90">
                  {(org.name?.[0] || "O").toUpperCase()}
                </span>
              </div>
              {isAutorised && (
                <OrgCardMenu org={org} type="salle" onArchived={onArchived} />
              )}
            </div>

            {/* Content */}
            <div className="relative z-10 mt-3">
              <h3 className="line-clamp-1 text-sm font-semibold text-white/90">
                {org.name}
              </h3>
            </div>

            {/* Footer */}
            <div className="relative z-10 mt-4">
              <Link href={goLink(org)} className="block">
                <Button
                  className={[
                    "h-9 w-full rounded-full px-4 text-xs font-medium",
                    "bg-white/10 text-white hover:bg-white/20 transition-colors",
                  ].join(" ")}
                >
                  {getEntityOpenLabel("salle")}
                  <ArrowRight className="ml-2 h-4 w-4 opacity-80" />
                </Button>
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
