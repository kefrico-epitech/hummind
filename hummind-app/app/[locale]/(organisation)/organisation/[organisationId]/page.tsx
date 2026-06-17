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

export default function OrganisationDetailPage() {
  const { organisationId } = useParams<{ organisationId: string }>();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const {
    data: organisation,
    loading,
    error,
  } = useAppSelector((state) => state.org);

  const loadOrganisation = useCallback(
    async (showLoading = true) => {
      if (!organisationId) {
        router.replace("/organisation");
        return false;
      }

      if (showLoading) {
        dispatch(fetchOrganisationStart());
      }

      const res = await EntityService.entityById(organisationId);

      if (res.status === 200 && res.data) {
        dispatch(fetchOrganisationSuccess(res.data));
        return true;
      }

      if (res.status === 401 || res.status === 403) {
        const message =
          "Vous n'avez pas acces a cette organisation ou votre session a expire.";
        dispatch(fetchOrganisationFailure(message));
        router.replace("/organisation");
        return false;
      }

      if (res.status === 404) {
        const message = "Organisation introuvable.";
        dispatch(fetchOrganisationFailure(message));
        router.replace("/organisation");
        return false;
      }

      const message =
        res.error || "Impossible de recuperer les informations de l'organisation.";
      dispatch(fetchOrganisationFailure(message));
      return false;
    },
    [organisationId, router, dispatch],
  );

  const archiveRedirectHref = useMemo(() => "/organisation", []);

  useEffect(() => {
    void loadOrganisation();

    return () => {
      dispatch(resetOrganisationState());
    };
  }, [loadOrganisation, dispatch]);

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
            type="organisation"
            data={organisation}
            archiveRedirectHref={archiveRedirectHref}
          />
          <TabsEntity
            type="organisation"
            organisation={organisation}
            onEntityTreeChanged={() => loadOrganisation(false)}
          />
        </>
      )}
    </div>
  );
}

