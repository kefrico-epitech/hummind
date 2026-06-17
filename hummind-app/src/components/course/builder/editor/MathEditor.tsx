"use client";

import React from "react";
import "katex/dist/katex.min.css";
import { BlockMath } from "react-katex";

const keyboard = [
  // Mathématiques de base
  { label: "√", latex: "\\sqrt{a}" },
  { label: "x²", latex: "x^2" },
  { label: "xⁿ", latex: "x^{n}" },
  { label: "∑", latex: "\\sum_{i=1}^n" },
  { label: "∫", latex: "\\int_0^\\infty" },
  { label: "∞", latex: "\\infty" },
  { label: "→", latex: "\\rightarrow" },
  { label: "←", latex: "\\leftarrow" },
  { label: "≈", latex: "\\approx" },
  { label: "≠", latex: "\\neq" },
  { label: "≤", latex: "\\leq" },
  { label: "≥", latex: "\\geq" },
  { label: "±", latex: "\\pm" },

  // Fractions et opérateurs
  { label: "a/b", latex: "\\frac{a}{b}" },
  { label: "∂", latex: "\\partial" },
  { label: "∇", latex: "\\nabla" },
  { label: "⋅", latex: "\\cdot" },
  { label: "×", latex: "\\times" },
  { label: "÷", latex: "\\div" },

  // Constantes et symboles mathématiques
  { label: "π", latex: "\\pi" },
  { label: "θ", latex: "\\theta" },
  { label: "α", latex: "\\alpha" },
  { label: "β", latex: "\\beta" },
  { label: "γ", latex: "\\gamma" },
  { label: "Δ", latex: "\\Delta" },

  // Physique
  { label: "E=mc²", latex: "E = mc^2" },
  { label: "F⃗", latex: "\\vec{F}" },
  { label: "v⃗", latex: "\\vec{v}" },
  { label: "ħ", latex: "\\hbar" },
  { label: "q·E", latex: "q \\cdot \\vec{E}" },
  {
    label: "Maxwell",
    latex: "\\nabla \\cdot \\vec{E} = \\frac{\\rho}{\\epsilon_0}",
  },

  // Chimie
  { label: "H₂O", latex: "H_2O" },
  { label: "CO₂", latex: "CO_2" },
  { label: "Na⁺", latex: "Na^+" },
  { label: "Cl⁻", latex: "Cl^-" },
  { label: "⇌", latex: "\\rightleftharpoons" },
  { label: "Réaction", latex: "2H_2 + O_2 \\rightarrow 2H_2O" },
];

export function MathEditor({
  value,
  onChange,
}: {
  value: { latex?: string; description?: string } | undefined;
  onChange: (next: { latex: string; description?: string }) => void;
}) {
  const latex = value?.latex ?? "";
  const description = value?.description ?? "";

  const handleInsert = (snippet: string) => {
    onChange({ latex: latex + " " + snippet, description });
  };

  const handleClear = () => {
    onChange({ latex: "", description });
  };

  return (
    <div className="space-y-4 p-4 rounded-xl bg-black/40 border border-white/10">
      {/* Input principal */}
      <textarea
        value={latex}
        onChange={(e) => onChange({ latex: e.target.value, description })}
        className="w-full h-24 rounded-xl border border-white/20 bg-black/60 p-3 font-mono text-sm text-white outline-none"
        placeholder="Écrivez ou insérez une formule (ex: \\sqrt{a})"
        spellCheck={false}
      />

      {/* Clavier visuel */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {keyboard.map((key) => (
          <button
            key={key.label}
            type="button"
            onClick={() => handleInsert(key.latex)}
            className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white hover:bg-white/20"
          >
            {key.label}
          </button>
        ))}
      </div>

      {/* Boutons d’action */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={handleClear}
          className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 sm:w-auto"
        >
          Effacer
        </button>
        <input
          value={description}
          onChange={(e) => onChange({ latex, description: e.target.value })}
          className="w-full rounded-lg border border-white/20 bg-black/60 px-3 py-2 text-sm text-white outline-none sm:ml-4 sm:flex-1"
          placeholder="Description (optionnel)"
        />
      </div>

      {/* Preview KaTeX */}
      <div className="rounded-xl border border-white/20 bg-white/5 p-4">
        <div className="text-xs text-white/50">Aperçu</div>
        <div className="mt-2 text-white text-center">
          {latex ? (
            <BlockMath math={latex} />
          ) : (
            <span className="text-white/40">Votre formule apparaîtra ici</span>
          )}
        </div>
      </div>
    </div>
  );
}
