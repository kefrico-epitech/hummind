"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { EntityService } from "../../../../../src/services/entity.service";
import { Button } from "../../../../../src/components/ui/button";
import { useAppDispatch, useAppSelector } from "../../../../../src/store/hooks";
import {
  fetchOrganisationFailure,
  fetchOrganisationStart,
  fetchOrganisationSuccess,
  resetOrganisationState,
} from "../../../../../src/store/slices/organisationSlice";
import { OrgPageSkeleton } from "../../../../../src/components/layout/org/OrgPageSkeleton";
import { HeaderCard } from "../../../../../src/components/user/common/HeaderCard";
import { TabsEntity } from "../../../../../src/components/user/common/TabsEntity";
import { PublicJoinLinksSection } from "../../../../../src/components/salle/PublicJoinLinksSection";

export default function SalleDetailPage() {
  const { salleId } = useParams<{ salleId: string }>();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const {
    data: organisation,
    loading,
    error,
  } = useAppSelector((state) => state.org);

  const loadSalle = useCallback(
    async (showLoading = true) => {
      if (!salleId) {
        router.replace("/salle");
        return false;
      }

      if (showLoading) {
        dispatch(fetchOrganisationStart());
      }

      const res = await EntityService.entityById(salleId);

      if (res.status === 200 && res.data) {
        dispatch(fetchOrganisationSuccess(res.data));
        return true;
      }

      if (res.status === 401 || res.status === 403) {
        const message =
          "Vous n'avez pas acces a cette salle ou votre session a expire.";
        dispatch(fetchOrganisationFailure(message));
        router.replace("/salle");
        return false;
      }

      if (res.status === 404) {
        const message = "Salle introuvable.";
        dispatch(fetchOrganisationFailure(message));
        router.replace("/salle");
        return false;
      }

      const message =
        res.error || "Impossible de recuperer les informations de la salle.";
      dispatch(fetchOrganisationFailure(message));
      return false;
    },
    [salleId, router, dispatch],
  );

  const archiveRedirectHref = useMemo(() => {
    if (!organisation?.parentId) {
      return "/organisation";
    }

    if (organisation.type === "INDEPENDANT") {
      return `/organisation/${organisation.parentId}`;
    }

    return `/departement/${organisation.parentId}`;
  }, [organisation?.parentId, organisation?.type]);

  useEffect(() => {
    void loadSalle();

    return () => {
      dispatch(resetOrganisationState());
    };
  }, [loadSalle, dispatch]);

  if (loading) {
    return <OrgPageSkeleton variant="detail" />;
  }

  if (error) {
    return (
      <div className="flex h-60 flex-col items-center justify-center gap-3">
        <p className="text-sm text-muted-foreground">
          {error || "Une erreur est survenue"}
        </p>
        <Button variant="outline" onClick={() => router.back()}>
          Retour
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {organisation && (
        <>
          <HeaderCard
            type="salle"
            data={organisation}
            archiveRedirectHref={archiveRedirectHref}
          />
          <TabsEntity
            type="salle"
            organisation={organisation}
            onEntityTreeChanged={() => loadSalle(false)}
          />
          <PublicJoinLinksSection
            entityId={organisation.id}
            entityName={organisation.name}
          />
        </>
      )}
    </div>
  );
}

