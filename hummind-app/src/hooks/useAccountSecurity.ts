"use client";

import * as React from "react";
import { useAppSelector } from "../store/hooks";
import { UserService } from "../services/user.service";

type SecurityForm = {
  firstname: string;
  lastname: string;
  email: string;
};

function isEqual(a: SecurityForm, b: SecurityForm): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function useAccountSecurity() {
  const userData = useAppSelector((state) => state.user.user);

  const initial = React.useMemo<SecurityForm>(
    () => ({
      firstname: userData?.firstname ?? "",
      lastname: userData?.lastname ?? "",
      email: userData?.email ?? "",
    }),
    [userData?.email, userData?.firstname, userData?.lastname],
  );

  const [form, setForm] = React.useState<SecurityForm>(initial);
  const [passwordHash, setPasswordHash] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [savedPulse, setSavedPulse] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setForm(initial);
  }, [initial]);

  const dirty = !isEqual(form, initial) || !!passwordHash;

  const reset = () => {
    setForm(initial);
    setPasswordHash("");
    setError(null);
  };

  const save = async () => {
    if (!userData?.id) return;
    setSaving(true);
    setError(null);

    const payload: SecurityForm & { passwordHash?: string } = { ...form };
    if (passwordHash) payload.passwordHash = passwordHash;

    try {
      const res = await UserService.updateUsersInfos(String(userData.id), payload);
      if (res.status !== 200) {
        setError(res.error ?? "Echec de mise a jour.");
        return;
      }
      setSavedPulse(true);
      window.setTimeout(() => setSavedPulse(false), 900);
    } finally {
      setSaving(false);
    }
  };

  return {
    form,
    setForm,
    dirty,
    reset,
    save,
    saving,
    savedPulse,
    error,
    setPasswordHash,
  };
}
