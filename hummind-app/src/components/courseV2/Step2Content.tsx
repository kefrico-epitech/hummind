"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { shallowEqual } from "react-redux";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { CourseContentPanel } from "../course/CourseContentPanel";
import { useExtractFile } from "../../hooks/useExtractFile";
import { updateCourseSetup } from "../../store/slices/courseSetupSlice";
import {
  applyAiUsage,
  pushHistory,
  setAiGenError,
  setAiGenProgress,
  setAiGenStatus,
  setBuilderModules,
} from "../../store/slices/courseSlice";
import type { Action, Course, Module } from "../course/types";
import { applyActions } from "../../lib/course/applyActions";
import AssistantPanel from "../course/AssistantPanel";
import { AiService } from "../../services/ai.service";

type Scope = "ALL" | "MODULE" | "BLOCK";

type ImageGenerationContext = {
  title: string;
  description: string;
  domain: string;
  level: string;
  objectives: string[];
};

type ImageBatchJob = {
  id: string;
  prompt: string;
  size?: "1024x1024" | "1024x1536" | "1536x1024" | "auto";
};

type ImageBatchResult = {
  id: string;
  url: string | null;
  error?: string;
};

type ImageBatchResponse = {
  results?: ImageBatchResult[];
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    consumedCredits?: number;
  };
};

