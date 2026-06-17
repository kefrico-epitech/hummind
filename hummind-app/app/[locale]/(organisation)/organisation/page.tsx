"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { Button } from "../../../../src/components/ui/button";
import { EntityService } from "../../../../src/services/entity.service";
import type { Entity } from "../../../../src/dto/entity.dto";
import OrgCard from "../../../../src/components/organisation/OrgCard";
import OnboardingWelcome from "../../../../src/components/organisation/OnboardingWelcome";

export default function OrganisationHomePage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [orgs, setOrgs] = useState<Entity[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [accessibleEntityCount, setAccessibleEntityCount] = useState<number | null>(
    null,
  );
  const isEntryFlow = searchParams.get("entry") === "1";

  const loadOrganisations = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await EntityService.list();
    if (res.status === 200 && res.data) {
      const resData = res.data;
      setAccessibleEntityCount(resData.length);
      const filtered = resData.filter((org) => org.type === "ORGANISATION");
      setOrgs(filtered);
    } else {
      setAccessibleEntityCount(null);
      setOrgs([]);
      setError(res.error || "Impossible de recuperer les organisations");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const load = async () => {
      await loadOrganisations();
    };
    void load();
  }, [loadOrganisations]);

  // Flow v2.0 — quand un user vient de finaliser son compte (?entry=1) et
  // n'a aucune organisation, on affiche le wizard d'onboarding 3 étapes
  // inline plutôt que de rediriger vers /organisation/create.
  if (!loading && isEntryFlow && accessibleEntityCount === 0) {
    return <OnboardingWelcome />;
  }

  return (
    <main className="min-h-svh bg-background text-foreground">
      <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-5 sm:py-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-medium text-foreground/90 sm:text-2xl">Mes organisations</h1>

          <Link href="/organisation/create" className="w-full sm:w-auto">
            <Button
              variant="auth"
              size="sm"
              className="h-10 w-full rounded-full bg-white/10 px-4 text-sm text-foreground/90 hover:bg-white/5 sm:w-auto"
            >
              <PlusCircle className="mr-2 h-3.5 w-3.5" />
              Creer une organisation
            </Button>
          </Link>
        </header>

        <section className="mt-4 sm:mt-5">
          {error ? (
            <div className="mb-4 w-full max-w-xl rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="h-10 w-10 rounded-full bg-white/10" />
              <div className="mt-4 h-4 w-24 rounded bg-white/10" />
              <div className="mt-2 h-3 w-full rounded bg-white/10" />
              <div className="mt-2 h-3 w-3/4 rounded bg-white/10" />
              <div className="mt-4 h-8 w-full rounded-full bg-white/10" />
            </div>
          ) : orgs.length === 0 ? (
            <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-foreground/80">Aucune organisation.</p>
              <p className="mt-1 text-xs text-foreground/50">Creez-en une pour commencer.</p>
              <div className="mt-4">
                <Link href="/organisation/create">
                  <Button className="h-8 rounded-full px-4 text-xs">Creer maintenant</Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
              {orgs.map((org) => (
                <OrgCard
                  key={org.id}
                  org={org}
                  onArchived={loadOrganisations}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

