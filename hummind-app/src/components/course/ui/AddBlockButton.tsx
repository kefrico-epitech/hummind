"use client";

import React, { useState } from "react";
import {
  Plus,
  Type,
  FileText,
  Image as ImageIcon,
  BarChart3,
  Code,
  Divide,
  Sigma,
  PenTool,
  ListChecks,
} from "lucide-react";
import type { BlockType } from "../types";

type Props = {
  onPick: (type: BlockType) => void;
  label?: string;
  className?: string;
  buttonTitle?: string;
};

const BLOCKS: { type: BlockType; label: string; icon: React.ReactNode }[] = [
  { type: "title", label: "Titre", icon: <Type className="h-5 w-5" /> },
  { type: "content", label: "Contenu", icon: <FileText className="h-5 w-5" /> },
  { type: "quiz", label: "Quiz", icon: <ListChecks className="h-5 w-5" /> },
  {
    type: "exercise",
    label: "Exercice",
    icon: <ListChecks className="h-5 w-5" />,
  },
  { type: "drawing", label: "Dessin", icon: <PenTool className="h-5 w-5" /> },
  { type: "image", label: "Image", icon: <ImageIcon className="h-5 w-5" /> },
  { type: "table", label: "Tableau", icon: <BarChart3 className="h-5 w-5" /> },
  { type: "chart", label: "Graphe", icon: <BarChart3 className="h-5 w-5" /> },
  { type: "code", label: "Code", icon: <Code className="h-5 w-5" /> },
  {
    type: "divider",
    label: "Séparateur",
    icon: <Divide className="h-5 w-5" />,
  },
  { type: "math", label: "Math", icon: <Sigma className="h-5 w-5" /> },
];

export function AddBlockButton({
  onPick,
  label = "Ajouter",
  className = "",
  buttonTitle,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block">
      {/* Bouton Ajouter (comme au départ) */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={buttonTitle}
        className={[
          "inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-3 py-2 text-xs font-semibold text-white/85 transition hover:bg-white/12",
          className,
        ].join(" ")}
      >
        <Plus className="h-4 w-4" />
        {label}
      </button>

      {/* Modal palette */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-[min(400px,calc(100vw-1.5rem))] rounded-xl bg-black/80 p-4 shadow-xl sm:p-6">
            <h2 className="text-white/90 text-sm font-semibold mb-4">
              Choisir un bloc
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {BLOCKS.map((block) => (
                <button
                  key={block.type}
                  type="button"
                  onClick={() => {
                    onPick(block.type);
                    setOpen(false);
                  }}
                  title={`Ajouter un bloc ${block.label.toLowerCase()}`}
                  className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 transition"
                >
                  {block.icon}
                  <span>{block.label}</span>
                </button>
              ))}
            </div>

            <div className="mt-4 text-right">
              <button
                type="button"
                onClick={() => setOpen(false)}
                title="Fermer le choix des blocs"
                className="text-xs text-white/60 hover:text-white"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
