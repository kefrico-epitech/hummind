"use client";

import React from "react";
import type { Module } from "./types";

const AI_PROGRESS_STAGES = [
  { key: "prepare", label: "Preparation", min: 0, max: 24 },
  { key: "structure", label: "Structure du cours", min: 25, max: 64 },
  { key: "media", label: "Illustrations", min: 65, max: 89 },
  { key: "finalize", label: "Finalisation", min: 90, max: 100 },
] as const;

type Props = {
  modeLabel: string;
  isAiOnly: boolean;
  step2ReadyForAi: boolean;
  aiStatus: "idle" | "loading" | "success" | "error";
  aiError: string | null;
  aiProgress?: number;
  aiLabel?: string | null;
  modules: Module[];
};

export function CourseContentPanel({
  modeLabel,
  isAiOnly,
  step2ReadyForAi,
  aiStatus,
  aiError,
  aiProgress = 0,
  aiLabel = null,
  modules,
}: Props) {
  const progressValue = Math.max(0, Math.min(100, Math.round(aiProgress)));

  return (
    <div className="min-w-0 flex-1">
      <div className="relative rounded-2xl border border-white/10 bg-white/4 shadow-[0_12px_40px_-20px_rgba(0,0,0,0.8)] backdrop-blur-xl">
        <div className="flex flex-col gap-3 border-b border-white/10 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-6 sm:py-5">
          <div className="min-w-0">
            <p className="text-xs tracking-wide text-white/60">Mode du cours</p>
            <p className="truncate text-sm font-semibold text-white">
              {modeLabel}
            </p>

            {isAiOnly && (
              <p className="mt-1 text-xs text-white/50">
                Generation automatique a l&apos;ouverture de cette etape.
              </p>
            )}
          </div>

          <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs text-white/70">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7C6BF5]" />
            Contenu
          </span>
        </div>

        <div className="max-h-[65vh] overflow-y-auto px-4 py-4 sm:px-6 sm:py-6 md:max-h-[calc(100vh-240px)]">
          <h2 className="mb-5 text-xl font-bold text-white">Contenu du cours</h2>

          {isAiOnly && !step2ReadyForAi && (
            <div className="rounded-xl border border-white/10 bg-white/3 p-4 text-sm text-white/70">
              Complete Step 2 (titre, domaine, niveau, description, objectifs)
              pour activer la generation IA.
            </div>
          )}

          {aiStatus === "loading" && (
            <div className="rounded-xl border border-white/10 bg-white/3 p-4 text-white/80">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/45">
                    Generation IA
                  </p>
                  <p className="mt-1 truncate text-sm text-white/80">
                    {aiLabel || "Generation du cours en cours..."}
                  </p>
                  <p className="mt-1 text-xs text-white/60">
                    Veuillez patienter, votre cours est en preparation.
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-white">
                  {progressValue}%
                </span>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/8">
                <div
                  className="h-full rounded-full bg-linear-to-r from-[#17c5a0] via-[#7C6BF5] to-[#E84747] transition-[width] duration-500 ease-out"
                  style={{
                    width: `${Math.max(6, progressValue)}%`,
                  }}
                />
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {AI_PROGRESS_STAGES.map((stage) => {
                  const isDone = progressValue > stage.max;
                  const isActive =
                    progressValue >= stage.min && progressValue <= stage.max;

                  return (
                    <span
                      key={stage.key}
                      className={[
                        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium transition",
                        isDone
                          ? "border-[#17c5a0]/35 bg-[#17c5a0]/12 text-[#9bf0d7]"
                          : isActive
                            ? "border-[#7C6BF5]/35 bg-[#7C6BF5]/14 text-white"
                            : "border-white/10 bg-white/5 text-white/52",
                      ].join(" ")}
                    >
                      {stage.label}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {aiStatus === "error" && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
              {aiError || "Une erreur est survenue."}
            </div>
          )}

          {modules.length > 0 ? (
            <div className="space-y-4">
              {modules.map((module) => (
                <section
                  key={module.id}
                  className="rounded-xl border border-white/10 bg-white/3 p-5"
                >
                  <h3 className="text-base font-semibold text-white">
                    {module.title || "Module"}
                  </h3>

                  <div className="mt-3 space-y-3">
                    {module.blocks.map((block) => (
                      <div
                        key={block.id}
                        className="rounded-lg border border-white/10 bg-black/10 p-3"
                      >
                        <p className="text-xs text-white/50">{block.type}</p>
                        <p className="text-sm text-white/80">
                          {block.title || block.text || "-"}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            aiStatus !== "loading" && (
              <div className="rounded-xl border border-white/10 bg-white/3 p-4 text-sm text-white/70">
                Aucun contenu pour l&apos;instant.
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
