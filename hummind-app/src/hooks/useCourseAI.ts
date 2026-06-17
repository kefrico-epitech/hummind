"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { useDebouncedValue } from "./useDebouncedValue";
import {
  applyAiUsage,
  pushHistory,
  setAiGenError,
  setAiGenLastRunKey,
  setAiGenProgress,
  setAiGenStatus,
  setBuilderModules,
} from "../store/slices/courseSlice";
import type { Action, Course } from "../components/course/types";
import { applyActions } from "../lib/course/applyActions";

function isStep2Ready(draft: Record<string, unknown>) {
  return (
    !!String(draft.title ?? "").trim() &&
    !!String(draft.domain ?? "").trim() &&
    !!String(draft.level ?? "").trim() &&
    !!String(draft.description ?? "").trim() &&
    !!String(draft.objectives ?? "").trim()
  );
}

function computeAiOnlyRunKey(draft: Record<string, unknown>) {
  return [
    "AI_ONLY",
    draft.title,
    draft.domain,
    draft.level,
    draft.style,
    draft.description,
    draft.objectives,
  ].join("||");
}

function computeHybridRunKey(draft: Record<string, unknown>) {
  const text = String(draft.extractedData ?? "");
  const head = text.slice(0, 240);
  return ["HYBRID", draft.title ?? "", String(text.length), head].join("||");
}

