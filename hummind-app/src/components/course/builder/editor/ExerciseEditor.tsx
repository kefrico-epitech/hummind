"use client";

import React from "react";

type ExerciseData = {
  statement?: string;
  solution?: string;
};

type Props = {
  title: string;
  value: ExerciseData | undefined;
  onChange: (next: ExerciseData) => void;
  onChangeTitle?: (nextTitle: string) => void;
};

const STATEMENT_PLACEHOLDER = `1- Créez une variable appelée 'score' et stockez la valeur 10.
A. Affichez la valeur de cette variable.
B. Augmentez la valeur de 5 et affichez le résultat.
2- Expliquez en une phrase ce qu'est une variable.`;

const SOLUTION_PLACEHOLDER = `1- A. score = 10 puis print(score) → affiche 10
B. score += 5 puis print(score) → affiche 15
2- Une variable est un espace de stockage en mémoire qui permet de conserver et réutiliser une valeur.`;

export function ExerciseEditor({
  title,
  value,
  onChange,
  onChangeTitle,
}: Props) {
  const v = value ?? {};

  return (
    <div className="space-y-4">
      {onChangeTitle && (
        <div>
          <label className="mb-2 block text-xs font-medium tracking-wide text-white/60">
            Titre de l'exercice
          </label>
          <input
            value={title ?? ""}
            onChange={(e) => onChangeTitle(e.target.value)}
            placeholder="Ex: Exercice d'application"
            className="h-11 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none placeholder:text-white/20 placeholder:italic focus:border-[#7C6BF5]/70 focus:ring-4 focus:ring-[#7C6BF5]/15"
          />
        </div>
      )}

      <div>
        <label className="mb-2 block text-xs font-medium tracking-wide text-white/60">
          Énoncé
        </label>
        <textarea
          value={v.statement ?? ""}
          onChange={(e) => onChange({ ...v, statement: e.target.value })}
          placeholder={STATEMENT_PLACEHOLDER}
          className="min-h-[140px] w-full resize-y rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 placeholder:italic focus:border-[#7C6BF5]/70 focus:ring-4 focus:ring-[#7C6BF5]/15"
        />
      </div>

      <div>
        <label className="mb-2 block text-xs font-medium tracking-wide text-white/60">
          Corrigé
        </label>
        <textarea
          value={v.solution ?? ""}
          onChange={(e) => onChange({ ...v, solution: e.target.value })}
          placeholder={SOLUTION_PLACEHOLDER}
          className="min-h-[140px] w-full resize-y rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 placeholder:italic focus:border-[#7C6BF5]/70 focus:ring-4 focus:ring-[#7C6BF5]/15"
        />
      </div>
    </div>
  );
}
