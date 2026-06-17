"use client";

import * as React from "react";
import { KpiGrid } from "../../../../src/components/dashboard/KpiGrid";
import { OrganisationTable } from "../../../../src/components/dashboard/OrganisationTable";
import {
  UserService,
  type DashboardKpis,
  type DashboardOrganisationStat,
} from "../../../../src/services/user.service";

export default function OrganisationDashboardPage() {
  const [kpis, setKpis] = React.useState<DashboardKpis | null>(null);
  const [organisationStats, setOrganisationStats] = React.useState<
    DashboardOrganisationStat[]
  >([]);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  const loadData = async () => {
    try {
      setError(null);
      setLoading(true);

      const { data, error: apiError } = await UserService.getUsersStats();

      if (apiError || !data) {
        setError("Impossible de charger les statistiques. Reessayez plus tard.");
        return;
      }

      setKpis(data.kpis ?? null);
      setOrganisationStats(data.organisationStats ?? []);
    } catch {
      setError("Une erreur est survenue lors du chargement.");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    void loadData();
  }, []);

  const kpiItems = kpis
    ? [
        { label: "Nombre d'organisations", value: kpis.organisations },
        { label: "Nombre de departements", value: kpis.departments },
        { label: "Nombre de salles", value: kpis.rooms },
        { label: "Nombre de cours", value: kpis.courses },
        { label: "Nombre de participants", value: kpis.participants },
        { label: "Nombre de responsables", value: kpis.responsibles },
      ]
    : null;

  return (
    <div className="space-y-5 px-3 pb-2 sm:space-y-8 sm:px-0">
      {loading && (
        <div className="text-sm text-white/70">
          Chargement des statistiques en cours...
        </div>
      )}

      {error && (
        <div className="text-sm font-medium text-red-400 sm:text-base">
          {error}
        </div>
      )}

      {!loading && !error && kpiItems && <KpiGrid items={kpiItems} />}

      {!loading && !error && organisationStats.length > 0 && (
        <section className="space-y-3 sm:space-y-4">
          <h2 className="text-base font-semibold text-white/90 sm:text-lg">
            Statistiques des organisations et departements
          </h2>

          <OrganisationTable
            rows={organisationStats.map((organisation) => ({
              id: organisation.id,
              organisation: organisation.name,
              departments: organisation.departments,
              rooms: organisation.rooms,
              participants: organisation.participants,
              courses: organisation.courses,
            }))}
          />
        </section>
      )}
    </div>
  );
}
