import { useState } from "react";
import { Check, X } from "lucide-react";
import { toast } from "../../../lib/notify";
import type { AccessRequestItem } from "../../../dto/access-request.dto";

export type RequestItem = AccessRequestItem;

interface RequestsTableProps {
  title?: string;
  requests: RequestItem[];
  onReject?: (item: RequestItem) => Promise<void> | void;
  onApprove?: (item: RequestItem) => Promise<void> | void;
}

function LoadingIndicator() {
  return (
    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
  );
}

export function RequestsTable({
  title = "Listes de demande d'adhesion",
  requests,
  onReject,
  onApprove,
}: RequestsTableProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleRejectClick = async (req: RequestItem) => {
    try {
      setLoadingId(req.id);
      await onReject?.(req);
      toast.success(`Demande de ${req.email} rejetee.`);
    } catch {
      toast.error("Erreur lors du rejet de la demande.");
    } finally {
      setLoadingId(null);
    }
  };

  const handleApproveClick = async (req: RequestItem) => {
    try {
      setLoadingId(req.id);
      await onApprove?.(req);
      toast.success(`Demande de ${req.email} validee.`);
    } catch {
      toast.error("Erreur lors de la validation de la demande.");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">{title}</p>

      <div className="overflow-hidden rounded-2xl border border-border/40 bg-card shadow-sm">
        <div className="hidden md:block">
          <div className="grid grid-cols-4 items-center bg-secondary/70 px-6 py-3 text-xs font-medium text-muted-foreground">
            <span>Demandeur</span>
            <span>Email</span>
            <span>Entite</span>
            <span className="text-right">Actions</span>
          </div>

          <div className="divide-y divide-border/40">
            {requests.map((req) => (
              <div
                key={req.id}
                className="grid grid-cols-4 items-center px-6 py-4 text-sm transition-colors hover:bg-muted/30"
              >
                <span className="truncate">
                  {req.requester?.firstname} {req.requester?.lastname}
                </span>
                <span className="truncate text-muted-foreground">{req.email}</span>
                <span className="truncate text-muted-foreground">
                  {req.entity?.name ?? "-"}
                </span>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    disabled={loadingId === req.id}
                    onClick={() => handleRejectClick(req)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:opacity-50"
                  >
                    {loadingId === req.id ? <LoadingIndicator /> : <X className="h-4 w-4" />}
                  </button>
                  <button
                    type="button"
                    disabled={loadingId === req.id}
                    onClick={() => handleApproveClick(req)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-success text-success-foreground transition-colors hover:bg-success/90 disabled:opacity-50"
                  >
                    {loadingId === req.id ? (
                      <LoadingIndicator />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}

            {requests.length === 0 && (
              <div className="px-6 py-4 text-center text-sm text-muted-foreground">
                Aucune demande pour le moment.
              </div>
            )}
          </div>
        </div>

        <div className="divide-y divide-border/40 md:hidden">
          {requests.map((req) => (
            <div key={req.id} className="space-y-3 px-4 py-4">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Demandeur
                </p>
                <p className="text-sm font-medium">
                  {req.requester?.firstname} {req.requester?.lastname}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Email
                </p>
                <p className="break-all text-sm text-muted-foreground">{req.email}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Entite
                </p>
                <p className="text-sm text-muted-foreground">
                  {req.entity?.name ?? "-"}
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  disabled={loadingId === req.id}
                  onClick={() => handleRejectClick(req)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-destructive text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:opacity-50"
                >
                  {loadingId === req.id ? <LoadingIndicator /> : <X className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  disabled={loadingId === req.id}
                  onClick={() => handleApproveClick(req)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-success text-success-foreground transition-colors hover:bg-success/90 disabled:opacity-50"
                >
                  {loadingId === req.id ? (
                    <LoadingIndicator />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          ))}

          {requests.length === 0 && (
            <div className="px-4 py-4 text-center text-sm text-muted-foreground">
              Aucune demande pour le moment.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
