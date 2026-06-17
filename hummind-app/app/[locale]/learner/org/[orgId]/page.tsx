"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "../../../../../src/components/ui/button";
import {
  LearnerService,
  type LearnerOrg,
} from "../../../../../src/services/learner.service";
import { OrgDetailView } from "../../../../../src/components/learner/OrgDetailView";

export default function LearnerOrgDetailPage() {
  const params = useParams();
  const orgId = params.orgId as string;

  const [org, setOrg] = useState<LearnerOrg | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const res = await LearnerService.getOrgDetail(orgId);
      if (cancelled) return;
      setOrg(res.data ?? null);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [orgId]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!org) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">Organisation introuvable.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/learner">Retour</Link>
        </Button>
      </div>
    );
  }

  return <OrgDetailView org={org} showBackLink />;
}
