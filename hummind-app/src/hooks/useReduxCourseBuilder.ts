"use client";

import { useMemo } from "react";
import type { Block, BlockType, Module } from "../components/course/types";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { setBuilderModules } from "../store/slices/courseSlice";

const uid = () => crypto.randomUUID();

const makeBlock = (type: BlockType, id?: string): Block => ({
  id: id ?? `block-${uid()}`,
  type,
  text: "",
  title: "",
  status: type === "quiz" || type === "exercise" ? "pending" : "ready",
  data: {},
});

export function useReduxCourseBuilder() {
  const dispatch = useAppDispatch();
  const modules = useAppSelector((state) => state.course.builder.modules);

  const setModules = (next: Module[] | ((prev: Module[]) => Module[])) => {
    const value = typeof next === "function" ? next(modules) : next;
    dispatch(setBuilderModules(value));
  };

  const ok = useMemo(() => modules.some((module) => module.title.trim() !== ""), [modules]);

  const addModule = () =>
    setModules((prev) => [
      ...prev,
      { id: `module-${uid()}`, title: "", blocks: [makeBlock("title")] },
    ]);

  const updateModuleTitle = (moduleId: string, title: string) =>
    setModules((prev) =>
      prev.map((module) => (module.id === moduleId ? { ...module, title } : module)),
    );

  const deleteModule = (moduleId: string) =>
    setModules((prev) => prev.filter((module) => module.id !== moduleId));

  const addBlock = (moduleId: string, type: BlockType) => {
    const newId = `block-${uid()}`;
    setModules((prev) =>
      prev.map((module) =>
        module.id === moduleId
          ? { ...module, blocks: [...module.blocks, makeBlock(type, newId)] }
          : module,
      ),
    );
    return newId;
  };

  const updateBlockField = (
    moduleId: string,
    blockId: string,
    patch: Partial<Block>,
  ) =>
    setModules((prev) =>
      prev.map((module) =>
        module.id === moduleId
          ? {
              ...module,
              blocks: module.blocks.map((block) =>
                block.id === blockId ? { ...block, ...patch } : block,
              ),
            }
          : module,
      ),
    );

  const deleteBlock = (moduleId: string, blockId: string) =>
    setModules((prev) =>
      prev.map((module) =>
        module.id === moduleId
          ? {
              ...module,
              blocks: module.blocks.filter((block) => block.id !== blockId),
            }
          : module,
      ),
    );

  const duplicateBlock = (moduleId: string, blockId: string) =>
    setModules((prev) =>
      prev.map((module) => {
        if (module.id !== moduleId) return module;
        const index = module.blocks.findIndex((block) => block.id === blockId);
        if (index === -1) return module;

        const source = module.blocks[index];
        const copy: Block = {
          ...source,
          id: `block-${uid()}`,
          title: source.title ? `${source.title} (copie)` : source.title,
          text: source.text,
          data: source.data ? JSON.parse(JSON.stringify(source.data)) : undefined,
        };

        const nextBlocks = [...module.blocks];
        nextBlocks.splice(index + 1, 0, copy);
        return { ...module, blocks: nextBlocks };
      }),
    );

  const reorderBlocks = (moduleId: string, nextBlocks: Block[]) =>
    setModules((prev) =>
      prev.map((module) =>
        module.id === moduleId ? { ...module, blocks: nextBlocks } : module,
      ),
    );

  return {
    modules,
    ok,
    addModule,
    updateModuleTitle,
    deleteModule,
    addBlock,
    updateBlockField,
    deleteBlock,
    duplicateBlock,
    reorderBlocks,
  };
}
