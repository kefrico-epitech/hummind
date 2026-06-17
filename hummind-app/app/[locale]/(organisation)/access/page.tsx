"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "../../../../src/lib/notify";
import { AccessBulkActions } from "../../../../src/components/user/access/AccessBulkActions";
import {
  AccessTabsNav,
  AccessTab,
} from "../../../../src/components/user/access/AccessTabsNav";
import {
  RequestsTable,
  RequestItem,
} from "../../../../src/components/user/access/RequestsTable";
import { EntityService } from "../../../../src/services/entity.service";

const entityTypeMap: Record<AccessTab["value"], string> = {
  organisation: "ORGANISATION",
  departement: "DEPARTMENT",
  salle: "SALLE",
  independant: "INDEPENDANT",
};

export default function OrganisationAccessPage() {
  const [active, setActive] = useState<AccessTab["value"]>("organisation");
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const notifyAccessRequestsUpdated = () => {
    window.dispatchEvent(new Event("access-requests-updated"));
  };

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await EntityService.getAllInvitation();

      if (res.status !== 200) {
        setRequests([]);
        notifyAccessRequestsUpdated();
        setError(res.error || "Erreur lors du chargement des invitations.");
        return;
      }

      setRequests(Array.isArray(res.data) ? res.data : []);
      notifyAccessRequestsUpdated();
    } catch (err) {
      console.error("Erreur fetchRequests:", err);
      setRequests([]);
      notifyAccessRequestsUpdated();
      setError("Impossible de recuperer les invitations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRequests();
  }, [fetchRequests]);

  const handleApproveAll = async () => {
    const groupIds = requests.map((request) => request.id);
    await EntityService.groupLink(groupIds, "APPROVE");
    toast.success("Toutes les demandes ont ete validees.");
    void fetchRequests();
  };

  const handleRejectAll = async () => {
    const groupIds = requests.map((request) => request.id);
    await EntityService.groupLink(groupIds, "REJECT");
    toast.success("Toutes les demandes ont ete rejetees.");
    void fetchRequests();
  };

  const handleApprove = async (item: RequestItem) => {
    await EntityService.acceptLink(item.id);
    toast.success(`Demande de ${item.email} validee.`);
    void fetchRequests();
  };

  const handleReject = async (item: RequestItem) => {
    await EntityService.rejectLink(item.id);
    toast.success(`Demande de ${item.email} rejetee.`);
    void fetchRequests();
  };

  const renderRequestsTable = (
    title: string,
    filterValue: AccessTab["value"],
  ) => {
    const filterType = entityTypeMap[filterValue];
    const filteredRequests = requests.filter(
      (request) => request.entity?.type === filterType,
    );

    if (loading) {
      return (
        <div className="flex justify-center py-6">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      );
    }

    if (!filteredRequests.length) {
      return (
        <p className="text-center text-sm text-muted-foreground">
          Aucune demande trouvee.
        </p>
      );
    }

    return (
      <RequestsTable
        title={title}
        requests={filteredRequests}
        onReject={handleReject}
        onApprove={handleApprove}
      />
    );
  };

  const tabs: AccessTab[] = useMemo(
    () => [
      {
        value: "organisation",
        label: "Organisation",
        badgeCount: requests.filter(
          (request) => request.entity?.type === entityTypeMap.organisation,
        ).length,
      },
      {
        value: "departement",
        label: "Departements",
        badgeCount: requests.filter(
          (request) => request.entity?.type === entityTypeMap.departement,
        ).length,
      },
      {
        value: "salle",
        label: "Salles",
        badgeCount: requests.filter(
          (request) => request.entity?.type === entityTypeMap.salle,
        ).length,
      },
      {
        value: "independant",
        label: "Salles independantes",
        badgeCount: requests.filter(
          (request) => request.entity?.type === entityTypeMap.independant,
        ).length,
      },
    ],
    [requests],
  );

  return (
    <div className="space-y-6">
      <p className="mb-12 text-base text-white/60">
        {
          "La gestion d'acces regroupe toutes les demandes d'adhesion a l'organisation afin que l'administrateur puisse accepter ou refuser les responsables et participants."
        }
      </p>

      {error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <AccessTabsNav tabs={tabs} active={active} onChange={setActive} />
        <AccessBulkActions
          onRejectAll={handleRejectAll}
          onApproveAll={handleApproveAll}
        />
      </div>

      {active === "organisation" &&
        renderRequestsTable(
          "Demandes d'adhesion des responsables",
          "organisation",
        )}
      {active === "departement" &&
        renderRequestsTable(
          "Demandes d'adhesion des departements",
          "departement",
        )}
      {active === "salle" &&
        renderRequestsTable("Demandes d'adhesion des salles liees", "salle")}
      {active === "independant" &&
        renderRequestsTable(
          "Demandes d'adhesion des salles independantes",
          "independant",
        )}
    </div>
  );
}

