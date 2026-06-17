"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { shallowEqual } from "react-redux";
import { toast } from "../../lib/notify";
import Header from "../courseV2/Header";
import Step1General from "../courseV2/Step1General";
import Step2Content from "../courseV2/Step2Content";
import Step3Setting from "../courseV2/Step3Setting";
import { CourseService } from "../../services/course.service";
import { EntityService } from "../../services/entity.service";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { resetDraft, setBuilderModules, updateDraft } from "../../store/slices/courseSlice";
import {
  resetCourseSetup,
  updateCourseSetup,
} from "../../store/slices/courseSetupSlice";
import { getModulesStructureReport } from "../../lib/course/moduleStructure";
import { getCourseDraftStorageKey } from "../../lib/courseDraftStorage";
import type {
  CourseCreationMode,
  CourseVisibility,
  Module,
} from "./types";
import { getEntityDetailHref } from "../../lib/entityNavigation";
import { useCourseDraftPersistence } from "../../hooks/useCourseDraftPersistence";

export interface RecordCourseModalV2Props {
  backTo?: string | null;
  parentId?: string;
  courseId?: string;
  mode?: "creation" | "edition";
}

const MANAGER_ROLES = new Set(["OWNER", "ADMIN", "INSTRUCTOR"]);

type EditBaseline = {
  title: string;
  description: string;
  domain: string;
  level: string;
  objectives: string[];
  modules: Module[];
};

type EditSummary = {
  generalChanges: number;
  modulesAdded: number;
  modulesRemoved: number;
  modulesEdited: number;
  blocksAdded: number;
  blocksRemoved: number;
  totalChanges: number;
};

type CourseEditorStep = 1 | 2 | 3;

function getCourseEditorSessionKey(args: {
  mode: "creation" | "edition";
  courseId?: string;
  parentId?: string;
}) {
  const targetId =
    (args.mode === "edition" ? args.courseId : args.parentId) || "draft";
  return `hummind:course-editor:v2:${args.mode}:${targetId}`;
}

function readStoredEditorStep(storageKey: string): CourseEditorStep {
  if (typeof window === "undefined") return 1;

  try {
    const rawValue = window.sessionStorage.getItem(storageKey);
    const parsedValue = Number.parseInt(rawValue ?? "", 10);

    if (parsedValue === 2 || parsedValue === 3) {
      return parsedValue;
    }
  } catch {
    // ignore session storage issues
  }

  return 1;
}

function persistEditorStep(storageKey: string, step: CourseEditorStep) {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(storageKey, String(step));
  } catch {
    // ignore session storage issues
  }
}

function clearStoredEditorStep(storageKey: string) {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.removeItem(storageKey);
  } catch {
    // ignore session storage issues
  }
}

function toIsoDateTime(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  if (value.includes("T")) return value;
  return `${value}T00:00:00.000Z`;
}

