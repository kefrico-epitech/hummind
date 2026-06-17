import { useState } from "react";

interface AccessBulkActionsProps {
  onRejectAll?: () => Promise<void> | void;
  onApproveAll?: () => Promise<void> | void;
}

export function AccessBulkActions({
  onRejectAll,
  onApproveAll,
}: AccessBulkActionsProps) {
  const [loadingRejectAll, setLoadingRejectAll] = useState(false);
  const [loadingApproveAll, setLoadingApproveAll] = useState(false);

  const handleRejectAllClick = async () => {
    try {
      setLoadingRejectAll(true);
      await onRejectAll?.();
    } finally {
      setLoadingRejectAll(false);
    }
  };

  const handleApproveAllClick = async () => {
    try {
      setLoadingApproveAll(true);
      await onApproveAll?.();
    } finally {
      setLoadingApproveAll(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={loadingRejectAll}
        onClick={handleRejectAllClick}
        className="flex items-center justify-center rounded-full bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50"
      >
        {loadingRejectAll ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
        ) : (
          "✕ Tout rejeter"
        )}
      </button>

      <button
        type="button"
        disabled={loadingApproveAll}
        onClick={handleApproveAllClick}
        className="flex items-center justify-center rounded-full bg-success px-4 py-2 text-sm font-medium text-success-foreground hover:bg-success/90 transition-colors disabled:opacity-50"
      >
        {loadingApproveAll ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
        ) : (
          "✓ Tout valider"
        )}
      </button>
    </div>
  );
}
