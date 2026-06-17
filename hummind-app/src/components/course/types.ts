// src/components/course/types.ts

export type CourseCreationMode = "AI_ONLY" | "HYBRID" | "STEP_BY_STEP";
export type CourseVisibility =
  | "ROOM"
  | "PRIVATE"
  | "PUBLIC"
  | "Illimité"
  | "Limité";
export type WizardStep = 1 | 2 | 3 | 4 | 5;

export type CourseDraft = {
  mode: CourseCreationMode | null;
  title: string;
  description: string;
  content: string;
  visibility: CourseVisibility;
  allowComments: boolean;
  domain: string; // Domaine de formation
  level: string; // Niveau de la cible
  style: string; // Ton et style pédagogique
  objectives: string; // Les objectifs du cours
  extractedData?: string; // Données extraites du document (si mode AI_ONLY et document fourni)
  document?: File | null; // Document de référence optionnel pour la création du cours
  startDate: string; // Date de début de la formation
  endDate: string; // Date de fin de la formation
  link: string; // Lien de la formation (généré à la finalisation)
  rooms: string[]; // liste des salles attribuées
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED"; // statut du cours
};

export const stepLabels = [
  { n: 1 as const, label: "Mode de création de cours" },
  { n: 2 as const, label: "Informations générales" },
  { n: 3 as const, label: "Contenus du cours" },
  { n: 4 as const, label: "Paramètres du cours" },
  { n: 5 as const, label: "Finalisation" },
];

export type Chapter = { id: string; title: string; content: string };

export type BuilderState = {
  modules: Module[];
};

type AiGenState = {
  status: "idle" | "loading" | "success" | "error";
  error: string | null;
  lastRunKey: string | null;
  progress: number;
  label: string | null;
};

type HistorySnapshot = {
  at: number; // Date.now()
  label: string; // ex: "Génération IA" / "Génération Hybride"
  modules: Module[];
  runKey: string | null;
};

type HistoryState = {
  max: number; // 5
  index: number; // position actuelle
  items: HistorySnapshot[]; // snapshots
};

type UiState = {
  activeModuleId: string | null;
  selectedBlockId: string | null;
};

type UndoState = {
  available: boolean;
  label: string | null;
  beforeModules: Module[] | null;
  runKey: string | null; // optionnel: pour lier à la gen
};

export type CourseState = CourseDraft & {
  builder: BuilderState;
  aiGen: AiGenState;
  ui: UiState;
  undo: UndoState;
  history: HistoryState;
};

export type CourseItemType = "chapter" | "content" | "quiz" | "exercise";

export type CourseItem = {
  id: string;
  type: CourseItemType;
  title: string;
  // data “future” (tu pourras enrichir sans casser le modèle)
  data?: Record<string, unknown>;
};

/* -------------------------------------------------- */
/* ✅ Blocks (builder actuel) */
/* -------------------------------------------------- */

export type BlockType =
  | "title"
  | "content"
  | "quiz"
  | "exercise"
  | "drawing"
  | "image"
  | "table"
  | "chart"
  | "code"
  | "divider"
  | "math";

/* ------------------ Quiz / Exercise ------------------ */

export type QuizData = {
  questions: {
    q: string;
    choices: string[];
    answerIndex?: number;
    answerIndexes?: number[];
    multiple?: boolean;
    explanation?: string;
    // References to taught blocks to ensure pedagogic coherence
    sourceBlockIds?: string[];
    targetObjectiveIds?: string[];
    coverageType?: "current_lesson" | "previous_lessons" | "mixed";
    difficulty?: "easy" | "medium" | "hard";
  }[];
};

export type ExerciseData = {
  statement?: string;
  solution?: string;
};

/* ------------------ New blocks data (v1) ------------------ */

export type ImageData = {
  url: string;
  alt?: string;
  caption?: string;
  width?: number;
  height?: number;
};

export type CodeData = {
  language: string; // "js" | "ts" | "python" | ...
  code: string;
  showLineNumbers?: boolean;
};

export type DividerData = {
  variant?: "line" | "dashed" | "space";
  label?: string;
};

export type MathData = {
  mode?: "inline" | "block";
  latex: string;
  description?: string;
};

export type TableData = {
  cols: { id: string; label: string; width?: number }[];
  rows: { id: string; cells: Record<string, string> }[];
};

export type ChartFunctionSpec = {
  expr: string;
  xMin: number;
  xMax: number;
  step: number;
  tangents?: number[];
  asymptotesX?: number[];
  asymptotesY?: number[];
};

export type ChartData = {
  chartType: "line" | "bar" | "pie" | "chronogram";
  title?: string;
  labels: string[];
  datasets: { label: string; data: number[] }[];
  mode?: "data" | "function" | "chronogram";
  functionSpec?: ChartFunctionSpec;
  options?: Record<string, unknown>;
};

export type DrawingData = {
  version: 1;
  tool: "tldraw" | "excalidraw";
  snapshot: unknown; // JSON canvas (tool-specific)
  preview?: string; // dataURL PNG optionnel pour la preview
};

/* ------------------ Block / Module / Course ------------------ */

export type Block = {
  id: string;
  type: BlockType;
  text: string; // toujours présent dans ton schéma
  title: string; // toujours présent dans ton schéma
  status: "pending" | "ready";
  data?: {
    quiz?: QuizData;
    exercise?: ExerciseData;

    image?: ImageData;
    code?: CodeData;
    divider?: DividerData;
    math?: MathData;
    table?: TableData;
    chart?: ChartData;
    drawing?: DrawingData;

    // extensible sans casser
    [key: string]: unknown;
  };
};

export type Module = {
  id: string;
  title: string;
  blocks: Block[];
};

export type Course = {
  id: string;
  title: string;
  modules: Module[];
};

/* -------------------------------------------------- */
/* ✅ AI Actions (inchangé) */
/* -------------------------------------------------- */

export type Action =
  | {
    type: "ADD_BLOCK";
    moduleId: string;
    moduleTitle?: string | null;
    blockId: string | null;
    afterBlockId: string | null;
    toModuleId: string | null;
    toIndex: number | null;
    block: Block;
  }
  | {
    type: "UPDATE_BLOCK";
    moduleId: string;
    moduleTitle?: string | null;
    blockId: string | null;
    afterBlockId: string | null;
    toModuleId: string | null;
    toIndex: number | null;
    block: Block;
  }
  | {
    type: "DELETE_BLOCK";
    moduleId: string;
    moduleTitle?: string | null;
    blockId: string | null;
    afterBlockId: string | null;
    toModuleId: string | null;
    toIndex: number | null;
    block: Block;
  }
  | {
    type: "MOVE_BLOCK";
    moduleId: string;
    moduleTitle?: string | null;
    blockId: string | null;
    afterBlockId: string | null;
    toModuleId: string | null;
    toIndex: number | null;
    block: Block;
  };
