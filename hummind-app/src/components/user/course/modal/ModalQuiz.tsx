"use client";

import { ModalShell } from "./ModalShell";

export function ModalQuiz({
  open,
  onClose,
  title,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
}) {
  return (
    <ModalShell open={open} onClose={onClose} title={`Configurer le quiz • ${title || "Sans titre"}`}>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/80">
        <p className="text-sm">
          Ici, tu mettras plus tard : questions, choix, correction, scoring, etc.
        </p>
        <p className="mt-2 text-xs text-white/50">
          (ModalQuiz prêt — tu n’as plus qu’à brancher le vrai formulaire.)
        </p>
      </div>
    </ModalShell>
  );
}
