"use client";

import React from "react";
import type { Module } from "./types";

type AssistantPanelProps = {
  modeLabel: string;
  prompt: string;
  onPromptChange: (v: string) => void;
  onSubmit: () => void;

  // ✅ nouveau
  modules: Module[];
  selectedModuleId: string | null;
  onSelectModuleId: (id: string | null) => void;

  disabled?: boolean;
  loading?: boolean;
};

export function AssistantPanel({
  modeLabel,
  prompt,
  onPromptChange,
  onSubmit,
  modules,
  selectedModuleId,
  onSelectModuleId,
  disabled = false,
  loading = false,
}: AssistantPanelProps) {
  return (
    <div className="w-full xl:w-[360px] xl:shrink-0">
      <div className="relative rounded-2xl border border-white/10 bg-white/4 shadow-[0_12px_40px_-20px_rgba(0,0,0,0.8)] backdrop-blur-xl xl:sticky xl:top-6">
        {/* Header */}
        <div className="border-b border-white/10 px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-white">
                Assistant IA
              </h3>
            </div>

            <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs text-white/70">
              <span className="h-1.5 w-1.5 rounded-full bg-[#7C6BF5]" />
              {modeLabel}
            </span>
          </div>

          <p className="mt-2 text-sm leading-relaxed text-white/60">
            Saisissez votre requête et sélectionnez le module où vous voulez
            faire intervenir l’IA.
          </p>
        </div>

        {/* Body */}
        <div className="px-4 py-4 sm:px-6 sm:py-6">
          {/* ✅ Select module */}
          <label className="mb-2 block text-xs font-medium tracking-wide text-white/60">
            Module ciblé
          </label>

          <select
            value={selectedModuleId ?? ""}
            onChange={(e) => onSelectModuleId(e.target.value || null)}
            className="mb-4 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-[#7C6BF5]/70 focus:ring-4 focus:ring-[#7C6BF5]/15"
          >
            <option value="">Tous les modules</option>
            {modules.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title?.trim() ? m.title : `Module ${m.id.slice(0, 6)}`}
              </option>
            ))}
          </select>

          <label className="mb-2 block text-xs font-medium tracking-wide text-white/60">
            Votre requête
          </label>

          <textarea
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            placeholder="Ex: Améliore le contenu en le rendant plus simple + ajoute 5 QCM à la fin"
            className="h-28 w-full resize-none rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-[#7C6BF5]/70 focus:ring-4 focus:ring-[#7C6BF5]/15"
          />

          <button
            type="button"
            onClick={onSubmit}
            disabled={disabled || loading || !prompt.trim()}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white shadow-[0_12px_30px_-14px_rgba(124,107,245,0.9)] transition hover:opacity-95 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 bg-linear-to-r from-[#7C6BF5] to-[#E84747]"
          >
            {loading ? "Génération..." : "Appliquer les améliorations"}
            <span className="text-white/80">→</span>
          </button>

          <div className="mt-4 rounded-xl border border-white/10 bg-white/3 p-3">
            <p className="text-xs leading-relaxed text-white/50">
              Les contenus générés par l’IA peuvent être de qualité inégale,
              incorrects ou inappropriés. Faites preuve de discernement.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
