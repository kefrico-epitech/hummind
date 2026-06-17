"use client";

import Link from "next/link";
import { Button } from "../ui/button";
import { ArrowRight } from "lucide-react";
import type { Entity } from "../../dto/entity.dto";
import { OrgCardMenu } from "../common/OrgCardMenu";
import { getEntityOpenLabel } from "../../lib/entityNavigation";

type Props = {
  org: Entity;
  onArchived?: () => void | Promise<void>;
};

export default function OrgCard({ org, onArchived }: Props) {
  const goLink = `/organisation/${org.id}`;
  const isAutorised = org.myRole === "OWNER" || org.myRole === "ADMIN";

  return (
    <div className="flex min-h-[230px] w-full flex-col rounded-3xl border border-white/10 bg-white/4 p-4 text-white shadow-[0_22px_45px_rgba(0,0,0,0.28)] transition-all duration-300 hover:-translate-y-0.5 hover:border-white/15">
      <div className="flex h-[60px] w-[60px] items-center justify-center rounded-full bg-white/15">
        <span className="text-sm font-semibold text-white/90">
          {(org.name?.[0] || "O").toUpperCase()}
        </span>
      </div>

      <div className="mt-3 space-y-1.5">
        <h3 className="line-clamp-1 text-base font-semibold leading-tight text-white/95 sm:text-lg">
          {org.name}
        </h3>
        <p className="line-clamp-2 text-[14px] leading-relaxed text-white/55">
          {org.description || "Aucune description n'a ete fournie."}
        </p>
      </div>

      <div className="mt-auto flex items-center gap-2 pt-4">
        <Link href={goLink} className="flex-1">
          <Button
            className={[
              "group h-10 w-full justify-center gap-2 rounded-full px-4 text-sm font-medium",
              "bg-[#6D64FF] text-white hover:bg-[#6157FF]",
            ].join(" ")}
          >
            {getEntityOpenLabel("organisation")}
            <ArrowRight className="h-4 w-4 opacity-90 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Button>
        </Link>
        {isAutorised && <OrgCardMenu org={org} onArchived={onArchived} />}
      </div>
    </div>
  );
}
