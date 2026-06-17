"use client";

import { X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { shallowEqual } from "react-redux";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";

import type {
  CourseCreationMode,
  CourseDraft,
  CourseVisibility,
  WizardStep,
} from "./types";
import { Step1Mode } from "./steps/Step1Mode";
import { Step2General } from "./steps/Step2General";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { Step3Content } from "./steps/Step3Content";
import { Step4Settings } from "./steps/Step4Settings";
import { Step5Finish } from "./steps/Step5Finish";
import { Stepper } from "./stepper";
import { CourseService } from "../../services/course.service";
import { toast } from "../../lib/notify";
import { getCourseDraftStorageKey } from "../../lib/courseDraftStorage";
import {
  resetDraft,
  setBuilderModules,
  updateDraft,
} from "../../store/slices/courseSlice";
import { resetCourseSetup } from "../../store/slices/courseSetupSlice";
import { useCourseDraftPersistence } from "../../hooks/useCourseDraftPersistence";

export interface RecordCourseModalProps {
  backTo?: string | null;
  parentId?: string;
  mode?: "creation" | "edition";
}

function getLegacyEditorSessionKey(args: {
  mode: "creation" | "edition";
  parentId?: string;
}) {
  return `hummind:course-editor:legacy:${args.mode}:${args.parentId || "draft"}`;
}

function readLegacyStoredStep(storageKey: string): WizardStep {
  if (typeof window === "undefined") return 1;

  try {
    const rawValue = window.sessionStorage.getItem(storageKey);
    const parsedValue = Number.parseInt(rawValue ?? "", 10);

    if (parsedValue >= 1 && parsedValue <= 5) {
      return parsedValue as WizardStep;
    }
  } catch {
    // ignore session storage issues
  }

  return 1;
}

function persistLegacyStep(storageKey: string, step: WizardStep) {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(storageKey, String(step));
  } catch {
    // ignore session storage issues
  }
}

function clearLegacyStoredStep(storageKey: string) {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.removeItem(storageKey);
  } catch {
    // ignore session storage issues
  }
}

function toDateInputValue(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return "";
  if (value.includes("T")) return value.slice(0, 10);
  return value;
}