function objectivesToArray(value: unknown): string[] {
  return String(value ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function useCourseAI() {
  const dispatch = useAppDispatch();
  const aiGen = useAppSelector((s) => s.course.aiGen);
  const builderModules = useAppSelector((s) => s.course.builder.modules);
  const courseMode = useAppSelector((s) => s.course.mode);
  const courseTitle = useAppSelector((s) => s.course.title);
  const courseDescription = useAppSelector((s) => s.course.description);
  const courseObjectives = useAppSelector((s) => s.course.objectives);
  const courseDomain = useAppSelector((s) => s.course.domain);
  const courseLevel = useAppSelector((s) => s.course.level);
  const courseStyle = useAppSelector((s) => s.course.style);
  const courseExtractedData = useAppSelector((s) => s.course.extractedData);

  const isAiOnly = courseMode === "AI_ONLY";
  const isHybrid = courseMode === "HYBRID";

  const step2Ready = isStep2Ready({
    title: courseTitle,
    domain: courseDomain,
    level: courseLevel,
    description: courseDescription,
    objectives: courseObjectives,
  });
  const hybridReady = !!courseExtractedData?.trim();

  const runAI = useCallback(
    async ({
      mode,
      moduleId,
      instructions,
      saveRunKey,
      scope,
      targetBlockId,
    }: {
      mode: "PLAN" | "COMPLETE_MODULE" | "SIMPLIFY";
      moduleId: string | null;
      instructions: string;
      saveRunKey?: string;
      scope?: "ALL" | "MODULE" | "BLOCK";
      targetBlockId?: string | null;
    }) => {
      dispatch(setAiGenStatus("loading"));
      dispatch(setAiGenError(null));
      dispatch(
        setAiGenProgress({
          progress: 5,
          label: "Préparation de la génération...",
        }),
      );

      // Smooth progress animation during AI generation
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
        // Accelerate at start, slow down toward the end
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
          title: courseTitle,
          modules: builderModules,
        };

        const endpoint = isHybrid
          ? "/api/ai/hybrid-generate"
          : "/api/ai/course-actions";

        const body: Record<string, unknown> = {
          mode,
          prompt: instructions,
          course: payload,
          targetModuleId: moduleId,
          scope: scope ?? "ALL",
          targetBlockId: targetBlockId ?? null,
          language: "fr",
          level: courseLevel,
          context: {
            title: courseTitle,
            description: courseDescription,
            objectives: objectivesToArray(courseObjectives),
            domain: courseDomain,
            level: courseLevel,
            style: courseStyle,
          },
        };

        if (isHybrid) {
          body.extractedData = courseExtractedData;
        }

        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          let details = "";
          try {
            const errJson = await res.json();
            details = errJson?.details || errJson?.error || JSON.stringify(errJson);
          } catch {
            details = await res.text().catch(() => "");
          }
          throw new Error(details ? `Erreur IA: ${details}` : "Erreur IA");
        }

        clearInterval(progressInterval);
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
            label: isHybrid ? "Génération Hybride" : "Génération IA",
            runKey: saveRunKey ?? null,
            modules: payload.modules,
          }),
        );

        dispatch(
          setAiGenProgress({
            progress: 90,
            label: "Application des modifications...",
          }),
        );
        const next = applyActions(payload, actions);
        dispatch(setBuilderModules(next.modules));
        if (usage) {
          dispatch(applyAiUsage(usage));
        }

        if (saveRunKey) dispatch(setAiGenLastRunKey(saveRunKey));
        dispatch(setAiGenStatus("success"));
        dispatch(
          setAiGenProgress({
            progress: 100,
            label: "Cours généré avec succès",
          }),
        );
      } catch (e: unknown) {
        clearInterval(progressInterval);
        dispatch(setAiGenStatus("error"));
        dispatch(setAiGenError(e instanceof Error ? e.message : "Erreur IA"));
        dispatch(setAiGenProgress({ progress: 0, label: null }));
      }
    },
    [
      builderModules,
      courseDescription,
      courseDomain,
      courseExtractedData,
      courseLevel,
      courseObjectives,
      courseStyle,
      courseTitle,
      dispatch,
      isHybrid,
    ],
  );

  const aiOnlyRunKey = useMemo(
    () =>
      computeAiOnlyRunKey({
        title: courseTitle,
        domain: courseDomain,
        level: courseLevel,
        style: courseStyle,
        description: courseDescription,
        objectives: courseObjectives,
      }),
    [
      courseDescription,
      courseDomain,
      courseLevel,
      courseObjectives,
      courseStyle,
      courseTitle,
    ],
  );
  const debouncedAiOnlyRunKey = useDebouncedValue(aiOnlyRunKey, 400);

  useEffect(() => {
    if (!isAiOnly || !step2Ready) return;
    if (debouncedAiOnlyRunKey !== aiOnlyRunKey) return;

    const runKey = aiOnlyRunKey;
    if (aiGen.lastRunKey === runKey) return;

    runAI({
      mode: "PLAN",
      moduleId: null,
      instructions: [
        `Titre: ${courseTitle}`,
        `Domaine: ${courseDomain}`,
        `Niveau: ${courseLevel}`,
        courseStyle ? `Style: ${courseStyle}` : null,
        `Description: ${courseDescription}`,
        `Objectifs: ${courseObjectives}`,
        "Ecris comme un professeur qui explique pas a pas, avec une voix narrative et simple.",
        "Evite les notes brutes et les listes seches.",
        "Quand c'est utile, utilise les marqueurs: Objectif du chapitre:, Definition:, Exemple concret:, Point-cle a retenir:.",
      ]
        .filter(Boolean)
        .join("\n"),
      saveRunKey: runKey,
      scope: "ALL",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    aiGen.lastRunKey,
    aiOnlyRunKey,
    debouncedAiOnlyRunKey,
    isAiOnly,
    step2Ready,
  ]);

  const hybridRunKey = useMemo(
    () =>
      computeHybridRunKey({
        title: courseTitle,
        extractedData: courseExtractedData,
      }),
    [courseExtractedData, courseTitle],
  );
  const debouncedHybridRunKey = useDebouncedValue(hybridRunKey, 400);

  useEffect(() => {
    if (!isHybrid || !hybridReady) return;
    if (debouncedHybridRunKey !== hybridRunKey) return;

    const runKey = hybridRunKey;
    if (aiGen.lastRunKey === runKey) return;

    runAI({
      mode: "PLAN",
      moduleId: null,
      instructions: [
        "Genere le cours en te basant prioritairement sur le document fourni.",
        "Garde une progression pedagogique claire.",
        "Rends le contenu narratif, progressif et facile a lire comme une mini-lecon.",
        "Evite les notes brutes et les blocs trop telegraphiques.",
        "Quand c'est utile, utilise les marqueurs: Objectif du chapitre:, Definition:, Exemple concret:, Point-cle a retenir:.",
        courseTitle?.trim() ? `Titre (optionnel): ${courseTitle}` : null,
        courseStyle?.trim() ? `Style: ${courseStyle}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
      saveRunKey: runKey,
      scope: "ALL",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    aiGen.lastRunKey,
    hybridRunKey,
    debouncedHybridRunKey,
    hybridReady,
    isHybrid,
  ]);

  return {
    aiStatus: aiGen.status,
    aiError: aiGen.error,
    aiProgress: aiGen.progress,
    aiLabel: aiGen.label,
    isAiOnly,
    isHybrid,
    step2Ready,
    hybridReady,
    runAI,
  };
}
