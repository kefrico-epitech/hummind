// Types and OpenAI response schema shared by the live-session route.
// Extracted from route.ts to keep that file focused on orchestration.

export type LiveAction = "START" | "NEXT" | "REEXPLAIN" | "QUIZ" | "ANSWER";

export type LiveLessonPayload = {
  id?: unknown;
  moduleId?: unknown;
  moduleTitle?: unknown;
  kind?: unknown;
  title?: unknown;
  sourceLines?: unknown;
  contextLines?: unknown;
  paragraphs?: unknown;
  quiz?: unknown;
  quizPosition?: unknown;
  quizTotal?: unknown;
  exercisePrompt?: unknown;
  exerciseSolution?: unknown;
  allowImageUpload?: unknown;
  blockTypes?: unknown;
  moduleToolInventory?: unknown;
  index?: unknown;
  total?: unknown;
};

export type LiveCoursePayload = {
  id?: unknown;
  title?: unknown;
  description?: unknown;
  domain?: unknown;
  level?: unknown;
  objectives?: unknown;
};

export type LiveLearnerPayload = {
  score?: unknown;
  streak?: unknown;
  mastery?: unknown;
  quizMistakesOnLesson?: unknown;
};

export type LiveAnswerPayload = {
  choiceIndex?: unknown;
  text?: unknown;
  creationTool?: unknown;
  creationArtifact?: unknown;
  quizQuestion?: unknown;
  quizChoices?: unknown;
  quizCorrectIndexes?: unknown;
};

export type LiveBody = {
  action?: unknown;
  language?: unknown;
  step?: unknown;
  lesson?: unknown;
  course?: unknown;
  learner?: unknown;
  answer?: unknown;
};

export type LiveAnswerContext = {
  choiceIndex: number | null;
  text: string;
  creationTool: string;
  creationArtifact: string;
  quizQuestion: string;
  quizChoices: string[];
  quizCorrectIndexes: number[];
};

export type QuizQuestion = {
  question: string;
  choices: string[];
  correctIndexes: number[];
  explanation?: string;
};

export type LiveLesson = {
  id: string;
  moduleId: string;
  moduleTitle: string;
  kind: "lesson" | "quiz" | "exercise";
  title: string;
  paragraphs: string[];
  contextLines: string[];
  quiz: QuizQuestion | null;
  quizPosition: number;
  quizTotal: number;
  exercisePrompt: string;
  exerciseSolution: string;
  allowImageUpload: boolean;
  blockTypes: string[];
  moduleToolInventory: string[];
  index: number;
  total: number;
};

export type LiveCourseContext = {
  id: string;
  title: string;
  description: string;
  domain: string;
  level: string;
  objectives: string[];
};

export type LearnerSession = {
  score: number;
  streak: number;
  mastery: number;
  quizMistakesOnLesson: number;
};

export type TurnButtonAction = "NEXT" | "QUIZ" | "REEXPLAIN";

export type LearningToolId =
  | "TEXT"
  | "GRAPH"
  | "MATH"
  | "TABLE"
  | "CODE"
  | "DRAWING"
  | "IMAGE";

export type ToolPriority = "high" | "medium" | "low";

export type ToolSuggestion = {
  id: LearningToolId;
  label: string;
  reason: string;
  priority: ToolPriority;
};

export type LiveTurn = {
  message: string;
  microObjective: string;
  interactionKind: "explain" | "quiz" | "exercise" | "checkpoint";
  question: string | null;
  choices: string[] | null;
  correctIndexes: number[] | null;
  hint: string | null;
  feedbackCorrect: string | null;
  feedbackWrong: string | null;
  ctaPrimary: string;
  ctaPrimaryAction: TurnButtonAction;
  ctaSecondary: string | null;
  ctaSecondaryAction: TurnButtonAction | null;
  nextAction: "continue" | "quiz" | "practice" | "review";
  difficulty: "easy" | "medium" | "hard";
  masteryDelta: number;
  advanceLesson: boolean;
  suggestedTools: ToolSuggestion[];
  requiredTools: LearningToolId[];
};

export type UsageSummary = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  consumedCredits: number;
};

export type OpenAiErrorLike = {
  status?: unknown;
  code?: unknown;
  message?: unknown;
  error?: {
    code?: unknown;
    message?: unknown;
  };
};