function toIsoDateTime(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  if (value.includes("T")) return value;
  return `${value}T00:00:00.000Z`;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

function buildPersistedCourseContent(modules: unknown) {
  return {
    modules: Array.isArray(modules)
      ? JSON.parse(JSON.stringify(modules))
      : [],
  };
}

export default function RecordCourseModal({
  backTo = null,
  parentId = "",
  mode = "creation",
}: RecordCourseModalProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  // Narrow the selector: this component only needs draft fields, not the
  // aiGen / history slice that mutate on every Hummind interaction.
  const course = useAppSelector((state) => state.course, shallowEqual);
  const draftStorageKey = getCourseDraftStorageKey({
    variant: "legacy",
    mode,
    parentId,
  });
  const editorSessionKey = getLegacyEditorSessionKey({ mode, parentId });
  const { clearPersistedDraft } = useCourseDraftPersistence({
    storageKey: draftStorageKey,
    enabled: mode === "creation",
  });
  const resetCreationState = useCallback(() => {
    clearLegacyStoredStep(editorSessionKey);
    clearPersistedDraft();
    dispatch(resetDraft());
    dispatch(resetCourseSetup());
  }, [clearPersistedDraft, dispatch, editorSessionKey]);

  const close = () => {
    resetCreationState();
    if (backTo) {
      router.replace(backTo);
      return;
    }
    router.back();
  };

  const [step, setStep] = useState<WizardStep>(() =>
    readLegacyStoredStep(editorSessionKey),
  );
  const [canNext, setCanNext] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingCourse, setLoadingCourse] = useState(false);
  const didPrefill = useRef(false);

  useEffect(() => {
    if (mode !== "edition" || !parentId || didPrefill.current) return;
    didPrefill.current = true;

    const preloadCourse = async () => {
      setLoadingCourse(true);
      try {
        const { data, status: responseStatus } =
          await CourseService.getCourseByID(parentId);
        if (responseStatus !== 200 || !data) {
          toast.error("Impossible de charger le cours");
          return;
        }

        const maybeNested = asRecord(data);
        const nestedData = asRecord(maybeNested?.data);
        const raw = nestedData?.id ? nestedData : maybeNested;

        if (!raw) {
          toast.error("Cours introuvable");
          return;
        }

        const builderRecord = asRecord(raw.builder);
        const contentRecord = asRecord(raw.content);
        const modules =
          builderRecord?.modules ?? contentRecord?.modules ?? raw.modules ?? [];
        const rawObjectives = raw.objectives;
        const rawRooms = raw.rooms;
        const rawVisibility =
          typeof raw.visibility === "string" ? raw.visibility : "UNLIMITED";
        const modeValue: CourseCreationMode | undefined =
          raw.mode === "AI_ONLY" ||
          raw.mode === "HYBRID" ||
          raw.mode === "STEP_BY_STEP"
            ? raw.mode
            : undefined;
        const status =
          raw.status === "DRAFT" ||
          raw.status === "PUBLISHED" ||
          raw.status === "ARCHIVED"
            ? raw.status
            : "DRAFT";

        const visibility: CourseVisibility =
          rawVisibility === "UNLIMITED"
            ? "Illimit\u00e9"
            : rawVisibility === "LIMITED"
              ? "Limit\u00e9"
              : rawVisibility === "ROOM" ||
                  rawVisibility === "PRIVATE" ||
                  rawVisibility === "PUBLIC"
                ? rawVisibility
                : "Illimit\u00e9";

        const builder = Array.isArray(modules) ? { modules } : { modules: [] };

        const draftPatch: Partial<CourseDraft> = {
          ...(modeValue ? { mode: modeValue } : {}),
          title: typeof raw.title === "string" ? raw.title : "",
          description:
            typeof raw.description === "string" ? raw.description : "",
          content: typeof raw.content === "string" ? raw.content : "",
          visibility,
          allowComments:
            typeof raw.allowComments === "boolean" ? raw.allowComments : true,
          domain: typeof raw.domain === "string" ? raw.domain : "",
          level: typeof raw.level === "string" ? raw.level : "",
          style: typeof raw.style === "string" ? raw.style : "",
          objectives: Array.isArray(rawObjectives)
            ? rawObjectives
                .filter((objective): objective is string => typeof objective === "string")
                .join("\n")
            : typeof rawObjectives === "string"
              ? rawObjectives
              : "",
          startDate: toDateInputValue(raw.startDate),
          endDate: toDateInputValue(raw.endDate),
          link: typeof raw.link === "string" ? raw.link : "",
          rooms: Array.isArray(rawRooms) ? rawRooms : [],
          status,
        };

        dispatch(updateDraft(draftPatch));
        dispatch(setBuilderModules(builder.modules));
      } catch (error) {
        console.error("Erreur lors du prechargement du cours", error);
        toast.error("Erreur lors du chargement du cours");
      } finally {
        setLoadingCourse(false);
      }
    };

    preloadCourse();
  }, [mode, parentId, dispatch]);

  useEffect(() => {
    setStep(readLegacyStoredStep(editorSessionKey));
  }, [editorSessionKey]);

  useEffect(() => {
    persistLegacyStep(editorSessionKey, step);
  }, [editorSessionKey, step]);

  const goPrev = () => {
    if (step === 5) return;
    setStep((currentStep) =>
      currentStep > 1 ? ((currentStep - 1) as WizardStep) : currentStep,
    );
  };
  const goNext = () => setStep((currentStep) => (currentStep < 5 ? ((currentStep + 1) as WizardStep) : currentStep));

  const jumpTo = (nextStep: WizardStep) => {
    if (nextStep <= step) setStep(nextStep);
  };

  const handlePrimary = async () => {
    if (step < 4) {
      goNext();
      return;
    }

    if (step === 5) {
      if (mode === "creation") {
        resetCreationState();
        router.replace(`/salle/${parentId}`);
      } else {
        close();
      }
      return;
    }

    setSubmitting(true);

    try {
      const normalizedVisibility = (() => {
        const value = (course.visibility || "").toString().toUpperCase();
        if (value === "ILLIMITE" || value === "UNLIMITED") {
          return "UNLIMITED";
        }
        if (value === "LIMITE" || value === "LIMITED") {
          return "LIMITED";
        }
        return "UNLIMITED";
      })();

      const isoStartDate = toIsoDateTime(course.startDate);
      const isoEndDate = toIsoDateTime(course.endDate);
      const persistedContent = buildPersistedCourseContent(
        course.builder.modules,
      );

      if (!persistedContent.modules.length) {
        toast.error(
          "Le contenu du cours est vide. Generez ou ajoutez au moins un module avant d'enregistrer.",
        );
        return;
      }

      const baseData = {
        title: course.title,
        description: course.description,
        content: persistedContent,
        mode: course.mode,
        objectives: course.objectives
          .split("\n")
          .map((objective) => objective.trim())
          .filter(Boolean),
        visibility: normalizedVisibility,
        domain: course.domain,
        level: course.level,
        ...(isoStartDate && { startDate: isoStartDate }),
        ...(isoEndDate && { endDate: isoEndDate }),
        ...(course.link && { link: course.link }),
      };

      const creationData = {
        ...baseData,
        entityId: parentId,
        categoryIds: [],
      };

      const updateData = {
        ...baseData,
      };

      console.log(
        "SUBMIT COURSE",
        mode === "creation" ? creationData : updateData,
      );

      const response =
        mode === "creation"
          ? await CourseService.create(creationData)
          : await CourseService.update(parentId, updateData);

      if (response.status === 201 || response.status === 200) {
        setStep(5 as WizardStep);
      }
    } catch (error) {
      console.error("Erreur lors de la soumission du cours", error);
      toast.error("Impossible de soumettre le cours");
    } finally {
      setSubmitting(false);
    }
  };

  const primaryLabel =
    step === 4
      ? mode === "creation"
        ? "Creer le cours"
        : "Editer le cours"
      : step === 5
        ? "Termine"
        : "Suivant";

  return (
    <div className="fixed inset-0 z-50 bg-background">
      <div className="absolute inset-0 flex flex-col">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-2">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={close}
              className="flex h-9 w-9 items-center justify-center"
              aria-label="Fermer"
            >
              <X className="h-6 w-6 text-white" />
            </button>
            <div className="text-sm font-medium text-white">
              {mode === "creation" ? "Creer un cours" : "Editer le cours"}
            </div>
          </div>
          <div className="flex gap-4">
            <Button
              type="button"
              onClick={goPrev}
              disabled={step === 1 || step === 5 || submitting || loadingCourse}
              className="h-10 cursor-pointer rounded-full bg-[#6b6b6b]/30 px-8 text-sm font-medium text-white hover:bg-primary"
            >
              Precedent
            </Button>

            <Button
              type="button"
              disabled={submitting || !canNext || loadingCourse}
              onClick={handlePrimary}
              className={`h-10 cursor-pointer rounded-full px-8 text-sm font-medium text-white ${
                canNext ? "bg-primary hover:opacity-90" : "bg-[#6b6b6b]/30"
              }`}
            >
              {loadingCourse
                ? "Chargement..."
                : submitting
                  ? "..."
                  : primaryLabel}
            </Button>
          </div>
        </div>

        <Stepper current={step} onJump={jumpTo} />

        <div className="flex-1 overflow-y-auto">
          {step === 1 && <Step1Mode onValidChange={setCanNext} />}
          {step === 2 && <Step2General onValidChange={setCanNext} />}
          {step === 3 && <Step3Content onValidChange={setCanNext} />}
          {step === 4 && <Step4Settings onValidChange={setCanNext} />}
          {step === 5 && <Step5Finish onValidChange={setCanNext} />}
        </div>
      </div>
    </div>
  );
}

