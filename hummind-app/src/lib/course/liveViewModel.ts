import type { CourseDetail } from "./courseDetail";
import { buildLiveSteps } from "./liveCourse";
import type { LiveCourseStep, LiveStepKind } from "./liveCourse";

export type CourseLiveRelatedTopic = {
  id: string;
  label: string;
  summary: string;
};

export type CourseMenuItemState = "done" | "current" | "upcoming";

export type CourseMenuItem = {
  id: string;
  label: string;
  kind: LiveStepKind;
  state: CourseMenuItemState;
  number?: number;
};

export type CourseMenuModule = {
  id: string;
  eyebrow: string;
  title: string;
  items: CourseMenuItem[];
};

export type CourseMenuScoreMetric = {
  id: string;
  label: string;
  value: string;
  helper: string;
  ratio: number;
  color: string;
};

export type CourseMenuScorePanel = {
  moduleId: string;
  resumeStepId: string;
  eyebrow: string;
  title: string;
  actionLabel: string;
  metrics: CourseMenuScoreMetric[];
};

export type CourseLiveViewModel = {
  courseTitle: string;
  section: string;
  progressPercentage: number;
  introTitle: string;
  introParagraphs: string[];
  relatedTopics: CourseLiveRelatedTopic[];
  menuModules: CourseMenuModule[];
  scorePanels: CourseMenuScorePanel[];
  currentStepId: string;
  currentStepIndex: number;
  steps: LiveCourseStep[];
};

type SourceModule = {
  id: string;
  title: string;
};

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function clampRatio(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function truncateText(value: string, limit: number): string {
  if (value.length <= limit) return value;
  return `${value.slice(0, limit - 1).trimEnd()}...`;
}

function normalizeDisplayParagraph(paragraph: string): string {
  const trimmed = paragraph.trim();
  if (!trimmed) return "";

  if (/^\d+[.)]?$/.test(trimmed)) return "";
  if (/^(?:chapitre|section|partie)\s+\d+\s*[:.-]?$/iu.test(trimmed)) return "";

  return trimmed;
}

function formatDisplayParagraphs(text: string): string[] {
  const normalized = text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\u2022\s*/g, "\n- ");

  return normalized
    .split(/\n+/)
    .map((block) => normalizeDisplayParagraph(block))
    .filter(Boolean);
}

function getSourceModules(course: CourseDetail, steps: LiveCourseStep[]): SourceModule[] {
  if (course.modules.length > 0) {
    return course.modules.map((moduleItem) => ({
      id: moduleItem.id,
      title: moduleItem.title,
    }));
  }

  return [
    ...new Map(
      steps.map((step) => [
        step.moduleId,
        {
          id: step.moduleId,
          title: step.moduleTitle || "Introduction",
        },
      ]),
    ).values(),
  ];
}

function buildIntroParagraphs(course: CourseDetail, step: LiveCourseStep): string[] {
  const fromStep = uniqueStrings(
    (step.kind === "lesson" ? step.sourceLines : step.contextLines).flatMap(
      formatDisplayParagraphs,
    ),
  ).slice(0, 4);

  if (fromStep.length > 0) return fromStep;

  const fromDescription = formatDisplayParagraphs(course.description).slice(0, 3);
  if (fromDescription.length > 0) return fromDescription;

  if (course.objectives.length > 0) {
    return course.objectives.slice(0, 3);
  }

  return ["Le contenu de ce cours est pret pour une lecture en mode live."];
}

function buildTopicSummary(step: LiveCourseStep): string {
  if (step.kind === "quiz") {
    const questionCount = step.quizQuestions.length;
    return questionCount > 1
      ? `${questionCount} questions pour verifier cette notion avant de poursuivre.`
      : "Une question pour verifier cette notion avant de poursuivre.";
  }

  if (step.kind === "exercise") {
    return truncateText(
      step.exercisePrompt || "Un exercice d'application pour mettre cette notion en pratique.",
      120,
    );
  }

  const sourceParagraph = [...step.sourceLines, ...step.contextLines]
    .flatMap(formatDisplayParagraphs)
    .find(Boolean);
  if (sourceParagraph) {
    return truncateText(sourceParagraph, 120);
  }

  return `Une suite logique du module ${step.moduleTitle}.`;
}

function buildRelatedTopics(
  course: CourseDetail,
  steps: LiveCourseStep[],
  currentStepIndex: number,
): CourseLiveRelatedTopic[] {
  const upcomingTopics = steps.slice(currentStepIndex + 1, currentStepIndex + 4);
  if (upcomingTopics.length > 0) {
    return upcomingTopics.map((step) => ({
      id: step.id,
      label: step.title,
      summary: buildTopicSummary(step),
    }));
  }

  if (course.objectives.length > 0) {
    return course.objectives.slice(0, 3).map((objective, index) => ({
      id: `objective-${index + 1}`,
      label: objective,
      summary: "Un objectif cle du cours a revoir ou approfondir.",
    }));
  }

  return [];
}

function buildMenuModules(
  sourceModules: SourceModule[],
  steps: LiveCourseStep[],
  currentStepIndex: number,
): CourseMenuModule[] {
  const stepIndexById = new Map(steps.map((step, index) => [step.id, index]));

  return sourceModules.map((moduleItem, moduleIndex) => {
    const moduleSteps = steps.filter((step) => step.moduleId === moduleItem.id);

    const items: CourseMenuItem[] =
      moduleSteps.length > 0
        ? moduleSteps.map((step, index) => {
            const globalIndex = stepIndexById.get(step.id) ?? index;
            const state: CourseMenuItemState =
              globalIndex < currentStepIndex
                ? "done"
                : globalIndex === currentStepIndex
                  ? "current"
                  : "upcoming";

            return {
              id: step.id,
              label: step.title,
              kind: step.kind,
              state,
              number: step.kind === "exercise" ? undefined : index + 1,
            };
          })
        : [
            {
              id: `${moduleItem.id}-placeholder`,
              label: "Contenu a venir",
              kind: "lesson",
              state: "upcoming",
              number: 1,
            },
          ];

    return {
      id: moduleItem.id,
      eyebrow: `Module ${moduleIndex + 1}`,
      title: moduleItem.title || `Module ${moduleIndex + 1}`,
      items,
    };
  });
}

