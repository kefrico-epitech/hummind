"use client";

import { Button } from "../ui/button";
import { Switch } from "../ui/switch";

type NotificationsPayload = { disablePromotionalEmails: boolean };

export function NotificationsTab({
  value,
  onChange,
  onSave,
  onReset,
  dirty,
  saving,
  savedPulse,
}: {
  value: NotificationsPayload;
  onChange: (next: NotificationsPayload) => void;
  onSave: () => void;
  onReset: () => void;
  dirty: boolean;
  saving: boolean;
  savedPulse: boolean;
}) {
  const contentNarrow = "w-full max-w-[680px]";
  const card = "rounded-lg border border-white/10 bg-white/5";

  return (
    <div className={contentNarrow}>
      <div className="space-y-1">
        <h2 className="text-sm font-semibold text-white/90">Notifications</h2>
        <p className="text-xs text-white/50">
          Choisissez ce que vous souhaitez recevoir par e-mail.
        </p>
      </div>

      <div className="mt-5">
        <div className={`${card} p-4`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-white/80">
                Je ne souhaite pas recevoir d’e-mails promotionnels.
              </p>
              <p className="text-xs text-white/50">
                Vous continuerez à recevoir les e-mails importants liés à votre
                organisation.
              </p>
            </div>

            <Switch
              checked={value.disablePromotionalEmails}
              onCheckedChange={(v) =>
                onChange({ ...value, disablePromotionalEmails: v })
              }
            />
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
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
      </div>
    </div>
  );
}