function buildImagePrompt(args: {
  course: ImageGenerationContext;
  moduleTitle: string;
  blockTitle: string;
  caption: string;
  alt: string;
}) {
  const primarySubject =
    args.caption.trim() ||
    args.alt.trim() ||
    args.blockTitle.trim() ||
    args.moduleTitle.trim() ||
    args.course.title.trim() ||
    "Illustration pedagogique";

  return [
    "Genere une image pedagogique claire, moderne et lisible.",
    "Style: propre, explicatif, sans texte illisible ni watermark.",
    `Sujet principal: ${primarySubject}`,
    args.course.title.trim() ? `Cours: ${args.course.title.trim()}` : "",
    args.course.description.trim()
      ? `Contexte: ${args.course.description.trim()}`
      : "",
    args.moduleTitle.trim() ? `Module: ${args.moduleTitle.trim()}` : "",
    args.blockTitle.trim() ? `Section: ${args.blockTitle.trim()}` : "",
    args.course.domain.trim() ? `Domaine: ${args.course.domain.trim()}` : "",
    args.course.level.trim() ? `Niveau: ${args.course.level.trim()}` : "",
    args.course.objectives.length
      ? `Objectifs: ${args.course.objectives.join(" ; ")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function collectImageBatchJobs(params: {
  modules: Module[];
  candidateIds: Set<string>;
  course: ImageGenerationContext;
}): ImageBatchJob[] {
  const jobs: ImageBatchJob[] = [];

  for (const courseModule of params.modules) {
    const moduleTitle = courseModule.title?.trim() || "Module";
    for (const block of courseModule.blocks ?? []) {
      if (block.type !== "image") continue;
      if (!params.candidateIds.has(block.id)) continue;

      const imageData = (block.data?.image ?? {}) as {
        url?: string;
        caption?: string;
        alt?: string;
      };

      if (imageData.url?.trim()) continue;

      jobs.push({
        id: block.id,
        prompt: buildImagePrompt({
          course: params.course,
          moduleTitle,
          blockTitle: block.title || "",
          caption: imageData.caption || "",
          alt: imageData.alt || "",
        }),
        size: "1024x1024",
      });
    }
  }

  return jobs;
}

function applyImageBatchResults(
  modules: Module[],
  results: ImageBatchResult[],
): Module[] {
  const byId = new Map(results.map((result) => [result.id, result]));

  return modules.map((module) => ({
    ...module,
    blocks: (module.blocks ?? []).map((block) => {
      if (block.type !== "image") return block;
      const result = byId.get(block.id);
      if (!result?.url) return block;

      const currentImage = (block.data?.image ?? {}) as {
        url?: string;
        caption?: string;
        alt?: string;
      };
      const caption = currentImage.caption?.trim() || block.title || "Illustration";
      const alt = currentImage.alt?.trim() || caption;

      return {
        ...block,
        status: "ready",
        data: {
          ...(block.data ?? {}),
          image: {
            ...currentImage,
            url: result.url,
            caption,
            alt,
          },
        },
      };
    }),
  }));
}

export default function Step2Content({
  onValidChange,
}: {
  onValidChange: (ok: boolean) => void;
}) {
  const dispatch = useAppDispatch();
  const builderModules = useAppSelector((s) => s.course.builder.modules);
  const courseMeta = useAppSelector(
    (s) => ({
      title: s.course.title,
      level: s.course.level,
      style: s.course.style,
    }),
    shallowEqual,
  );
  const setup = useAppSelector(
    (s) => ({
      title: s.courseSetup.title,
      description: s.courseSetup.description,
      objectives: s.courseSetup.objectives,
      domain: s.courseSetup.domain,
      level: s.courseSetup.level,
      style: s.courseSetup.style,
      extractedData: s.courseSetup.extractedData,
    }),
    shallowEqual,
  );
  const selectedBlockId = useAppSelector((s) => s.course.ui.selectedBlockId);
  const activeModuleId = useAppSelector((s) => s.course.ui.activeModuleId);
  const aiCredits = useAppSelector((s) => s.course.aiCredits);
  const aiGen = useAppSelector((s) => s.course.aiGen);

  const [prompt, setPrompt] = useState("");
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [scope, setScope] = useState<Scope>("MODULE");
  const requestIdRef = useRef(0);

  const aiStatus = aiGen.status;
  const aiError = aiGen.error;
  const aiProgress = aiGen.progress;
  const aiLabel = aiGen.label;

  const {
    loading: extractLoading,
    progress: extractProgress,
    error: extractError,
    extract,
  } = useExtractFile({
    onSuccess: (content) => {
      dispatch(updateCourseSetup({ extractedData: content }));
    },
  });

  const hasExtract = !!setup.extractedData?.trim();
  const moduleCount = builderModules.length;
  const canProceed = moduleCount > 0;

  useEffect(() => {
    onValidChange(canProceed);
  }, [canProceed, onValidChange]);

  useEffect(() => {
    if (selectedBlockId) {
      const moduleWithBlock = builderModules.find((moduleItem) =>
        moduleItem.blocks.some((block) => block.id === selectedBlockId),
      );
      setScope("BLOCK");
      setSelectedModuleId(moduleWithBlock?.id ?? activeModuleId ?? null);
      return;
    }

    if (activeModuleId) {
      setScope("MODULE");
      setSelectedModuleId(activeModuleId);
      return;
    }

    setScope("ALL");
    setSelectedModuleId(null);
  }, [activeModuleId, builderModules, selectedBlockId]);

  const modeLabel = useMemo(
    () => (hasExtract ? "Assistance IA + document" : "Assistance IA"),
    [hasExtract],
  );

  const handleUploadFile = useCallback(
    async (file: File) => {
      await extract(file);
    },
    [extract],
  );

  const runAssistant = useCallback(
    async (customPrompt?: string, options?: { forcedScope?: Scope }) => {
      const rawPrompt = (customPrompt ?? prompt).trim();
      if (!rawPrompt) return;
      const effectiveScope = options?.forcedScope ?? scope;

      let moduleId: string | null = null;
      if (effectiveScope === "ALL") {
        moduleId = null;
      } else if (effectiveScope === "MODULE") {
        moduleId = selectedModuleId ?? activeModuleId ?? null;
      } else {
        const m = builderModules.find((mod) =>
          mod.blocks.some((b) => b.id === selectedBlockId),
        );
        moduleId = m?.id ?? selectedModuleId ?? activeModuleId ?? null;
      }

      const requestId = Date.now();
      requestIdRef.current = requestId;
      dispatch(setAiGenStatus("loading"));
      dispatch(setAiGenError(null));
      dispatch(
        setAiGenProgress({
          progress: 5,
          label: "Préparation de la génération...",
        }),
      );

      // Smooth progress animation
      const progressLabels = [
        { at: 5, label: "Préparation de la génération..." },
        { at: 12, label: "Analyse du contexte du cours..." },
        { at: 22, label: "Construction de la structure..." },
        { at: 35, label: "Rédaction des contenus..." },
        { at: 50, label: "Création des quiz et exercices..." },
        { at: 65, label: "Mise en forme pédagogique..." },
        { at: 76, label: "Vérification de la qualité..." },
      ];
      let currentProgress = 5;
      const progressInterval = setInterval(() => {
        if (currentProgress >= 78) {
          clearInterval(progressInterval);
          return;
        }
        const increment = currentProgress < 20 ? 2 : currentProgress < 50 ? 1.5 : 1;
        currentProgress = Math.min(78, currentProgress + increment);
        const labelEntry = [...progressLabels]
          .reverse()
          .find((l) => currentProgress >= l.at);
        dispatch(
          setAiGenProgress({
            progress: Math.round(currentProgress),
            label: labelEntry?.label ?? "Génération en cours...",
          }),
        );
      }, 350);

      try {
        const payload: Course = {
          id: "draft",
          title: setup.title || courseMeta.title || "Nouveau cours",
          modules: builderModules,
        };

        const generationMode: "PLAN" | "COMPLETE_MODULE" =
          moduleId || effectiveScope !== "ALL" ? "COMPLETE_MODULE" : "PLAN";

        const endpoint = hasExtract
          ? "/api/ai/hybrid-generate"
          : "/api/ai/course-actions";

        const body: Record<string, unknown> = {
          mode: generationMode,
          prompt: rawPrompt,
          course: payload,
          scope: effectiveScope,
          targetModuleId: moduleId,
          targetBlockId:
            effectiveScope === "BLOCK" ? selectedBlockId : null,
          language: "fr",
          level: setup.level || courseMeta.level,
          context: {
            title: setup.title || courseMeta.title || "Nouveau cours",
            description: setup.description || "",
            objectives: setup.objectives,
            domain: setup.domain || "",
            level: setup.level || courseMeta.level || "",
            style: setup.style || courseMeta.style || "",
          },
        };
        if (hasExtract) body.extractedData = setup.extractedData;

        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          let details = "";
          try {
            const errJson = await res.json();
            details =
              errJson?.details || errJson?.error || JSON.stringify(errJson);
          } catch {
            details = await res.text().catch(() => "");
          }
          throw new Error(details ? `Erreur IA: ${details}` : "Erreur IA");
        }

        clearInterval(progressInterval);

        if (requestIdRef.current !== requestId) {
          return;
        }

        dispatch(
          setAiGenProgress({
            progress: 82,
            label: "Mise en forme du cours...",
          }),
        );

        const { actions, usage } = (await res.json()) as {
          actions: Action[];
          usage?: {
            inputTokens?: number;
            outputTokens?: number;
            totalTokens?: number;
            consumedCredits?: number;
          };
        };

        dispatch(
          pushHistory({
            label: hasExtract ? "Generation guidee document" : "Generation IA",
            runKey: null,
            modules: payload.modules,
          }),
        );

        const imageCandidateIds = new Set(
          actions
            .filter((action) => action.block?.type === "image")
            .map((action) => action.block.id)
            .filter(Boolean),
        );

        const next = applyActions(payload, actions);
        let finalModules = next.modules;

        dispatch(setBuilderModules(finalModules));
        if (usage) {
          dispatch(applyAiUsage(usage));
        }

        dispatch(
          setAiGenProgress({
            progress: 76,
            label:
              imageCandidateIds.size > 0
                ? "Preparation des illustrations..."
                : "Finalisation du contenu...",
          }),
        );

        // Optimisation: on attend la fin du contenu, puis on genere les images
        // manquantes en lot pour eviter les attentes repetitives bloc par bloc.

        if (imageCandidateIds.size > 0) {
          const imageJobs = collectImageBatchJobs({
            modules: finalModules,
            candidateIds: imageCandidateIds,
            course: {
              title: setup.title || courseMeta.title || "Nouveau cours",
              description: setup.description || "",
              domain: setup.domain || "",
              level: setup.level || courseMeta.level || "",
              objectives: setup.objectives || [],
            },
          });

          if (imageJobs.length > 0) {
            try {
              const imageRes = await AiService.imageBatch({ images: imageJobs });
              if (imageRes.error || !imageRes.data) {
                dispatch(setAiGenError(
                  imageRes.error
                    ? `Contenu genere, mais generation image incomplete: ${imageRes.error}`
                    : "Contenu genere, mais generation image incomplete.",
                ));
              } else {
                const imageResults = imageRes.data.results ?? [];
                finalModules = applyImageBatchResults(
                  finalModules,
                  imageResults as ImageBatchResponse["results"],
                );
                dispatch(setBuilderModules(finalModules));
              }
            } catch {
              dispatch(setAiGenError(
                "Contenu genere, mais la generation des images IA n'a pas pu se terminer.",
              ));
            }
          }
        }

        if (requestIdRef.current !== requestId) {
          return;
        }

        dispatch(
          setAiGenProgress({
            progress: 92,
            label: imageCandidateIds.size > 0 ? "Finalisation du cours..." : "Application des modules...",
          }),
        );
        dispatch(setBuilderModules(finalModules));
        dispatch(setAiGenStatus("success"));
        dispatch(
          setAiGenProgress({
            progress: 100,
            label: "Cours genere",
          }),
        );
        if (!customPrompt) setPrompt("");
      } catch (e: unknown) {
        clearInterval(progressInterval);
        if (requestIdRef.current !== requestId) {
          return;
        }

        dispatch(setAiGenStatus("error"));
        dispatch(setAiGenError(e instanceof Error ? e.message : "Erreur IA"));
        dispatch(setAiGenProgress({ progress: 0, label: null }));
      }
    },
    [
      activeModuleId,
      builderModules,
      courseMeta.level,
      courseMeta.style,
      courseMeta.title,
      dispatch,
      hasExtract,
      prompt,
      scope,
      selectedBlockId,
      selectedModuleId,
      setup.extractedData,
      setup.description,
      setup.domain,
      setup.level,
      setup.objectives,
      setup.style,
      setup.title,
    ],
  );

  const handleSubmit = useCallback(async () => {
    await runAssistant();
  }, [runAssistant]);

  const handleProposeWithAi = useCallback(async () => {
    setScope("ALL");
    setSelectedModuleId(null);

    dispatch(setAiGenStatus("loading"));
    dispatch(setAiGenError(null));
    dispatch(setAiGenProgress({ progress: 5, label: "Conception du plan de cours..." }));

    // Smooth progress animation
    const progressLabels = [
      { at: 5, label: "Conception du plan de cours..." },
      { at: 15, label: "Structuration des modules..." },
      { at: 25, label: "Rédaction du module 1..." },
      { at: 35, label: "Rédaction du module 2..." },
      { at: 45, label: "Rédaction du module 3..." },
      { at: 55, label: "Rédaction du module 4..." },
      { at: 62, label: "Rédaction du module 5..." },
      { at: 69, label: "Rédaction du module 6..." },
      { at: 76, label: "Création des quiz et exercices..." },
      { at: 82, label: "Finalisation du contenu..." },
    ];
    let currentProgress = 5;
    const progressInterval = setInterval(() => {
      if (currentProgress >= 85) { clearInterval(progressInterval); return; }
      const increment = currentProgress < 20 ? 1.5 : currentProgress < 50 ? 1 : 0.5;
      currentProgress = Math.min(85, currentProgress + increment);
      const labelEntry = [...progressLabels].reverse().find((l) => currentProgress >= l.at);
      dispatch(setAiGenProgress({ progress: Math.round(currentProgress), label: labelEntry?.label ?? "Génération en cours..." }));
    }, 500);

    try {
      const res = await AiService.courseGenerateProgressive({
        context: {
          title: setup.title || "Cours",
          description: setup.description || "",
          objectives: setup.objectives || [],
          domain: setup.domain || "",
          level: setup.level || "",
          style: setup.style || courseMeta.style || "Narratif, progressif, pédagogique",
        },
      });

      clearInterval(progressInterval);

      if (res.error || !res.data) {
        throw new Error(res.error || "Erreur lors de la génération");
      }

      dispatch(setAiGenProgress({ progress: 88, label: "Mise en forme du cours..." }));

      const actions = res.data.actions as Action[];

      dispatch(pushHistory({ label: "Génération progressive IA", runKey: null, modules: builderModules }));

      const payload: Course = { id: "draft", title: setup.title || "Cours", modules: builderModules };
      const next = applyActions(payload, actions);
      dispatch(setBuilderModules(next.modules));

      dispatch(setAiGenProgress({ progress: 100, label: "Cours généré avec succès" }));
      dispatch(setAiGenStatus("success"));
    } catch (e: unknown) {
      clearInterval(progressInterval);
      dispatch(setAiGenStatus("error"));
      dispatch(setAiGenError(e instanceof Error ? e.message : "Erreur IA"));
      dispatch(setAiGenProgress({ progress: 0, label: null }));
    }
  }, [
    dispatch,
    setup.title,
    setup.description,
    setup.domain,
    setup.level,
    setup.objectives,
    setup.style,
    courseMeta.style,
    builderModules,
  ]);

  const [assistantOpen, setAssistantOpen] = useState(false);

  return (
    <div>
      <div className="mx-4 flex flex-col gap-6 md:mx-5 xl:flex-row xl:items-start">
        <CourseContentPanel
          aiStatus={aiStatus}
          aiError={aiError}
          aiProgress={aiProgress}
          aiLabel={aiLabel}
          modules={builderModules}
          onProposeWithAi={handleProposeWithAi}
          proposeDisabled={aiStatus === "loading"}
          proposeLoading={aiStatus === "loading"}
        />

        {/* Desktop: sidebar assistant */}
        <div className="hidden xl:block">
          <AssistantPanel
            modeLabel={modeLabel}
            prompt={prompt}
            onPromptChange={setPrompt}
            onSubmit={handleSubmit}
            loading={aiStatus === "loading"}
            modules={builderModules}
            selectedModuleId={selectedModuleId}
            onSelectModuleId={setSelectedModuleId}
            scope={scope}
            onScopeChange={setScope}
            selectedBlockId={selectedBlockId}
            hasExtract={hasExtract}
            onUploadFile={handleUploadFile}
            extractLoading={extractLoading}
            extractProgress={extractProgress}
            extractError={extractError}
            isHybrid
            documentRequired={false}
            credits={{
              total: aiCredits.total,
              consumed: aiCredits.consumed,
              remaining: aiCredits.remaining,
              lastConsumed: aiCredits.lastConsumed,
            }}
          />
        </div>
      </div>

      {/* Mobile/Tablet: floating chatbot bubble + overlay */}
      <div className="xl:hidden">
        {/* FAB button */}
        {!assistantOpen && (
          <button
            type="button"
            onClick={() => setAssistantOpen(true)}
            className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#7C6BF5] to-[#E84747] text-white shadow-[0_8px_32px_rgba(124,107,245,0.4)] transition hover:scale-105 active:scale-95"
            aria-label="Ouvrir l'assistant IA"
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" />
              <line x1="9" y1="22" x2="15" y2="22" />
              <line x1="12" y1="17" x2="12" y2="22" />
            </svg>
          </button>
        )}

        {/* Overlay panel */}
        {assistantOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              onClick={() => setAssistantOpen(false)}
            />

            {/* Panel */}
            <div className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-white/10 bg-[#0E1118] shadow-[0_-20px_60px_rgba(0,0,0,0.5)]">
              {/* Handle */}
              <div className="flex justify-center py-2">
                <div className="h-1 w-10 rounded-full bg-white/20" />
              </div>

              {/* Close button */}
              <div className="flex items-center justify-between px-4 pb-2">
                <h3 className="text-sm font-semibold text-white">Assistant IA</h3>
                <button
                  type="button"
                  onClick={() => setAssistantOpen(false)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white/60 transition hover:bg-white/8"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>

              <div className="px-2 pb-6">
                <AssistantPanel
                  modeLabel={modeLabel}
                  prompt={prompt}
                  onPromptChange={setPrompt}
                  onSubmit={handleSubmit}
                  loading={aiStatus === "loading"}
                  modules={builderModules}
                  selectedModuleId={selectedModuleId}
                  onSelectModuleId={setSelectedModuleId}
                  scope={scope}
                  onScopeChange={setScope}
                  selectedBlockId={selectedBlockId}
                  hasExtract={hasExtract}
                  onUploadFile={handleUploadFile}
                  extractLoading={extractLoading}
                  extractProgress={extractProgress}
                  extractError={extractError}
                  isHybrid
                  documentRequired={false}
                  credits={{
                    total: aiCredits.total,
                    consumed: aiCredits.consumed,
                    remaining: aiCredits.remaining,
                    lastConsumed: aiCredits.lastConsumed,
                  }}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
