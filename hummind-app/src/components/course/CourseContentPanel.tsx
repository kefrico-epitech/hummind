"use client";

import React, { useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  addModule,
  undoHistory,
  redoHistory,
  setActiveModuleId,
  setSelectedBlockId,
  reorderBlocks,
  duplicateBlock,
  deleteBlock,
  addBlock,
  addBlockAfter,
  reorderModules,
  renameModule,
  deleteModule,
  duplicateModule,
} from "../../store/slices/courseSlice";
import { UnifiedModulesBuilder } from "./builder/UnifiedModulesBuilder";
import { Plus } from "lucide-react";
import { DocumentPreviewModal } from "./builder/DocumentPreviewModal";
import { Module } from "./types";
import { Button } from "../ui/button";

const AI_PROGRESS_STAGES = [
  { key: "prepare", label: "Préparation", min: 0, max: 14 },
  { key: "context", label: "Analyse du contexte", min: 15, max: 29 },
  { key: "structure", label: "Structure du cours", min: 30, max: 49 },
  { key: "content", label: "Rédaction du contenu", min: 50, max: 69 },
  { key: "activities", label: "Quiz et exercices", min: 70, max: 84 },
  { key: "finalize", label: "Finalisation", min: 85, max: 100 },
] as const;

type Props = {
  aiStatus: "idle" | "loading" | "success" | "error";
  aiError: string | null;
  aiProgress?: number;
  aiLabel?: string | null;
  modules: Module[];
  onProposeWithAi?: () => void;
  proposeDisabled?: boolean;
  proposeLoading?: boolean;
};

