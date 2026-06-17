import type { Block, BlockType, CourseState, Module } from "../components/course/types";
import { nanoid } from "@reduxjs/toolkit";

type CourseBuilderState = Pick<CourseState, "builder" | "ui">;

export function makeBlock(type: BlockType): Block {
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
      base.data = { quiz: { questions: [] } };
      return base;
    case "exercise":
      base.data = { exercise: { statement: "", solution: "" } };
      return base;
    case "divider":
      base.text = "";
      base.title = "";
      base.data = { divider: { variant: "line" } };
      return base;
    case "code":
      base.data = { code: { language: "js", code: "" } };
      return base;
    case "math":
      base.data = { math: { mode: "block", latex: "", description: "" } };
      return base;
    case "image":
      base.data = { image: { url: "", alt: "", caption: "" } };
      return base;
    case "table":
      base.data = {
        table: {
          cols: [
            { id: "c1", label: "Colonne 1" },
            { id: "c2", label: "Colonne 2" },
          ],
          rows: [{ id: nanoid(), cells: { c1: "", c2: "" } }],
        },
      };
      return base;
    case "chart":
      base.data = {
        chart: {
          chartType: "line",
          title: "",
          labels: ["A", "B", "C"],
          datasets: [{ label: "Serie 1", data: [1, 2, 3] }],
        },
      };
      return base;
    case "drawing":
      base.data = {
        drawing: { version: 1, tool: "tldraw", snapshot: {}, preview: "" },
      };
      return base;
    default:
      return base;
  }
}

export function findModule(
  state: CourseBuilderState,
  moduleId: string,
): Module | null {
  return state.builder.modules.find((courseModule) => courseModule.id === moduleId) ?? null;
}

export function duplicateBlockData(block: Block): Block {
  const copy = JSON.parse(JSON.stringify(block)) as Block;
  copy.id = nanoid();
  return copy;
}

export function addBlockToModule(
  state: CourseBuilderState,
  moduleId: string,
  type: BlockType,
) {
  const courseModule = findModule(state, moduleId);
  if (!courseModule) return;

  const newBlock = makeBlock(type);
  courseModule.blocks.push(newBlock);
  state.ui.selectedBlockId = newBlock.id;
}

export function deleteBlockFromModule(
  state: CourseBuilderState,
  moduleId: string,
  blockId: string,
) {
  const courseModule = findModule(state, moduleId);
  if (!courseModule) return;

  courseModule.blocks = courseModule.blocks.filter((block) => block.id !== blockId);
  if (state.ui.selectedBlockId === blockId) {
    state.ui.selectedBlockId = null;
  }
}

export function reorderBlocksInModule(
  state: CourseBuilderState,
  moduleId: string,
  blocks: Block[],
) {
  const courseModule = findModule(state, moduleId);
  if (courseModule) {
    courseModule.blocks = blocks;
  }
}

export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function updateBlockData(
  moduleId: string,
  blockId: string,
  patch: Partial<Block>,
) {
  return (state: CourseBuilderState) => {
    const courseModule = state.builder.modules.find(
      (moduleItem) => moduleItem.id === moduleId,
    );
    if (!courseModule) return;

    const block = courseModule.blocks.find((blockItem) => blockItem.id === blockId);
    if (block) {
      Object.assign(block, patch);
    }
  };
}