function toDateInputValue(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return "";
  if (value.includes("T")) return value.slice(0, 10);
  return value;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asTrimmed(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function cloneModules(modules: Module[]): Module[] {
  return JSON.parse(JSON.stringify(modules ?? [])) as Module[];
}

function buildPersistedCourseContent(modules: Module[]) {
  return {
    modules: cloneModules(modules).filter(
      (module) => !!module && typeof module.id === "string",
    ),
  };
}

function normalizeObjectives(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => asTrimmed(item))
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeVisibilityInput(value: unknown): CourseVisibility {
  const v = asTrimmed(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();

  if (v === "LIMITED" || v === "LIMITE") return "Limit\u00e9";
  return "Illimit\u00e9";
}

function normalizeVisibilityOutput(value: unknown): "UNLIMITED" | "LIMITED" {
  const v = asTrimmed(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();

  if (v === "LIMITED" || v === "LIMITE") return "LIMITED";
  return "UNLIMITED";
}

function normalizeCourseMode(value: unknown): CourseCreationMode | null {
  const mode = asTrimmed(value);
  if (mode === "AI_ONLY" || mode === "HYBRID" || mode === "STEP_BY_STEP") {
    return mode;
  }
  return null;
}

function extractRawCourse(data: unknown): Record<string, unknown> | null {
  const root = asRecord(data);
  if (!root) return null;

  const nested = asRecord(root.data);
  if (nested && (nested.id || nested.title || nested.content || nested.builder)) {
    return nested;
  }

  return root;
}

function extractModules(raw: Record<string, unknown>): Module[] {
  const fromBuilder = asRecord(raw.builder);
  const fromContent = asRecord(raw.content);

  const rawModules =
    (Array.isArray(fromBuilder?.modules) && fromBuilder?.modules) ||
    (Array.isArray(fromContent?.modules) && fromContent?.modules) ||
    (Array.isArray(raw.modules) && raw.modules) ||
    [];

  return rawModules as Module[];
}

function countGeneralChanges(baseline: EditBaseline, current: EditBaseline): number {
  let count = 0;

  if (baseline.title.trim() !== current.title.trim()) count += 1;
  if (baseline.description.trim() !== current.description.trim()) count += 1;
  if (baseline.domain.trim() !== current.domain.trim()) count += 1;
  if (baseline.level.trim() !== current.level.trim()) count += 1;

  const baselineObjectives = normalizeObjectives(baseline.objectives).join("||");
  const currentObjectives = normalizeObjectives(current.objectives).join("||");
  if (baselineObjectives !== currentObjectives) count += 1;

  return count;
}

function computeEditSummary(
  baseline: EditBaseline | null,
  current: EditBaseline,
): EditSummary | null {
  if (!baseline) return null;

  const baselineById = new Map(baseline.modules.map((module) => [module.id, module]));
  const currentById = new Map(current.modules.map((module) => [module.id, module]));

  const modulesAdded = current.modules.filter((module) => !baselineById.has(module.id));
  const modulesRemoved = baseline.modules.filter((module) => !currentById.has(module.id));

  let modulesEdited = 0;
  let blocksAdded = modulesAdded.reduce(
    (sum, module) => sum + (module.blocks?.length ?? 0),
    0,
  );
  let blocksRemoved = modulesRemoved.reduce(
    (sum, module) => sum + (module.blocks?.length ?? 0),
    0,
  );

  for (const currentModule of current.modules) {
    const oldModule = baselineById.get(currentModule.id);
    if (!oldModule) continue;

    const oldJson = JSON.stringify(oldModule);
    const currentJson = JSON.stringify(currentModule);
    if (oldJson !== currentJson) {
      modulesEdited += 1;
    }

    const oldBlockIds = new Set((oldModule.blocks ?? []).map((block) => block.id));
    const currentBlockIds = new Set((currentModule.blocks ?? []).map((block) => block.id));

    for (const id of currentBlockIds) {
      if (!oldBlockIds.has(id)) blocksAdded += 1;
    }
    for (const id of oldBlockIds) {
      if (!currentBlockIds.has(id)) blocksRemoved += 1;
    }
  }

  const generalChanges = countGeneralChanges(baseline, current);
  const totalChanges =
    generalChanges +
    modulesAdded.length +
    modulesRemoved.length +
    modulesEdited +
    blocksAdded +
    blocksRemoved;

  return {
    generalChanges,
    modulesAdded: modulesAdded.length,
    modulesRemoved: modulesRemoved.length,
    modulesEdited,
    blocksAdded,
    blocksRemoved,
    totalChanges,
  };
}

export default function RecordCourseModalV2({
  backTo = null,
  parentId = "",
  courseId,
  mode = "creation",
}: RecordCourseModalV2Props) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const course = useAppSelector(
    (s) => ({
      mode: s.course.mode,
      title: s.course.title,
      description: s.course.description,
      domain: s.course.domain,
      level: s.course.level,
      style: s.course.style,
      objectives: s.course.objectives,
      extractedData: s.course.extractedData,
      visibility: s.course.visibility,
      startDate: s.course.startDate,
      endDate: s.course.endDate,
      builderModules: s.course.builder.modules,
    }),
    shallowEqual,
  );
  const setup = useAppSelector(
    (s) => ({
      mode: s.courseSetup.mode,
      title: s.courseSetup.title,
      description: s.courseSetup.description,
      domain: s.courseSetup.domain,
      level: s.courseSetup.level,
      style: s.courseSetup.style,
      objectives: s.courseSetup.objectives,
      extractedData: s.courseSetup.extractedData,
    }),
    shallowEqual,
  );
  const draftStorageKey = useMemo(
    () =>
      getCourseDraftStorageKey({
        variant: "v2",
        mode,
        courseId,
        parentId,
      }),
    [courseId, mode, parentId],
  );
  const editorSessionKey = useMemo(
    () =>
      getCourseEditorSessionKey({
        mode,
        courseId,
        parentId,
      }),
    [courseId, mode, parentId],
  );
  const { clearPersistedDraft } = useCourseDraftPersistence({
    storageKey: draftStorageKey,
    enabled: mode === "creation",
  });

  const [step, setStep] = useState<CourseEditorStep>(1);
  const [stepHydrated, setStepHydrated] = useState(false);

  // Restore step from sessionStorage after hydration to avoid SSR mismatch
  useEffect(() => {
    if (stepHydrated) return;
    const stored = readStoredEditorStep(
      getCourseEditorSessionKey({ mode, courseId, parentId }),
    );
    if (stored !== 1) setStep(stored);
    setStepHydrated(true);
  }, [stepHydrated, mode, courseId, parentId]);

  const [canNext, setCanNext] = useState(false);
  const [loadingCourse, setLoadingCourse] = useState(mode === "edition");
  const [submitting, setSubmitting] = useState(false);
  const [resolvedEntityId, setResolvedEntityId] = useState(parentId);
  const [editBaseline, setEditBaseline] = useState<EditBaseline | null>(null);

  const didPrefill = useRef(false);

  const editionCourseId = mode === "edition" ? (courseId || parentId) : "";

  const steps = useMemo(
    () => ({
      1: "Informations Generales",
      2: "Modules et contenu",
      3: "Publication",
    }),
    [],
  );

  const stepTotal = 3;
  const primaryLabel =
    step < 3
      ? "Suivant"
      : mode === "creation"
        ? "Publier le cours"
        : "Publier mise a jour";

  const currentForSummary = useMemo<EditBaseline>(
    () => ({
      title: setup.title,
      description: setup.description,
      domain: setup.domain,
      level: setup.level,
      objectives: setup.objectives,
      modules: cloneModules(course.builderModules),
    }),
    [
      course.builderModules,
      setup.description,
      setup.domain,
      setup.level,
      setup.objectives,
      setup.title,
    ],
  );

  const editSummary = useMemo(
    () => computeEditSummary(editBaseline, currentForSummary),
    [editBaseline, currentForSummary],
  );

  const resetCreationState = useCallback(() => {
    clearStoredEditorStep(editorSessionKey);
    clearPersistedDraft();
    dispatch(resetDraft());
    dispatch(resetCourseSetup());
  }, [clearPersistedDraft, dispatch, editorSessionKey]);

  useEffect(() => {
    if (mode !== "edition" || !editionCourseId || didPrefill.current) return;
    didPrefill.current = true;

    const preloadCourse = async () => {
      setLoadingCourse(true);
      try {
        const { data, status, error } = await CourseService.getCourseByID(editionCourseId);

        if (status !== 200 || !data) {
          toast.error(error || "Impossible de charger le cours.");
          return;
        }

        const raw = extractRawCourse(data);
        if (!raw) {
          toast.error("Cours introuvable.");
          return;
        }

        const modules = extractModules(raw);
        const objectives = normalizeObjectives(raw.objectives);
        const normalizedMode = normalizeCourseMode(raw.mode);
        const normalizedVisibility = normalizeVisibilityInput(raw.visibility);
        const entityId = asTrimmed(raw.entityId) || parentId;

        if (!entityId) {
          toast.error("Impossible de retrouver la salle de ce cours.");
          router.replace("/organisation");
          return;
        }

        const entityRes = await EntityService.entityById(entityId);
        if (entityRes.status !== 200 || !entityRes.data) {
          toast.error(
            entityRes.error || "Impossible de verifier vos droits sur ce cours.",
          );
          router.replace("/organisation");
          return;
        }

        if (!MANAGER_ROLES.has(entityRes.data.myRole ?? "")) {
          toast.error("Vous n'etes pas autorise a modifier ce cours.");
          router.replace(
            getEntityDetailHref({
              id: entityRes.data.id,
              type: entityRes.data.type,
            }),
          );
          return;
        }

        dispatch(
          updateDraft({
            ...(normalizedMode ? { mode: normalizedMode } : {}),
            title: asTrimmed(raw.title),
            description: asTrimmed(raw.description),
            content: "",
            visibility: normalizedVisibility,
            allowComments: raw.allowComments === false ? false : true,
            domain: asTrimmed(raw.domain),
            level: asTrimmed(raw.level),
            style: asTrimmed(raw.style),
            objectives: objectives.join("\n"),
            extractedData: asTrimmed(raw.extractedData) || undefined,
            startDate: toDateInputValue(raw.startDate),
            endDate: toDateInputValue(raw.endDate),
            link: asTrimmed(raw.link),
            rooms: Array.isArray(raw.rooms) ? (raw.rooms as string[]) : [],
            status:
              asTrimmed(raw.status) === "PUBLISHED"
                ? "PUBLISHED"
                : asTrimmed(raw.status) === "ARCHIVED"
                  ? "ARCHIVED"
                  : "DRAFT",
          }),
        );

        dispatch(
          updateCourseSetup({
            mode: normalizedMode,
            title: asTrimmed(raw.title),
            description: asTrimmed(raw.description),
            domain: asTrimmed(raw.domain),
            level: asTrimmed(raw.level),
            style: asTrimmed(raw.style),
            objectives,
            extractedData: asTrimmed(raw.extractedData) || undefined,
          }),
        );

        dispatch(setBuilderModules(modules));
        setResolvedEntityId(entityId);

        setEditBaseline({
          title: asTrimmed(raw.title),
          description: asTrimmed(raw.description),
          domain: asTrimmed(raw.domain),
          level: asTrimmed(raw.level),
          objectives,
          modules: cloneModules(modules),
        });
      } catch (error) {
        console.error("Erreur lors du prechargement du cours", error);
        toast.error("Erreur lors du chargement du cours.");
      } finally {
        setLoadingCourse(false);
      }
    };

    preloadCourse();
  }, [dispatch, editionCourseId, mode, parentId, router]);

  useEffect(() => {
    const setupEmpty =
      !setup.title.trim() &&
      !setup.description.trim() &&
      setup.objectives.length === 0;
    if (!setupEmpty) return;

    const courseObjectives =
      typeof course.objectives === "string"
        ? course.objectives
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean)
        : [];
    const hasCourseData =
      !!course.title.trim() ||
      !!course.description.trim() ||
      courseObjectives.length > 0;
    if (!hasCourseData) return;

    dispatch(
      updateCourseSetup({
        mode: course.mode,
        title: course.title,
        description: course.description,
        domain: course.domain,
        level: course.level,
        style: course.style,
        objectives: courseObjectives,
        extractedData: course.extractedData,
      }),
    );
  }, [
    course.description,
    course.domain,
    course.extractedData,
    course.level,
    course.mode,
    course.objectives,
    course.style,
    course.title,
    dispatch,
    setup.description,
    setup.objectives.length,
    setup.title,
  ]);

  useEffect(() => {
    setStep(readStoredEditorStep(editorSessionKey));
  }, [editorSessionKey]);

  useEffect(() => {
    persistEditorStep(editorSessionKey, step);
  }, [editorSessionKey, step]);

  const close = useCallback(() => {
    resetCreationState();
    if (backTo) {
      router.replace(backTo);
      return;
    }
    router.back();
  }, [backTo, resetCreationState, router]);

  const goPrev = () => {
    setCanNext(false);
    setStep((prev) => (prev > 1 ? ((prev - 1) as CourseEditorStep) : prev));
  };

  const submitCourse = useCallback(
    async (publish: boolean) => {
      const isEdition = mode === "edition";

      if (publish) {
        if (
          !setup.title.trim() ||
          !setup.description.trim() ||
          setup.objectives.length === 0
        ) {
          toast.error("Completez le brief: titre, description et objectifs.");
          return;
        }

        if (!course.builderModules.length) {
          toast.error("Ajoutez au moins un module avant publication.");
          return;
        }

        const structure = getModulesStructureReport(course.builderModules);
        if (!structure.ok) {
          const topInvalid = structure.invalid
            .slice(0, 3)
            .map((item) => item.moduleTitle || `Module ${item.moduleIndex + 1}`)
            .join(", ");
          const moreCount = Math.max(0, structure.invalid.length - 3);
          const moreLabel = moreCount > 0 ? ` +${moreCount} autre(s)` : "";
          toast.error(
            `Structure incomplète (${topInvalid}${moreLabel}). Chaque module doit contenir au moins un titre, un contenu et un quiz ou exercice.`,
          );
          return;
        }

        // Auto-fix generic module titles from content
        const genericTitlePattern = /^(?:module|chapitre|introduction|conclusion|generalites)\s*\d*$/i;
        let didFixTitles = false;
        const fixedModules = course.builderModules.map((m) => {
          if (!genericTitlePattern.test(m.title?.trim() || "")) return m;

          // Try to find a better title from the module's blocks
          const titleBlock = (m.blocks || []).find(
            (b) => b.type === "title" && b.text?.trim() && !genericTitlePattern.test(b.text.trim()),
          );
          const contentBlock = (m.blocks || []).find(
            (b) => b.type === "content" && b.title?.trim() && !genericTitlePattern.test(b.title.trim()),
          );
          const newTitle =
            titleBlock?.text?.trim() ||
            contentBlock?.title?.trim() ||
            null;

          if (newTitle) {
            didFixTitles = true;
            return { ...m, title: newTitle };
          }
          return m;
        });

        if (didFixTitles) {
          dispatch(setBuilderModules(fixedModules));
          toast.info("Les titres de modules génériques ont été corrigés automatiquement.");
        }

        // Check if any generic titles remain after auto-fix
        const remainingGeneric = fixedModules.filter(
          (m) => genericTitlePattern.test(m.title?.trim() || ""),
        );
        if (remainingGeneric.length > 0) {
          const names = remainingGeneric
            .slice(0, 3)
            .map((m) => `"${m.title}"`)
            .join(", ");
          toast.error(
            `Renommez les modules avec des titres descriptifs (${names}). Un titre comme "Module 1" n'aide pas l'apprenant.`,
          );
          return;
        }

        // Block pending blocks
        const pendingBlocks = course.builderModules.flatMap((m) =>
          (m.blocks || []).filter((b) => b.status === "pending"),
        );
      

        if (isEdition && editSummary && editSummary.totalChanges === 0) {
          toast.error("Aucun changement detecte a publier.");
          return;
        }
      }

      if (!isEdition && !parentId) {
        toast.error("Impossible de publier: salle non trouvee.");
        return;
      }

      if (isEdition && !editionCourseId) {
        toast.error("Impossible de modifier: cours non trouve.");
        return;
      }

      setSubmitting(true);
      try {
        const visibility = normalizeVisibilityOutput(
          course.visibility || "Illimit\u00e9",
        );
        const persistedContent = buildPersistedCourseContent(
          course.builderModules,
        );

        if (!persistedContent.modules.length) {
          toast.error(
            "Le contenu du cours est vide. Generez ou ajoutez au moins un module avant d'enregistrer.",
          );
          return;
        }

        const payload = {
          ...(isEdition
            ? {}
            : {
                entityId: parentId,
                categoryIds: [],
              }),
          title: setup.title.trim() || course.title.trim() || "Cours",
          description: setup.description.trim(),
          objectives: setup.objectives,
          domain: setup.domain,
          level: setup.level,
          mode: setup.extractedData?.trim() ? "HYBRID" : "STEP_BY_STEP",
          content: persistedContent,
          visibility,
          status: publish ? "PUBLISHED" : "DRAFT",
          ...(toIsoDateTime(course.startDate) && {
            startDate: toIsoDateTime(course.startDate),
          }),
          ...(toIsoDateTime(course.endDate) && {
            endDate: toIsoDateTime(course.endDate),
          }),
        };

        const res = isEdition
          ? await CourseService.update(editionCourseId, payload)
          : await CourseService.create(payload);

        if (res.status === 200 || res.status === 201) {
          if (!publish && isEdition) {
            toast.success("Brouillon enregistre.");
            setEditBaseline({
              ...currentForSummary,
              modules: cloneModules(currentForSummary.modules),
            });
            return;
          }

          toast.success(
            isEdition ? "Mise a jour publiee avec succes." : "Cours publie avec succes.",
          );

          resetCreationState();

          if (!isEdition) {
            router.replace(`/salle/${parentId}`);
            return;
          }

          if (resolvedEntityId) {
            router.replace(`/salle/${resolvedEntityId}`);
            return;
          }

          close();
          return;
        }

        toast.error(
          res.error ||
            (publish
              ? "Echec de publication du cours."
              : "Echec de sauvegarde du brouillon."),
        );
      } catch (error) {
        console.error("Erreur lors de la soumission du cours", error);
        toast.error(
          publish
            ? "Impossible de publier le cours."
            : "Impossible d'enregistrer le brouillon.",
        );
      } finally {
        setSubmitting(false);
      }
    },
    [
      close,
      course.builderModules,
      course.endDate,
      course.startDate,
      course.title,
      course.visibility,
      currentForSummary,
      editSummary,
      editionCourseId,
      mode,
      parentId,
      resetCreationState,
      resolvedEntityId,
      router,
      setup.description,
      setup.domain,
      setup.extractedData,
      setup.level,
      setup.objectives,
      setup.title,
    ],
  );

  const handlePrimary = async () => {
    if (step < 3) {
      setCanNext(false);
      setStep((prev) =>
        prev < 3 ? ((prev + 1) as CourseEditorStep) : prev,
      );
      return;
    }

    await submitCourse(true);
  };

  const handleSaveDraft = async () => {
    if (step !== 3 || mode !== "edition") return;
    await submitCourse(false);
  };

  if (mode === "edition" && loadingCourse) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Chargement du cours...</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background">
      <div className="absolute inset-0 flex flex-col">
        <Header
          mode={mode}
          stepLabel={steps[step]}
          stepIndex={step}
          stepTotal={stepTotal}
          onClose={close}
          onPrev={goPrev}
          onNext={handlePrimary}
          canPrev={step > 1}
          canNext={canNext}
          loading={loadingCourse}
          submitting={submitting}
          nextLabel={primaryLabel}
          secondaryLabel={mode === "edition" && step === 3 ? "Enregistrer brouillon" : undefined}
          onSecondary={mode === "edition" && step === 3 ? handleSaveDraft : undefined}
          secondaryDisabled={submitting || loadingCourse}
        />

        <div className="flex-1 overflow-y-auto p-6 sm:p-8">
          {step === 1 && <Step1General onValidChange={setCanNext} />}
          {step === 2 && <Step2Content onValidChange={setCanNext} />}
          {step === 3 && (
            <Step3Setting onValidChange={setCanNext} />
          )}
        </div>
      </div>
    </div>
  );
}

