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
  status: type === "quiz" ? "pending" : "ready",
  data: {},
});

export function useCourseBuilder() {
  const modules = useAppSelector((s) => s.course.builder.modules);
  const dispatch = useAppDispatch();

  const setModules = (updater: Module[] | ((p: Module[]) => Module[])) => {
    dispatch(
      setBuilderModules(
        typeof updater === "function" ? updater(modules) : updater,
      ),
    );
  };


  const ok = useMemo(() => modules.some((m) => m.title.trim() !== ""), [modules]);

  const addModule = () =>
    setModules((p) => [
      ...p,
      {
        id: `module-${uid()}`,
        title: "",
        // ✅ par défaut : un bloc Title pour guider l’enseignant
        blocks: [makeBlock("title")],
      },
    ]);

  const updateModuleTitle = (moduleId: string, title: string) =>
    setModules((p) => p.map((m) => (m.id === moduleId ? { ...m, title } : m)));

  const deleteModule = (moduleId: string) =>
    setModules((p) => p.filter((m) => m.id !== moduleId));

  const duplicateModule = (moduleId: string) =>
    setModules((p) => {
      const src = p.find((x) => x.id === moduleId);
      if (!src) return p;

      const copy: Module = {
        id: `module-${uid()}`,
        title: src.title ? `${src.title} (copie)` : "",
        blocks: src.blocks.map((b) => ({ ...b, id: `block-${uid()}` })),
      };

      const idx = p.findIndex((x) => x.id === moduleId);
      const next = [...p];
      next.splice(idx + 1, 0, copy);
      return next;
    });

  // ✅ addBlock retourne l'id créé (utile pour ouvrir le modal direct)
  const addBlock = (moduleId: string, type: BlockType) => {
    const newId = `block-${uid()}`;
    setModules((p) =>
      p.map((m) =>
        m.id === moduleId ? { ...m, blocks: [...m.blocks, makeBlock(type, newId)] } : m,
      ),
    );
    return newId;
  };

  const updateBlock = (
    moduleId: string,
    blockId: string,
    field: "text" | "title",
    value: string,
  ) =>
    setModules((p) =>
      p.map((m) =>
        m.id === moduleId
          ? {
            ...m,
            blocks: m.blocks.map((b) => (b.id === blockId ? { ...b, [field]: value } : b)),
          }
          : m,
      ),
    );

  const deleteBlock = (moduleId: string, blockId: string) =>
    setModules((p) =>
      p.map((m) =>
        m.id === moduleId ? { ...m, blocks: m.blocks.filter((b) => b.id !== blockId) } : m,
      ),
    );

  const duplicateBlock = (moduleId: string, blockId: string) =>
    setModules((p) =>
      p.map((m) => {
        if (m.id !== moduleId) return m;
        const idx = m.blocks.findIndex((b) => b.id === blockId);
        if (idx === -1) return m;

        const src = m.blocks[idx];
        const copy: Block = {
          ...src,
          id: `block-${uid()}`,
          title: src.title ? `${src.title} (copie)` : src.title,
          text: src.text ? `${src.text}` : src.text,
        };

        const nextBlocks = [...m.blocks];
        nextBlocks.splice(idx + 1, 0, copy);
        return { ...m, blocks: nextBlocks };
      }),
    );

  return {
    modules,
    setModules,
    ok,
    addModule,
    updateModuleTitle,
    deleteModule,
    duplicateModule,

    addBlock,
    updateBlock,
    deleteBlock,
    duplicateBlock,
  };
}
