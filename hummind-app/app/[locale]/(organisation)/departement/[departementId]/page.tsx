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

export default function DepartementDetailPage() {
  const { departementId } = useParams<{ departementId: string }>();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const {
    data: organisation,
    loading,
    error,
  } = useAppSelector((state) => state.org);

  const loadDepartement = useCallback(
    async (showLoading = true) => {
      if (!departementId) {
        router.replace("/departement");
        return false;
      }

      if (showLoading) {
        dispatch(fetchOrganisationStart());
      }

      const res = await EntityService.entityById(departementId);

      if (res.status === 200 && res.data) {
        dispatch(fetchOrganisationSuccess(res.data));
        return true;
      }

      if (res.status === 401 || res.status === 403) {
        const message =
          "Vous n'avez pas acces a ce departement ou votre session a expire.";
        dispatch(fetchOrganisationFailure(message));
        router.replace("/departement");
        return false;
      }

      if (res.status === 404) {
        const message = "Departement introuvable.";
        dispatch(fetchOrganisationFailure(message));
        router.replace("/departement");
        return false;
      }

      const message =
        res.error || "Impossible de recuperer les informations du departement.";
      dispatch(fetchOrganisationFailure(message));
      return false;
    },
    [departementId, router, dispatch],
  );

  const archiveRedirectHref = useMemo(() => {
    if (!organisation?.parentId) {
      return "/organisation";
    }

    return `/organisation/${organisation.parentId}`;
  }, [organisation?.parentId]);

  useEffect(() => {
    void loadDepartement();

    return () => {
      dispatch(resetOrganisationState());
    };
  }, [loadDepartement, dispatch]);

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
            type="departement"
            data={organisation}
            archiveRedirectHref={archiveRedirectHref}
          />
          <TabsEntity
            type="departement"
            organisation={organisation}
            onEntityTreeChanged={() => loadDepartement(false)}
          />
        </>
      )}
    </div>
  );
}

