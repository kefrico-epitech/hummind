"use client";

import { AlertCircle, RefreshCcw } from "lucide-react";

export default function LearnerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-white/2 p-6 text-center">
        <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-5 w-5 text-destructive" />
        </div>
        <h2 className="mt-4 text-lg font-semibold">
          Une erreur est survenue
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {error.message || "Quelque chose s'est mal passé. Veuillez réessayer."}
        </p>
        <button
          onClick={reset}
          className="mt-5 inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-2 text-sm font-medium transition hover:bg-secondary/80"
        >
          <RefreshCcw className="h-4 w-4" />
          Réessayer
        </button>
      </div>
    </div>
  );
}