export const LEARNING_TOOL_IDS = [
  "TEXT",
  "GRAPH",
  "MATH",
  "TABLE",
  "CODE",
  "DRAWING",
  "IMAGE",
] as const;

export const TOOL_LABELS: Record<LearningToolId, string> = {
  TEXT: "Texte",
  GRAPH: "Graphe",
  MATH: "Math",
  TABLE: "Tableau",
  CODE: "Code",
  DRAWING: "Dessin",
  IMAGE: "Image",
};

export const TOOL_REASONS: Record<LearningToolId, string> = {
  TEXT: "Reponse redigee claire et concise.",
  GRAPH: "Utile pour tracer et analyser des courbes.",
  MATH: "Utile pour poser les formules et calculs.",
  TABLE: "Utile pour organiser et comparer des donnees.",
  CODE: "Utile pour detailler une logique algorithmique.",
  DRAWING: "Utile pour un schema explicatif rapide.",
  IMAGE: "Utile pour illustrer visuellement la notion.",
};

export const BLOCK_TYPE_TOOL_MAP: Record<string, LearningToolId[]> = {
  title: ["TEXT"],
  content: ["TEXT"],
  quiz: ["TEXT"],
  exercise: ["TEXT"],
  chart: ["GRAPH"],
  math: ["MATH"],
  table: ["TABLE"],
  code: ["CODE"],
  drawing: ["DRAWING"],
  image: ["IMAGE"],
};

export const TOOL_KEYWORDS: Record<LearningToolId, string[]> = {
  TEXT: ["explique", "argumente", "reponds", "demarche"],
  GRAPH: ["graphe", "graph", "courbe", "fonction", "asymptote", "trace", "chronogramme"],
  MATH: ["equation", "derivee", "integrale", "theoreme", "calcul", "formule", "latex"],
  TABLE: ["tableau", "table", "donnees", "dataset", "comparatif", "mesure"],
  CODE: ["code", "algorithme", "script", "programme", "python", "javascript"],
  DRAWING: ["schema", "dessin", "croquis", "construction", "geometrie", "figure"],
  IMAGE: ["image", "photo", "illustration", "visuel", "figure"],
};

export const turnSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    message: { type: "string" },
    microObjective: { type: "string" },
    interactionKind: {
      type: "string",
      enum: ["explain", "quiz", "exercise", "checkpoint"],
    },
    question: { type: ["string", "null"] },
    choices: { type: ["array", "null"], items: { type: "string" } },
    correctIndexes: { type: ["array", "null"], items: { type: "integer" } },
    hint: { type: ["string", "null"] },
    feedbackCorrect: { type: ["string", "null"] },
    feedbackWrong: { type: ["string", "null"] },
    ctaPrimary: { type: "string" },
    ctaPrimaryAction: { type: "string", enum: ["NEXT", "QUIZ", "REEXPLAIN"] },
    ctaSecondary: { type: ["string", "null"] },
    ctaSecondaryAction: {
      type: ["string", "null"],
      enum: ["NEXT", "QUIZ", "REEXPLAIN", null],
    },
    nextAction: { type: "string", enum: ["continue", "quiz", "practice", "review"] },
    difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
    masteryDelta: { type: "number" },
    advanceLesson: { type: "boolean" },
    suggestedTools: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "string", enum: [...LEARNING_TOOL_IDS] },
          label: { type: "string" },
          reason: { type: "string" },
          priority: { type: "string", enum: ["high", "medium", "low"] },
        },
        required: ["id", "label", "reason", "priority"],
      },
    },
    requiredTools: {
      type: "array",
      items: { type: "string", enum: [...LEARNING_TOOL_IDS] },
    },
  },
  required: [
    "message",
    "microObjective",
    "interactionKind",
    "question",
    "choices",
    "correctIndexes",
    "hint",
    "feedbackCorrect",
    "feedbackWrong",
    "ctaPrimary",
    "ctaPrimaryAction",
    "ctaSecondary",
    "ctaSecondaryAction",
    "nextAction",
    "difficulty",
    "masteryDelta",
    "advanceLesson",
    "suggestedTools",
    "requiredTools",
  ],
} as const;
