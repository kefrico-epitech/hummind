import { BlockType } from "../../components/course/types";
import type {
  CourseDraft,
  BuilderState,
  Module,
  Block,
} from "../../components/course/types";
import { createSlice, PayloadAction, nanoid } from "@reduxjs/toolkit";

type AiGenState = {
  status: "idle" | "loading" | "success" | "error";
  error: string | null;
  lastRunKey: string | null;
  progress: number;
  label: string | null;
};

type AiCreditsState = {
  total: number;
  consumed: number;
  remaining: number;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  lastConsumed: number;
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
  aiCredits: AiCreditsState;
  ui: UiState;
  undo: UndoState;
  history: HistoryState;
};

function parseEnvNumber(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

const defaultTotalCredits = parseEnvNumber(
  process.env.NEXT_PUBLIC_AI_TOTAL_CREDITS,
  100,
);

const initialState: CourseState = {
  mode: null,
  title: "",
  description: "",
  content: "",
  visibility: "Illimité",
  allowComments: true,
  domain: "",
  level: "",
  style: "",
  objectives: "",
  document: null,
  extractedData: undefined,
  startDate: "",
  endDate: "",
  link: "",
  rooms: [],
  status: "DRAFT",

  builder: { modules: [] },

  aiGen: {
    status: "idle",
    error: null,
    lastRunKey: null,
    progress: 0,
    label: null,
  },
  aiCredits: {
    total: defaultTotalCredits,
    consumed: 0,
    remaining: defaultTotalCredits,
    totalTokens: 0,
    inputTokens: 0,
    outputTokens: 0,
    lastConsumed: 0,
  },

  ui: { activeModuleId: null, selectedBlockId: null },

  undo: { available: false, label: null, beforeModules: null, runKey: null },
  history: { max: 100, index: -1, items: [] },
};

// Helpers
function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

function sameModules(a: Module[], b: Module[]) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function syncUiWithModules(state: CourseState) {
  if (!state.ui.activeModuleId && state.builder.modules.length > 0) {
    state.ui.activeModuleId = state.builder.modules[0].id;
  }

  if (
    state.ui.activeModuleId &&
    !state.builder.modules.some((m) => m.id === state.ui.activeModuleId)
  ) {
    state.ui.activeModuleId = state.builder.modules[0]?.id ?? null;
  }

  if (state.ui.selectedBlockId) {
    const exists = state.builder.modules.some((m) =>
      m.blocks?.some((b) => b.id === state.ui.selectedBlockId),
    );
    if (!exists) state.ui.selectedBlockId = null;
  }
}

function findModule(state: CourseState, moduleId: string) {
  return state.builder.modules.find((m) => m.id === moduleId) ?? null;
}

function duplicateBlockData(block: Block): Block {
  const copy = clone(block);
  copy.id = nanoid();
  return copy;
}

function makeBlock(type: BlockType): Block {
  const id = nanoid();

  const base: Block = {
    id,
    type,
    text: type === "title" ? "Nouveau titre" : "",
    title:
      type === "quiz"
        ? "Nouveau quiz"
        : type === "exercise"
          ? "Nouvel exercice"
          : "",
    status: type === "quiz" || type === "exercise" ? "pending" : "ready",
    data: {},
  };

  switch (type) {
    case "quiz":
      base.data = {
        quiz: {
          questions: [
            {
              q: "",
              choices: ["Choix 1", "Choix 2"],
              multiple: false,
              answerIndex: 0,
              explanation: "",
            },
          ],
        },
      };
      return base;

    case "exercise":
      base.data = { exercise: { statement: "", solution: "" } };
      return base;

    case "divider":
      base.text = "";
      base.title = "";
      base.data = { divider: { variant: "line" } };
      base.status = "ready";
      return base;

    case "code":
      base.title = base.title || "Code";
      base.data = { code: { language: "js", code: "" } };
      return base;

    case "math":
      base.title = base.title || "Math";
      base.data = { math: { mode: "block", latex: "", description: "" } };
      return base;

    case "image":
      base.title = base.title || "Image";
      base.data = { image: { url: "", alt: "", caption: "" } };
      return base;

    case "table":
      base.title = base.title || "Tableau";
      base.data = {
        table: {
          cols: [
            { id: "c1", label: "Colonne 1" },
            { id: "c2", label: "Colonne 2" },
          ],
          rows: [
            { id: nanoid(), cells: { c1: "", c2: "" } },
            { id: nanoid(), cells: { c1: "", c2: "" } },
          ],
        },
      };
      return base;

    case "chart":
      base.title = base.title || "Graphe";
      base.data = {
        chart: {
          chartType: "line",
          title: "",
          labels: ["A", "B", "C"],
          datasets: [{ label: "Série 1", data: [1, 2, 3] }],
        },
      };
      return base;

    case "drawing":
      base.title = base.title || "Dessin";
      base.data = {
        drawing: { version: 1, tool: "tldraw", snapshot: {}, preview: "" },
      };
      return base;

    default:
      return base; // title/content
  }
}


const courseSlice = createSlice({
  name: "course",
  initialState,
  reducers: {
    updateDraft(state, action: PayloadAction<Partial<CourseDraft>>) {
      return { ...state, ...action.payload };
    },

    // ✅ builder
    setBuilderModules(state, action: PayloadAction<Module[]>) {
      state.builder.modules = action.payload;

      // Si pas de module actif -> premier module
      if (!state.ui.activeModuleId && action.payload.length > 0) {
        state.ui.activeModuleId = action.payload[0].id;
      }

      // Si module actif supprimé, on recale
      if (
        state.ui.activeModuleId &&
        !action.payload.some((m) => m.id === state.ui.activeModuleId)
      ) {
        state.ui.activeModuleId = action.payload[0]?.id ?? null;
      }

      // Si bloc sélectionné n'existe plus, reset
      if (state.ui.selectedBlockId) {
        const exists = action.payload.some((m) =>
          m.blocks?.some((b) => b.id === state.ui.selectedBlockId),
        );
        if (!exists) state.ui.selectedBlockId = null;
      }
    },

    // ✅ UI selections
    setActiveModuleId(state, action: PayloadAction<string | null>) {
      state.ui.activeModuleId = action.payload;
      // option : quand on change de module, on désélectionne le bloc
      state.ui.selectedBlockId = null;
    },
    setSelectedBlockId(state, action: PayloadAction<string | null>) {
      state.ui.selectedBlockId = action.payload;
    },

    // ✅ DnD reorder blocks (dans 1 module)
    reorderBlocks(
      state,
      action: PayloadAction<{ moduleId: string; blocks: Block[] }>,
    ) {
      const mod = findModule(state, action.payload.moduleId);
      if (!mod) return;
      courseSlice.caseReducers.pushHistoryNow(state, {
        payload: { label: "Réorganiser blocs" },
        type: "course/pushHistoryNow",
      });

      mod.blocks = action.payload.blocks;
    },

    // ✅ Duplicate block
    duplicateBlock(
      state,
      action: PayloadAction<{ moduleId: string; blockId: string }>,
    ) {
      const mod = findModule(state, action.payload.moduleId);
      if (!mod) return;

      const idx = mod.blocks.findIndex(
        (b) => b.id === action.payload.blockId,
      );
      if (idx < 0) return;

      courseSlice.caseReducers.pushHistoryNow(state, {
        payload: { label: "Dupliquer bloc" },
        type: "course/pushHistoryNow",
      });

      const copy = duplicateBlockData(mod.blocks[idx]);
      mod.blocks.splice(idx + 1, 0, copy);

      state.ui.selectedBlockId = copy.id; // pratique: sélectionne la copie
    },

    // ✅ Delete block
    deleteBlock(
      state,
      action: PayloadAction<{ moduleId: string; blockId: string }>,
    ) {
      const mod = findModule(state, action.payload.moduleId);
      if (!mod) return;

      courseSlice.caseReducers.pushHistoryNow(state, {
        payload: { label: "Supprimer bloc" },
        type: "course/pushHistoryNow",
      });


      mod.blocks = mod.blocks.filter((b) => b.id !== action.payload.blockId);

      if (state.ui.selectedBlockId === action.payload.blockId) {
        state.ui.selectedBlockId = null;
      }
    },

    updateBlock(
      state,
      action: PayloadAction<{
        moduleId: string; blockId: string; patch: Partial<Block>;
      }>,
    ) {
      const mod = findModule(state, action.payload.moduleId);
      if (!mod) return;

      const b = mod.blocks.find((x) => x.id === action.payload.blockId);
      if (!b) return;

      courseSlice.caseReducers.pushHistoryNow(state, {
        payload: { label: "Modifier bloc" },
        type: "course/pushHistoryNow",
      });

      Object.assign(b, action.payload.patch);
    },

    addBlock(
      state,
      action: PayloadAction<{ moduleId: string; type: BlockType }>
    ) {
      const mod = state.builder.modules.find((m) => m.id === action.payload.moduleId);
      if (!mod) return;

      courseSlice.caseReducers.pushHistoryNow(state, {
        payload: { label: "Ajouter bloc" },
        type: "course/pushHistoryNow",
      });

      const block = makeBlock(action.payload.type);
      mod.blocks.push(block);

      state.ui.activeModuleId = mod.id;
      state.ui.selectedBlockId = block.id;
    },

    addBlockAfter(
      state,
      action: PayloadAction<{ moduleId: string; afterBlockId: string | null; type: BlockType }>
    ) {
      const mod = state.builder.modules.find((m) => m.id === action.payload.moduleId);
      if (!mod) return;

      courseSlice.caseReducers.pushHistoryNow(state, {
        payload: { label: "Ajouter bloc" },
        type: "course/pushHistoryNow",
      });


      const block = makeBlock(action.payload.type);

      if (!action.payload.afterBlockId) {
        mod.blocks.unshift(block);
      } else {
        const idx = mod.blocks.findIndex((b) => b.id === action.payload.afterBlockId);
        if (idx === -1) mod.blocks.push(block);
        else mod.blocks.splice(idx + 1, 0, block);
      }

      state.ui.activeModuleId = mod.id;
      state.ui.selectedBlockId = block.id;
    },

    // Modules
    renameModule(
      state,
      action: PayloadAction<{ moduleId: string; title: string }>
    ) {
      const mod = state.builder.modules.find((m) => m.id === action.payload.moduleId);
      if (!mod) return;
      courseSlice.caseReducers.pushHistoryNow(state, {
        payload: { label: "Renommer module" },
        type: "course/pushHistoryNow",
      });
      mod.title = action.payload.title;
    },

    reorderModules(state, action: PayloadAction<Module[]>) {
      courseSlice.caseReducers.pushHistoryNow(state, {
        payload: { label: "Reordonner modules" },
        type: "course/pushHistoryNow",
      });
      state.builder.modules = action.payload;
      // recaler l'actif si nécessaire
      if (!state.ui.activeModuleId && state.builder.modules.length > 0) {
        state.ui.activeModuleId = state.builder.modules[0].id;
      }
      if (
        state.ui.activeModuleId &&
        !state.builder.modules.some((m) => m.id === state.ui.activeModuleId)
      ) {
        state.ui.activeModuleId = state.builder.modules[0]?.id ?? null;
      }
    },

    addModule(state) {
      courseSlice.caseReducers.pushHistoryNow(state, {
        payload: { label: "Ajouter module" },
        type: "course/pushHistoryNow",
      });
      const id = nanoid();
      state.builder.modules.push({
        id,
        title: "",
        blocks: [],
      });

      state.ui.activeModuleId = id;
      state.ui.selectedBlockId = null;
    },



    deleteModule(state, action: PayloadAction<{ moduleId: string }>) {
      courseSlice.caseReducers.pushHistoryNow(state, {
        payload: { label: "Supprimer module" },
        type: "course/pushHistoryNow",
      });
      state.builder.modules = state.builder.modules.filter(
        (m) => m.id !== action.payload.moduleId,
      );

      if (state.ui.activeModuleId === action.payload.moduleId) {
        state.ui.activeModuleId = state.builder.modules[0]?.id ?? null;
      }

      state.ui.selectedBlockId = null;
    },

    duplicateModule(state, action: PayloadAction<{ moduleId: string }>) {
      const original = state.builder.modules.find(
        (m) => m.id === action.payload.moduleId,
      );
      if (!original) return;
      courseSlice.caseReducers.pushHistoryNow(state, {
        payload: { label: "Dupliquer module" },
        type: "course/pushHistoryNow",
      });

      const copy = clone(original);

      copy.id = nanoid();
      copy.title =
        (original.title?.trim() ? original.title : "Module") + " (copie)";

      // ✅ nouveaux ids pour les blocks (et on garde data)
      copy.blocks = (copy.blocks ?? []).map((b) => ({
        ...b,
        id: nanoid(),
      }));

      state.builder.modules.push(copy);

      state.ui.activeModuleId = copy.id;
      state.ui.selectedBlockId = null;
    },

    // ✅ UNDO - prepare snapshot before AI run (si tu veux encore garder ce mode)
    prepareUndoSnapshot(
      state,
      action: PayloadAction<{ label?: string; runKey?: string }>,
    ) {
      state.undo.available = true;
      state.undo.label = action.payload.label ?? "Génération IA";
      state.undo.beforeModules = clone(state.builder.modules);
      state.undo.runKey = action.payload.runKey ?? null;
    },

    // ✅ UNDO - restore snapshot
    undoLastAiRun(state) {
      if (!state.undo.available || !state.undo.beforeModules) return;

      state.builder.modules = clone(state.undo.beforeModules);

      // reset undo
      state.undo.available = false;
      state.undo.label = null;
      state.undo.beforeModules = null;
      state.undo.runKey = null;

      // reset status IA (option)
      state.aiGen.status = "idle";
      state.aiGen.error = null;
      state.aiGen.progress = 0;
      state.aiGen.label = null;
    },

    // ✅ IA generation state
    setAiGenStatus(state, action: PayloadAction<AiGenState["status"]>) {
      state.aiGen.status = action.payload;
    },
    setAiGenError(state, action: PayloadAction<string | null>) {
      state.aiGen.error = action.payload;
    },
    setAiGenLastRunKey(state, action: PayloadAction<string | null>) {
      state.aiGen.lastRunKey = action.payload;
    },
    setAiGenProgress(
      state,
      action: PayloadAction<{ progress: number; label?: string | null }>,
    ) {
      state.aiGen.progress = Math.max(0, Math.min(100, action.payload.progress));
      if (action.payload.label !== undefined) {
        state.aiGen.label = action.payload.label;
      }
    },

    applyAiUsage(
      state,
      action: PayloadAction<{
        inputTokens?: number;
        outputTokens?: number;
        totalTokens?: number;
        consumedCredits?: number;
      }>,
    ) {
      const inputTokens = Math.max(0, Number(action.payload.inputTokens ?? 0));
      const outputTokens = Math.max(0, Number(action.payload.outputTokens ?? 0));
      const totalTokens = Math.max(
        0,
        Number(action.payload.totalTokens ?? inputTokens + outputTokens),
      );
      const consumedCredits = Math.max(
        0,
        Number(action.payload.consumedCredits ?? 0),
      );

      state.aiCredits.inputTokens += inputTokens;
      state.aiCredits.outputTokens += outputTokens;
      state.aiCredits.totalTokens += totalTokens;
      state.aiCredits.consumed += consumedCredits;
      state.aiCredits.lastConsumed = consumedCredits;
      state.aiCredits.remaining = Math.max(
        0,
        state.aiCredits.total - state.aiCredits.consumed,
      );
    },

    resetDraft() {
      return initialState;
    },

    /* ------------------------------------------------------------------ */
    /* History (UNDO/REDO + timeline)                                     */
    /* ------------------------------------------------------------------ */

    pushHistory(
      state,
      action: PayloadAction<{
        label: string;
        runKey?: string | null;
        modules: Module[];
      }>,
    ) {
      const { label, runKey = null, modules } = action.payload;

      // Si on est au milieu de l'historique (apres undo), on coupe la branche future.
      if (state.history.index < state.history.items.length) {
        state.history.items = state.history.items.slice(0, state.history.index);
      }

      const snapshot = clone(modules);
      const last = state.history.items[state.history.items.length - 1];
      if (!last || !sameModules(last.modules, snapshot)) {
        state.history.items.push({
          at: Date.now(),
          label,
          modules: snapshot,
          runKey,
        });
      }

      const overflow = state.history.items.length - state.history.max;
      if (overflow > 0) {
        state.history.items.splice(0, overflow);
        state.history.index = Math.max(0, state.history.index - overflow);
      }

      // Appel fait avant mutation: l'etat courant devient virtuel a la position len.
      state.history.index = state.history.items.length;
    },

    undoHistory(state) {
      if (state.history.index <= 0) return;

      const current = clone(state.builder.modules);
      if (state.history.index === state.history.items.length) {
        state.history.items.push({
          at: Date.now(),
          label: "Etat courant",
          modules: current,
          runKey: null,
        });
      } else {
        state.history.items[state.history.index] = {
          at: Date.now(),
          label: "Etat courant",
          modules: current,
          runKey: null,
        };
      }

      state.history.index -= 1;
      const snap = state.history.items[state.history.index];
      if (snap) {
        state.builder.modules = clone(snap.modules);
        syncUiWithModules(state);
      }
    },

    redoHistory(state) {
      if (state.history.index + 1 >= state.history.items.length) return;

      state.history.index += 1;
      const snap = state.history.items[state.history.index];
      if (snap) {
        state.builder.modules = clone(snap.modules);
        syncUiWithModules(state);
      }
    },

    jumpHistory(state, action: PayloadAction<number>) {
      const idx = action.payload;
      if (idx < 0 || idx >= state.history.items.length) return;

      state.history.index = idx;
      const snap = state.history.items[idx];
      if (snap) {
        state.builder.modules = clone(snap.modules);
        syncUiWithModules(state);
      }
    },

    clearHistory(state) {
      state.history.items = [];
      state.history.index = -1;
    },

    pushHistoryNow(
      state,
      action: PayloadAction<{ label: string; runKey?: string | null }>,
    ) {
      const { label, runKey = null } = action.payload;

      // Si on est au milieu de l'historique, on coupe la branche future.
      if (state.history.index < state.history.items.length) {
        state.history.items = state.history.items.slice(0, state.history.index);
      }

      const snapshot = clone(state.builder.modules);
      const last = state.history.items[state.history.items.length - 1];
      if (!last || !sameModules(last.modules, snapshot)) {
        state.history.items.push({
          at: Date.now(),
          label,
          modules: snapshot,
          runKey,
        });
      }

      const overflow = state.history.items.length - state.history.max;
      if (overflow > 0) {
        state.history.items.splice(0, overflow);
        state.history.index = Math.max(0, state.history.index - overflow);
      }

      // Appel fait avant mutation: l'etat courant devient virtuel a la position len.
      state.history.index = state.history.items.length;
    },

  },
});

export const {
  updateDraft,
  resetDraft,
  setBuilderModules,
  setAiGenStatus,
  setAiGenError,
  setAiGenLastRunKey,
  setAiGenProgress,
  applyAiUsage,

  // UI
  setActiveModuleId,
  setSelectedBlockId,

  // Builder actions
  reorderBlocks,
  duplicateBlock,
  deleteBlock,
  updateBlock,
  addBlock,
  addBlockAfter,

  // Modules
  renameModule,
  reorderModules,
  deleteModule,
  addModule,
  duplicateModule,

  // Undo (legacy)
  prepareUndoSnapshot,
  undoLastAiRun,

  // History
  pushHistory,
  undoHistory,
  redoHistory,
  jumpHistory,
  clearHistory,
  pushHistoryNow,
} = courseSlice.actions;

export default courseSlice.reducer;


