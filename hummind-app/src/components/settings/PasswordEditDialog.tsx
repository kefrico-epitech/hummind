"use client";

import * as React from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

export function PasswordEditDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: (newPassword: string) => void;
}) {
  const [pwd, setPwd] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) {
      setPwd("");
      setConfirm("");
      setError(null);
    }
  }, [open]);

  const field =
    "h-10 rounded-lg border border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-white/20";

  const submit = () => {
    setError(null);

    if (!pwd || !confirm) return setError("Veuillez remplir tous les champs.");
    if (pwd.length < 8) return setError("Minimum 8 caractères.");
    if (pwd !== confirm) return setError("La confirmation ne correspond pas.");

    onConfirm(pwd);
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg border border-white/10 bg-[#111214] p-6 text-white shadow-lg">
        <h2 className="text-lg font-semibold">Modifier le mot de passe</h2>
        <p className="mt-1 text-sm text-white/60">
          Choisissez un mot de passe long et unique.
        </p>

        <div className="mt-4 space-y-3">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-white/80">
              Nouveau mot de passe
            </p>
            <Input
              type="password"
              className={field}
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-medium text-white/80">Confirmer</p>
            <Input
              type="password"
              className={field}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-2 text-xs text-red-200">
              {error}
            </div>
          )}

          <p className="text-[11px] leading-relaxed text-white/45">
            Astuce : une phrase de passe est souvent plus sûre qu’un mot
            compliqué.
          </p>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button
            variant="outline"
            className="border-white/10 bg-transparent text-white/80 hover:bg-white/5"
            onClick={() => onOpenChange(false)}
          >
            Annuler
          </Button>
          <Button
            className="bg-primary/90 text-primary-foreground hover:bg-primary"
            onClick={submit}
          >
            Confirmer
          </Button>
        </div>
      </div>
    </div>
  );
}
