"use client";

import * as React from "react";
import { toast } from "../lib/notify";
import { OrgCard } from "../components/settings/ArchivesTab";
import { EntityService } from "../services/entity.service";
import { UserService } from "../services/user.service";
import { useAppSelector } from "../store/hooks";

type SecurityPayload = { email: string };
type NotificationsPayload = { disablePromotionalEmails: boolean };

type SettingsInitial = {
  security: SecurityPayload;
  notifications: NotificationsPayload;
  archives: { organisations: OrgCard[] };
};

function isEqual<T>(a: T, b: T): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function useOrgSettings() {
  const user = useAppSelector((state) => state.user.user);

  const [initial, setInitial] = React.useState<SettingsInitial>({
    security: { email: user?.email ?? "" },
    notifications: { disablePromotionalEmails: true },
    archives: { organisations: [] },
  });

  const [security, setSecurity] = React.useState<SecurityPayload>(initial.security);
  const [notifications, setNotifications] = React.useState<NotificationsPayload>(
    initial.notifications,
  );
  const [saving, setSaving] = React.useState({
    security: false,
    notifications: false,
  });
  const [savedPulse, setSavedPulse] = React.useState({
    security: false,
    notifications: false,
  });

  const dirty = {
    security: !isEqual(security, initial.security),
    notifications: !isEqual(notifications, initial.notifications),
  };

  const saveSecurity = async () => {
    if (!dirty.security) return;
    setSaving((state) => ({ ...state, security: true }));
    try {
      setInitial((prev) => ({ ...prev, security }));
      setSavedPulse((state) => ({ ...state, security: true }));
      window.setTimeout(
        () => setSavedPulse((state) => ({ ...state, security: false })),
        900,
      );
    } finally {
      setSaving((state) => ({ ...state, security: false }));
    }
  };

  const saveNotifications = async () => {
    if (!dirty.notifications) return;
    setSaving((state) => ({ ...state, notifications: true }));
    try {
      setInitial((prev) => ({ ...prev, notifications }));
      setSavedPulse((state) => ({ ...state, notifications: true }));
      window.setTimeout(
        () => setSavedPulse((state) => ({ ...state, notifications: false })),
        900,
      );
    } finally {
      setSaving((state) => ({ ...state, notifications: false }));
    }
  };

  const [selectedOrg, setSelectedOrg] = React.useState<OrgCard | null>(null);
  const [unarchiving, setUnarchiving] = React.useState(false);
  const [loadingArchives, setLoadingArchives] = React.useState(false);

  const confirmUnarchive = async () => {
    if (!selectedOrg) return;
    setUnarchiving(true);
    try {
      const res = await EntityService.unarchive(selectedOrg.id);
      if (res.status !== 200) {
        toast.error("Erreur lors du desarchivage de l'organisation");
        return;
      }
      setInitial((prev) => ({
        ...prev,
        archives: {
          ...prev.archives,
          organisations: prev.archives.organisations.filter(
            (organisation) => organisation.id !== selectedOrg.id,
          ),
        },
      }));
      setSelectedOrg(null);
      toast.success("Organisation desarchivee");
    } finally {
      setUnarchiving(false);
    }
  };

  const loadArchives = async () => {
    setLoadingArchives(true);
    try {
      const res = await UserService.getUsersArchives();
      if (res.status !== 200 || !res.data) {
        toast.error("Erreur lors du chargement des archives");
        return;
      }
      setInitial((prev) => ({
        ...prev,
        archives: { organisations: res.data ?? [] },
      }));
    } finally {
      setLoadingArchives(false);
    }
  };

  React.useEffect(() => {
    void loadArchives();
  }, []);

  return {
    initial,
    security,
    setSecurity,
    notifications,
    setNotifications,
    saveSecurity,
    saveNotifications,
    saving,
    dirty,
    savedPulse,
    selectedOrg,
    setSelectedOrg,
    unarchiving,
    confirmUnarchive,
    loadingArchives,
    loadArchives,
  };
}

