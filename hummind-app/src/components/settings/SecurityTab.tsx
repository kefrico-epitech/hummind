"use client";

import * as React from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Pencil } from "lucide-react";
import { PasswordEditDialog } from "./PasswordEditDialog";

type SecurityForm = {
  firstname: string;
  lastname: string;
  email: string;
};

export function SecurityTab({
  value,
  onChange,
  dirty,
  saving,
  savedPulse,
  error,
  onReset,
  onSave,
  onPasswordChange,
}: {
  value: SecurityForm;
  onChange: (next: SecurityForm) => void;
  dirty: boolean;
  saving: boolean;
  savedPulse: boolean;
  error: string | null;
  onReset: () => void;
  onSave: () => void;
  onPasswordChange: (newPassword: string) => void;
}) {
  const [pwdOpen, setPwdOpen] = React.useState(false);

  const label = "text-xs font-medium text-white/80";
  const field =
    "h-10 rounded-lg border border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-white/20";

  return (
    <div className="w-full max-w-[680px]">
      <h2 className="text-sm font-semibold text-white/90">Sécurité</h2>
      <p className="text-xs text-white/50">
        Modifiez vos informations et protégez votre compte.
      </p>

      <div className="mt-5 space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <p className={label}>Prénom</p>
            <Input
              className={field}
              value={value.firstname}
              onChange={(e) =>
                onChange({ ...value, firstname: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <p className={label}>Nom</p>
            <Input
              className={field}
              value={value.lastname}
              onChange={(e) => onChange({ ...value, lastname: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <p className={label}>Email</p>
          <Input
            className={field}
            type="email"
            value={value.email}
            onChange={(e) => onChange({ ...value, email: e.target.value })}
          />
        </div>

        {/* Password */}
        <div className="space-y-2">
          <p className={label}>Mot de passe</p>
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs text-white/70">
                  Modifier votre mot de passe
                </p>
                <p className="mt-1 text-xs text-white/45">
                  Une modification sera appliquée après “Enregistrer”.
                </p>
              </div>
              <Button
                type="button"
                className="h-9 w-full rounded-md bg-primary/90 px-3 text-xs text-primary-foreground hover:bg-primary sm:w-auto"
                onClick={() => setPwdOpen(true)}
              >
                <Pencil className="mr-2 h-4 w-4" /> Modifier
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-2 text-xs text-red-200">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          {savedPulse && (
            <span className="text-xs text-white/50">Enregistré ✓</span>
          )}
          <Button
            variant="outline"
            className="h-9 w-full rounded-md border-white/10 bg-transparent text-xs text-white/80 hover:bg-white/5 sm:w-auto"
            disabled={!dirty || saving}
            onClick={onReset}
          >
            Annuler
          </Button>
          <Button
            className="h-9 w-full rounded-md bg-primary/90 text-xs text-primary-foreground hover:bg-primary sm:w-auto"
            disabled={!dirty || saving}
            onClick={onSave}
          >
            {saving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>

        <PasswordEditDialog
          open={pwdOpen}
          onOpenChange={setPwdOpen}
          onConfirm={onPasswordChange}
        />
      </div>
    </div>
  );
}
