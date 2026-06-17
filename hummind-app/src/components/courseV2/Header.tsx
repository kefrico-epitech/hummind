"use client";

import { X } from "lucide-react";
import { Button } from "../ui/button";

interface HeaderProps {
  mode: "creation" | "edition";
  stepLabel: string;
  stepIndex: number;
  stepTotal: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  canPrev: boolean;
  canNext: boolean;
  loading?: boolean;
  submitting?: boolean;
  nextLabel: string;
  secondaryLabel?: string;
  onSecondary?: () => void;
  secondaryDisabled?: boolean;
}

export default function Header({
  mode,
  stepLabel,
  stepIndex,
  stepTotal,
  onClose,
  onPrev,
  onNext,
  canPrev,
  canNext,
  loading = false,
  submitting = false,
  nextLabel,
  secondaryLabel,
  onSecondary,
  secondaryDisabled = false,
}: HeaderProps) {
  return (
    <div className="border-b border-white/10 px-3 py-2 sm:px-6">
      <div className="flex items-center justify-between gap-2 sm:mt-1 sm:gap-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center sm:h-9 sm:w-9"
            aria-label="Fermer"
          >
            <X className="h-5 w-5 text-white sm:h-6 sm:w-6" />
          </button>
          <div className="min-w-0">
            <div className="truncate text-xs font-medium text-white sm:text-sm">
              {mode === "creation" ? "Creer un cours" : "Editer le cours"}
            </div>
            <div className="truncate text-[11px] text-white/55">
              Etape {stepIndex}/{stepTotal} - {stepLabel}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 gap-2 sm:gap-3">
          {secondaryLabel && onSecondary ? (
            <Button
              type="button"
              onClick={onSecondary}
              disabled={submitting || loading || secondaryDisabled}
              className="h-9 cursor-pointer rounded-full border border-white/20 bg-transparent px-3 text-xs font-medium text-white hover:bg-white/10 sm:h-10 sm:px-6 sm:text-sm"
            >
              {secondaryLabel}
            </Button>
          ) : null}

          <Button
            type="button"
            onClick={onPrev}
            disabled={!canPrev || submitting || loading}
            className="h-9 cursor-pointer rounded-full bg-[#6b6b6b]/30 px-3 text-xs font-medium text-white hover:bg-primary sm:h-10 sm:px-6 sm:text-sm"
          >
            Précédent
          </Button>

          <Button
            type="button"
            disabled={submitting || !canNext || loading}
            onClick={onNext}
            loading={loading || submitting}
            loadingLabel={submitting ? "Publication..." : "Chargement..."}
            className={`h-9 cursor-pointer rounded-full px-3 text-xs font-medium text-white sm:h-10 sm:px-6 sm:text-sm ${
              canNext ? "bg-primary hover:opacity-90" : "bg-[#6b6b6b]/30"
            }`}
          >
            {nextLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
