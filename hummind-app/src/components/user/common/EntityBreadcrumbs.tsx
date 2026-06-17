"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { EntityAncestor } from "../../../dto/entity.dto";
import { getEntityDetailHref, getEntityRootLabel } from "../../../lib/entityNavigation";
import { EntityService } from "../../../services/entity.service";

interface EntityBreadcrumbsProps {
  current: Pick<EntityAncestor, "id" | "name" | "type">;
}

export function EntityBreadcrumbs({ current }: EntityBreadcrumbsProps) {
  const [ancestors, setAncestors] = useState<EntityAncestor[]>([]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const res = await EntityService.ancestors(current.id);
      if (!mounted || res.status !== 200 || !Array.isArray(res.data)) {
        return;
      }

      setAncestors(res.data);
    };

    void load();

    return () => {
      mounted = false;
    };
  }, [current.id]);

  const trail = useMemo(() => {
    const chain = ancestors.length > 0 ? ancestors : [current];

    return [
      { label: getEntityRootLabel(), href: "/organisation" },
      ...chain.map((item) => ({
        label: item.name,
        href: getEntityDetailHref(item),
      })),
    ];
  }, [ancestors, current]);

  return (
    <nav
      aria-label="Fil d'ariane"
      className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground sm:text-sm"
    >
      {trail.map((item, index) => {
        const isLast = index === trail.length - 1;

        return (
          <div key={`${item.href}-${item.label}`} className="flex items-center gap-2">
            {isLast ? (
              <span className="font-medium text-white/80">{item.label}</span>
            ) : (
              <Link href={item.href} className="transition hover:text-white/90">
                {item.label}
              </Link>
            )}

            {!isLast && <ChevronRight className="h-3.5 w-3.5 text-white/35" />}
          </div>
        );
      })}
    </nav>
  );
}