function getVisitedModuleSteps(
  moduleSteps: LiveCourseStep[],
  currentStepIndex: number,
  stepIndexById: Map<string, number>,
) {
  return moduleSteps.filter(
    (step) => (stepIndexById.get(step.id) ?? Number.POSITIVE_INFINITY) <= currentStepIndex,
  );
}

function buildActionLabel(progressRatio: number): string {
  if (progressRatio <= 0) return "Voir le module";
  if (progressRatio >= 1) return "Revoir le module";
  return "Reprendre le module";
}

function buildScorePanels(
  sourceModules: SourceModule[],
  menuModules: CourseMenuModule[],
  steps: LiveCourseStep[],
  currentStepIndex: number,
): CourseMenuScorePanel[] {
  const stepIndexById = new Map(steps.map((step, index) => [step.id, index]));

  return sourceModules.map((moduleItem, moduleIndex) => {
    const moduleSteps = steps.filter((step) => step.moduleId === moduleItem.id);
    const visitedSteps = getVisitedModuleSteps(
      moduleSteps,
      currentStepIndex,
      stepIndexById,
    );
    const moduleStepCount = moduleSteps.length || 1;
    const visitedStepCount = visitedSteps.length;
    const moduleProgressRatio = clampRatio(visitedStepCount / moduleStepCount);
    const resumeStepId = moduleSteps[0]?.id || `${moduleItem.id}-placeholder`;

    const totalQuizQuestions = moduleSteps.reduce(
      (sum, step) => sum + (step.kind === "quiz" ? step.quizQuestions.length : 0),
      0,
    );
    const visitedQuizQuestions = visitedSteps.reduce(
      (sum, step) => sum + (step.kind === "quiz" ? step.quizQuestions.length : 0),
      0,
    );

    const totalExercises = moduleSteps.filter(
      (step) => step.kind === "exercise",
    ).length;
    const visitedExercises = visitedSteps.filter(
      (step) => step.kind === "exercise",
    ).length;

    const moduleMeta =
      menuModules.find((menuModule) => menuModule.id === moduleItem.id) ??
      menuModules[moduleIndex];

    return {
      moduleId: moduleItem.id,
      resumeStepId,
      eyebrow: moduleMeta?.eyebrow || `Module ${moduleIndex + 1}`,
      title: moduleMeta?.title || moduleItem.title || `Module ${moduleIndex + 1}`,
      actionLabel: buildActionLabel(moduleProgressRatio),
      metrics: [
        {
          id: `${moduleItem.id}-mastery`,
          label: "Maitrise du module",
          value: `${Math.round(moduleProgressRatio * 100)}%`,
          helper: `${visitedStepCount}/${moduleStepCount} etapes parcourues`,
          ratio: moduleProgressRatio,
          color: "#08B88A",
        },
        {
          id: `${moduleItem.id}-quiz`,
          label: "Quiz du module",
          value:
            totalQuizQuestions > 0
              ? `${visitedQuizQuestions}/${totalQuizQuestions}`
              : "0",
          helper:
            totalQuizQuestions > 0
              ? `${visitedQuizQuestions} questions deja rencontrees`
              : "Aucun quiz dans ce module",
          ratio:
            totalQuizQuestions > 0
              ? clampRatio(visitedQuizQuestions / totalQuizQuestions)
              : 0,
          color: "#FF4D4F",
        },
        {
          id: `${moduleItem.id}-exercise`,
          label: "Exercices du module",
          value:
            totalExercises > 0 ? `${visitedExercises}/${totalExercises}` : "0",
          helper:
            totalExercises > 0
              ? `${Math.round((visitedExercises / totalExercises) * 100)}% du parcours pratique vu`
              : "Aucun exercice dans ce module",
          ratio:
            totalExercises > 0
              ? clampRatio(visitedExercises / totalExercises)
              : 0,
          color: "#7C7AF6",
        },
      ],
    };
  });
}

export function buildCourseLiveViewModel(
  course: CourseDetail,
  selectedStepId?: string | null,
): CourseLiveViewModel {
  const steps = buildLiveSteps(course.modules, course.description);
  const currentStep =
    steps.find((step) => step.id === selectedStepId) ??
    steps.find((step) => step.kind === "lesson") ??
    steps[0];
  const currentStepIndex = Math.max(
    0,
    steps.findIndex((step) => step.id === currentStep.id),
  );
  const progressPercentage = steps.length
    ? Math.max(1, Math.round(((currentStepIndex + 1) / steps.length) * 100))
    : 0;
  const introParagraphs = buildIntroParagraphs(course, currentStep);
  const sourceModules = getSourceModules(course, steps);
  const menuModules = buildMenuModules(sourceModules, steps, currentStepIndex);

  return {
    courseTitle: course.title,
    section: currentStep.moduleTitle || course.title,
    progressPercentage,
    introTitle: currentStep.title || course.title,
    introParagraphs,
    relatedTopics: buildRelatedTopics(course, steps, currentStepIndex),
    menuModules,
    scorePanels: buildScorePanels(
      sourceModules,
      menuModules,
      steps,
      currentStepIndex,
    ),
    currentStepId: currentStep.id,
    currentStepIndex,
    steps,
  };
}
