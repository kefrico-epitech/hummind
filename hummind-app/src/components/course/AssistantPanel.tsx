"use client";

import React from "react";
import { Eye, Paperclip } from "lucide-react";
import type { Module } from "./types";
import { useAppSelector } from "../../store/hooks";
import { ExtractPreviewDialog } from "./modal/ExtractPreviewDialog";
import { Button } from "../ui/button";

type Scope = "ALL" | "MODULE" | "BLOCK";

type AssistantPanelProps = {
  modeLabel: string;
  prompt: string;
  onPromptChange: (v: string) => void;
  onSubmit: () => void;

  modules: Module[];
  selectedModuleId: string | null;
  onSelectModuleId: (id: string | null) => void;

  scope: Scope;
  onScopeChange: (s: Scope) => void;
  selectedBlockId: string | null;

  disabled?: boolean;
  loading?: boolean;

  isHybrid?: boolean;
  documentRequired?: boolean;
  hasExtract?: boolean;
  onPreviewExtract?: () => void;

  extractLoading?: boolean;
  extractProgress?: number;
  extractError?: string | null;
  onUploadFile?: (file: File) => void;
  credits?: {
    total: number;
    consumed: number;
    remaining: number;
    lastConsumed?: number;
  };
};

function AssistantPanel({
  modeLabel,
  prompt,
  onPromptChange,
  onSubmit,
  scope,
  onScopeChange,
  selectedBlockId,
  disabled = false,
  loading = false,
  isHybrid = false,
  documentRequired = false,
  hasExtract = false,
  onPreviewExtract,
  extractLoading = false,
  extractProgress = 0,
  extractError = null,
  onUploadFile,
  credits,
}: AssistantPanelProps) {
  const extractFromCourse = useAppSelector(
    (state) => state.course.extractedData,
  );
  const extractFromSetup = useAppSelector(
    (state) => state.courseSetup.extractedData,
  );
  const extract = extractFromSetup || extractFromCourse;
  const hasExtractValue = hasExtract || !!extract?.trim();

  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [localFileName, setLocalFileName] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const canUseBlock = !!selectedBlockId;

  const handleAttachClick = React.useCallback(() => {
    if (disabled || extractLoading) return;
    fileInputRef.current?.click();
  }, [disabled, extractLoading]);

  const handleFileChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setLocalFileName(file.name);
      onUploadFile?.(file);
      e.currentTarget.value = "";
    },
    [onUploadFile],
  );

  const handlePreview = React.useCallback(() => {
    if (onPreviewExtract) {
      onPreviewExtract();
      return;
    }
    setPreviewOpen(true);
  }, [onPreviewExtract]);

  return (
    <div className="w-full xl:w-[360px] xl:shrink-0 xl:self-start xl:sticky xl:top-6">
      <div className="relative rounded-2xl border border-white/10 bg-[#0E1118]/90 backdrop-blur-md">
        <div className="border-b border-white/10 px-4 py-4 sm:px-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-white">
                Assistant IA
              </h3>
            </div>

            <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
              <span className="h-1.5 w-1.5 rounded-full bg-[#7C6BF5]" />
              {modeLabel}
            </span>
          </div>

          {credits && (
            <div className="mt-3">
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-white/45">
                Credits OpenAI
              </p>
              <div className="grid grid-cols-1 gap-2 text-[11px] sm:grid-cols-3">
              {/* <div className="rounded-lg border border-white/10 bg-black/20 px-2 py-1.5 text-white/60">
                <p>Total</p>
                <p className="mt-0.5 text-sm font-semibold text-white">
                  {credits.total.toFixed(2)}
                </p>
              </div> */}
              <div className="rounded-lg border border-white/10 bg-black/20 px-2 py-1.5 text-white/60">
                <p>Consomme</p>
                <p className="mt-0.5 text-sm font-semibold text-white">
                  {credits.consumed.toFixed(2)}
                </p>
              </div>
              {/* <div className="rounded-lg border border-white/10 bg-black/20 px-2 py-1.5 text-white/60">
                <p>Restant</p>
                <p className="mt-0.5 text-sm font-semibold text-white">
                  {credits.remaining.toFixed(2)}
                </p>
              </div> */}
            </div>
            </div>
          )}
        </div>

        <div className="space-y-4 px-4 py-4 sm:px-5 sm:py-5">
          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-wide text-white/45">
              Cible de l&apos;action
            </p>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => onScopeChange("ALL")}
                className={[
                  "rounded-xl border px-3 py-2 text-xs font-semibold transition",
                  scope === "ALL"
                    ? "border-[#7C6BF5]/40 bg-[#7C6BF5]/10 text-white"
                    : "border-white/10 bg-black/20 text-white/70 hover:bg-white/5",
                ].join(" ")}
              >
                Tous
              </button>

              <button
                type="button"
                onClick={() => onScopeChange("MODULE")}
                className={[
                  "rounded-xl border px-3 py-2 text-xs font-semibold transition",
                  scope === "MODULE"
                    ? "border-[#7C6BF5]/40 bg-[#7C6BF5]/10 text-white"
                    : "border-white/10 bg-black/20 text-white/70 hover:bg-white/5",
                ].join(" ")}
              >
                Module
              </button>

              <button
                type="button"
                disabled={!canUseBlock}
                onClick={() => onScopeChange("BLOCK")}
                className={[
                  "rounded-xl border px-3 py-2 text-xs font-semibold transition",
                  scope === "BLOCK"
                    ? "border-[#7C6BF5]/40 bg-[#7C6BF5]/10 text-white"
                    : "border-white/10 bg-black/20 text-white/70 hover:bg-white/5",
                  !canUseBlock ? "cursor-not-allowed opacity-50" : "",
                ].join(" ")}
              >
                Bloc
              </button>
            </div>

            {scope === "BLOCK" && !canUseBlock && (
              <p className="text-[11px] text-white/45">
                Selectionne un bloc dans le contenu pour cibler ce mode.
              </p>
            )}
          </div>

          <textarea
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            placeholder="Ex: Rendre plus clair cette section et ajouter un exemple concret"
            className="h-24 w-full resize-none rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-[#7C6BF5]/70 focus:ring-2 focus:ring-[#7C6BF5]/15"
          />

          <Button
            type="button"
            onClick={onSubmit}
            disabled={disabled || !prompt.trim()}
            loading={loading}
            loadingLabel="Generation en cours"
            className="w-full rounded-xl bg-linear-to-r from-[#7C6BF5] to-[#E84747] py-2.5 text-sm font-semibold text-white transition hover:opacity-95 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Appliquer
            <span className="text-white/80">&rarr;</span>
          </Button>

          {isHybrid && (
            <div className="space-y-2 rounded-xl border border-white/10 bg-black/20 p-2.5">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt,.md"
                disabled={disabled || extractLoading}
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAttachClick}
                  disabled={disabled || extractLoading || !onUploadFile}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Ajouter un document source"
                  title={
                    documentRequired
                      ? "Ajouter un document (requis)"
                      : "Ajouter un document"
                  }
                >
                  <Paperclip className="h-4 w-4" />
                </button>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] text-white/60">
                    {hasExtractValue
                      ? localFileName
                        ? `Source liee: ${localFileName}`
                        : "Source liee au cours"
                      : localFileName
                        ? localFileName
                        : documentRequired
                          ? "Document requis"
                          : "Ajouter une source (optionnel)"}
                  </p>
                </div>

                {hasExtractValue && (
                  <button
                    type="button"
                    onClick={handlePreview}
                    className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-medium text-white/70 transition hover:bg-white/10"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Apercu
                  </button>
                )}
              </div>

              {extractLoading && (
                <div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#2a2a2a]">
                    <div
                      className="h-1.5 bg-linear-to-r from-[#7077DA] to-[#E84747] transition-all duration-200 ease-out"
                      style={{ width: `${extractProgress}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-white/50">
                    Extraction... {extractProgress}%
                  </p>
                </div>
              )}

              {extractError && (
                <p className="text-[11px] text-red-300">
                  Erreur d&apos;extraction : {extractError}
                </p>
              )}

              {!hasExtractValue && !extractLoading && documentRequired && (
                <p className="text-[11px] text-amber-200">
                  Un document est necessaire pour ce mode.
                </p>
              )}
            </div>
          )}

          <p className="mt-4 text-xs leading-relaxed text-white/50">
            Les contenus generes par l&apos;IA peuvent etre incorrects. Relis et
            valide avant publication.
          </p>
        </div>
      </div>

      <ExtractPreviewDialog open={previewOpen} onOpenChange={setPreviewOpen} />
    </div>
  );
}

export { AssistantPanel };
export default AssistantPanel;