export function CourseContentPanel({
  aiStatus,
  aiError,
  aiProgress = 0,
  aiLabel = null,
  modules,
  onProposeWithAi,
  proposeDisabled = false,
  proposeLoading = false,
}: Props) {
  const dispatch = useAppDispatch();
  const activeModuleId = useAppSelector((s) => s.course.ui.activeModuleId);
  const selectedBlockId = useAppSelector((s) => s.course.ui.selectedBlockId);
  const history = useAppSelector((s) => s.course.history);
  const courseTitle = useAppSelector((s) => s.course.title);
  const courseDescription = useAppSelector((s) => s.course.description);
  const courseDomain = useAppSelector((s) => s.course.domain);
  const courseLevel = useAppSelector((s) => s.course.level);
  const courseObjectives = useAppSelector((s) =>
    s.course.objectives
      .split(/\r?\n|;/)
      .map((item) => item.trim())
      .filter(Boolean),
  );

  const [previewOpen, setPreviewOpen] = useState(false);
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);
  const progressValue = Math.max(0, Math.min(100, Math.round(aiProgress)));

  return (
    <div className="min-w-0 flex-1">
      <div className="relative rounded-2xl border border-white/10 bg-white/4 shadow-[0_12px_40px_-20px_rgba(0,0,0,0.8)] backdrop-blur-xl">
        <div className="border-b border-white/10 px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 ">
              <p className="text-xl tracking-wide text-white/60 sm:text-2xl">
                {courseTitle || "Cours sans titre"}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              {/* {onProposeWithAi && (
                <button
                  type="button"
                  onClick={onProposeWithAi}
                  disabled={proposeDisabled || proposeLoading}
                  className="h-9 rounded-full border border-white/20 bg-linear-to-r from-[#7C6BF5] to-[#E84747] px-4 text-xs font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {proposeLoading ? "Generation..." : "Proposer avec IA"}
                </button>
              )} */}
              {/* Undo/Redo */}
              <button
                type="button"
                disabled={history.index <= 0 || aiStatus === "loading"}
                onClick={() => dispatch(undoHistory())}
                title={
                  history.index > 0
                    ? `Revenir : ${history.items[history.index]?.label ?? ""}`
                    : "Aucune action precedente"
                }
                className={[
                  "h-9 rounded-full px-4 text-xs font-semibold transition",
                  "border border-white/10 bg-white/5 text-white/80 hover:bg-white/10",
                  history.index <= 0 || aiStatus === "loading"
                    ? "opacity-50 cursor-not-allowed"
                    : "",
                ].join(" ")}
              >
                ↩ Revenir
              </button>

              <button
                type="button"
                disabled={
                  history.index >= history.items.length - 1 ||
                  aiStatus === "loading"
                }
                onClick={() => dispatch(redoHistory())}
                title={
                  history.index < history.items.length - 1
                    ? `Retablir : ${history.items[history.index + 1]?.label ?? ""}`
                    : "Rien a retablir"
                }
                className={[
                  "h-9 rounded-full px-4 text-xs font-semibold transition",
                  "border border-white/10 bg-white/5 text-white/80 hover:bg-white/10",
                  history.index >= history.items.length - 1 ||
                  aiStatus === "loading"
                    ? "opacity-50 cursor-not-allowed"
                    : "",
                ].join(" ")}
              >
                ↪ Retablir
              </button>

              {/* AI Regenerate - Proposition 3 */}
              {onProposeWithAi && modules.length > 0 && (
                confirmRegenerate ? (
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      onClick={() => {
                        setConfirmRegenerate(false);
                        onProposeWithAi();
                      }}
                      disabled={proposeDisabled || proposeLoading}
                      className="h-9 rounded-full bg-red-500/80 px-3 text-xs font-semibold text-white hover:bg-red-500"
                    >
                      Confirmer
                    </Button>
                    <button
                      type="button"
                      onClick={() => setConfirmRegenerate(false)}
                      className="h-9 rounded-full border border-white/10 bg-white/5 px-3 text-xs font-semibold text-white/70 hover:bg-white/10"
                    >
                      Annuler
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmRegenerate(true)}
                    disabled={proposeDisabled || proposeLoading || aiStatus === "loading"}
                    title="Régénérer le cours avec l'IA"
                    className="h-9 rounded-full border border-[#7C6BF5]/30 bg-[#7C6BF5]/10 px-4 text-xs font-semibold text-[#7C6BF5] transition hover:bg-[#7C6BF5]/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {proposeLoading ? "Génération..." : "✨ Régénérer avec IA"}
                  </button>
                )
              )}

              {/* Preview */}
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                title="Ouvrir l'apercu du cours"
                className="h-9 rounded-full px-4 text-xs font-semibold transition border border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
              >
                Aperçu
              </button>
            </div>
          </div>
        </div>

        <div className="px-4 py-4 sm:px-6 sm:py-6">
          {aiStatus === "loading" && (
            <div className="mb-4 rounded-2xl border border-white/10 bg-white/4 p-4 text-white/80 shadow-[0_12px_32px_-24px_rgba(124,107,245,0.7)]">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/45">
                    Generation IA
                  </p>
                  <p className="mt-1 truncate text-sm font-medium text-white/85">
                    {aiLabel || "Génération du cours en cours..."}
                  </p>
                  <p className="mt-1 text-xs text-white/50">
                    {progressValue < 30
                      ? "Analyse et préparation en cours..."
                      : progressValue < 60
                        ? "Rédaction du contenu pédagogique..."
                        : progressValue < 85
                          ? "Création des activités et vérifications..."
                          : "Finalisation du cours..."}
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
            <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
              {aiError || "Une erreur est survenue."}
            </div>
          )}

          {!modules.length ? (
            aiStatus !== "loading" && (
              <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/3 p-4 sm:p-6">
                {/* Propose une description pour differencier créer avec IA et vous meme */}
                {/* <h3 className="text-base font-semibold text-white">
                  Aucun module pour le moment
                </h3>
                <p className="mt-1 text-sm text-white/60">
                  Creez votre premier module pour demarrer la table des
                  matieres.
                </p> */}

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => dispatch(addModule())}
                    title="Creer les premiers modules manuellement"
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-white/40 px-5 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Créer les modules ou Chapitres
                  </button>
                  {onProposeWithAi && (
                    <Button
                      type="button"
                      onClick={onProposeWithAi}
                      disabled={proposeDisabled}
                      loading={proposeLoading}
                      loadingLabel="Generation du cours"
                      title="Generer le cours complet avec l'IA"
                      className="inline-flex h-10 rounded-xl border border-white/20 bg-linear-to-r from-[#7C6BF5] to-[#E84747] px-5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Générer le cours complet avec IA
                    </Button>
                  )}
                </div>
              </div>
            )
          ) : (
            <div
              onClick={(event) => {
                if (event.target !== event.currentTarget) return;
                dispatch(setSelectedBlockId(null));
                dispatch(setActiveModuleId(null));
              }}
            >
              <UnifiedModulesBuilder
                modules={modules}
                activeModuleId={activeModuleId}
                selectedBlockId={selectedBlockId}
                onSelectModule={(id) => dispatch(setActiveModuleId(id))}
                onReorderModules={(next) => dispatch(reorderModules(next))}
                onRenameModule={(moduleId, title) =>
                  dispatch(renameModule({ moduleId, title }))
                }
                onDeleteModule={(moduleId) =>
                  dispatch(deleteModule({ moduleId }))
                }
                onDuplicateModule={(moduleId) =>
                  dispatch(duplicateModule({ moduleId }))
                }
                onAddModule={() => dispatch(addModule())}
                onAddBlock={(moduleId, type) =>
                  dispatch(addBlock({ moduleId, type }))
                }
                onReorderBlocks={(moduleId, nextBlocks) =>
                  dispatch(
                    reorderBlocks({
                      moduleId,
                      blocks: nextBlocks,
                    }),
                  )
                }
                onSelectBlock={(id) => {
                  if (!id) {
                    dispatch(setSelectedBlockId(null));
                    dispatch(setActiveModuleId(null));
                    return;
                  }
                  dispatch(setSelectedBlockId(id));
                }}
                onDuplicateBlock={(moduleId, blockId) =>
                  dispatch(duplicateBlock({ moduleId, blockId }))
                }
                onDeleteBlock={(moduleId, blockId) =>
                  dispatch(deleteBlock({ moduleId, blockId }))
                }
                onAddAfter={(moduleId, afterBlockId, type) =>
                  dispatch(
                    addBlockAfter({
                      moduleId,
                      afterBlockId,
                      type,
                    }),
                  )
                }
              />
            </div>
          )}
        </div>
      </div>

      <DocumentPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={courseTitle}
        description={courseDescription}
        domain={courseDomain}
        level={courseLevel}
        objectives={courseObjectives}
        modules={modules}
      />
    </div>
  );
}
