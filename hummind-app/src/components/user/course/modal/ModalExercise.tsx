"use client";

import { ModalShell } from "./ModalShell";

export function ModalExercise({
  open,
  onClose,
  title,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
}) {
  return (
    <ModalShell open={open} onClose={onClose} title={`Configurer l’exercice • ${title || "Sans titre"}`}>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/80">
        <p className="text-sm">
          Ici, tu mettras plus tard : énoncé, fichiers, corrections, barème, etc.
        </p>
        <p className="mt-2 text-xs text-white/50">
          (ModalExercise prêt — à compléter ensuite.)
        </p>
      </div>
    </ModalShell>
  );
}
