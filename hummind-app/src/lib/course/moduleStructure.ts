import type { Block, Module } from "../../components/course/types";

type MissingConstraint = "title" | "content" | "quiz_or_exercise";

export type ModuleStructureReport = {
  moduleId: string;
  moduleTitle: string;
  moduleIndex: number;
  missing: MissingConstraint[];
  valid: boolean;
};

function uid(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

function hasBlockType(module: Module, type: Block["type"]): boolean {
  return (module.blocks ?? []).some((block) => block.type === type);
}

function hasQuizOrExercise(module: Module): boolean {
  return (module.blocks ?? []).some(
    (block) => block.type === "quiz" || block.type === "exercise",
  );
}

function createTitleBlock(moduleTitle: string, moduleIndex: number): Block {
  const text = moduleTitle.trim() || `Titre du module ${moduleIndex + 1}`;
  return {
    id: uid("block"),
    type: "title",
    text,
    title: text,
    status: "ready",
    data: {},
  };
}

function createContentBlock(moduleIndex: number): Block {
  return {
    id: uid("block"),
    type: "content",
    text: `Contenu principal du module ${moduleIndex + 1}.`,
    title: "Contenu principal",
    status: "pending",
    data: {},
  };
}

function createExerciseBlock(_moduleIndex: number): Block {
  return {
    id: uid("block"),
    type: "exercise",
    text: "",
    title: "Exercice d'application",
    status: "pending",
    data: {
      exercise: {
        statement: "",
        solution: "",
      },
    },
  };
}

function normalizeModuleTitle(module: Module, moduleIndex: number): string {
  const clean = module.title?.trim();
  return clean || `Module ${moduleIndex + 1}`;
}

export function getModuleStructureReport(
  module: Module,
  moduleIndex: number,
): ModuleStructureReport {
  const hasTitle = hasBlockType(module, "title");
  const hasContent = hasBlockType(module, "content");
  const hasAssessment = hasQuizOrExercise(module);

  const missing: MissingConstraint[] = [];
  if (!hasTitle) missing.push("title");
  if (!hasContent) missing.push("content");
  if (!hasAssessment) missing.push("quiz_or_exercise");

  return {
    moduleId: module.id,
    moduleTitle: normalizeModuleTitle(module, moduleIndex),
    moduleIndex,
    missing,
    valid: missing.length === 0,
  };
}

export function getModulesStructureReport(modules: Module[]): {
  ok: boolean;
  all: ModuleStructureReport[];
  invalid: ModuleStructureReport[];
} {
  const all = modules.map((module, index) => getModuleStructureReport(module, index));
  const invalid = all.filter((report) => !report.valid);
  return { ok: invalid.length === 0, all, invalid };
}

export function enforceModuleRequiredStructure(
  module: Module,
  moduleIndex: number,
): Module {
  const next: Module = {
    ...module,
    title: normalizeModuleTitle(module, moduleIndex),
    blocks: [...(module.blocks ?? [])],
  };

  if (!hasBlockType(next, "title")) {
    next.blocks.unshift(createTitleBlock(next.title, moduleIndex));
  }

  if (!hasBlockType(next, "content")) {
    const contentBlock = createContentBlock(moduleIndex);
    const firstTitleIndex = next.blocks.findIndex((block) => block.type === "title");
    if (firstTitleIndex === -1) {
      next.blocks.unshift(contentBlock);
    } else {
      next.blocks.splice(firstTitleIndex + 1, 0, contentBlock);
    }
  }

  if (!hasQuizOrExercise(next)) {
    next.blocks.push(createExerciseBlock(moduleIndex));
  }

  return next;
}

export function enforceModulesRequiredStructure(modules: Module[]): Module[] {
  return modules.map((module, index) => enforceModuleRequiredStructure(module, index));
}

