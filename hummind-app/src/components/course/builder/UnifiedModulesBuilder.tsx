"use client";

import React, { useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AlertCircle, CheckCircle2, ChevronDown, Clock, Copy, GripVertical, Plus, Trash2 } from "lucide-react";
import { EditableModuleTitle } from "./editor/EditableModuleTitle";
import { AddBlockButton } from "../ui/AddBlockButton";
import { CourseBuilderColumn } from "./CourseBuilderColumn";
import type { Block, BlockType, Module } from "../types";

// ─── Module validation badge ───

type ModuleHealth = "complete" | "incomplete" | "error";

function getModuleHealth(module: Module): { status: ModuleHealth; tooltip: string } {
  const blocks = module.blocks ?? [];
  const hasTitle = blocks.some((b) => b.type === "title");
  const contentBlocks = blocks.filter((b) => b.type === "content");
  const hasContent = contentBlocks.length > 0;
  const contentLength = contentBlocks.reduce((s, b) => s + (b.text?.length ?? 0), 0);
  const hasQuizOrExercise = blocks.some((b) => b.type === "quiz" || b.type === "exercise");
  const quizBlocks = blocks.filter((b) => b.type === "quiz");
  const quizQuestionCount = quizBlocks.reduce((s, b) => {
    const quizData = (b.data as Record<string, unknown>)?.quiz as { questions?: unknown[] } | undefined;
    return s + (quizData?.questions?.length ?? 0);
  }, 0);
  const exerciseBlocks = blocks.filter((b) => b.type === "exercise");
  const hasRealExercise = exerciseBlocks.some((b) => {
    const exData = (b.data as Record<string, unknown>)?.exercise as { statement?: string; solution?: string } | undefined;
    return (exData?.statement?.trim()?.length ?? 0) > 20 && (exData?.solution?.trim()?.length ?? 0) > 10;
  });
  const hasPending = blocks.some((b) => b.status === "pending");
  const title = module.title?.trim() || "";
  const genericTitle = /^(?:module|chapitre|introduction|conclusion|generalites)\s*\d*$/i.test(title);

  // Error: generic title or pending blocks
  if (genericTitle) return { status: "error", tooltip: "Titre générique — renommez ce module" };
  if (hasPending) return { status: "error", tooltip: "Blocs en attente de contenu" };

  // Incomplete: missing structure
  const missing: string[] = [];
  if (!hasTitle) missing.push("titre");
  if (!hasContent) missing.push("contenu");
  if (!hasQuizOrExercise) missing.push("quiz ou exercice");
  else {
    if (quizBlocks.length > 0 && quizQuestionCount < 3) missing.push("quiz : min. 3 questions");
    if (exerciseBlocks.length > 0 && !hasRealExercise) missing.push("exercice incomplet");
  }
  if (hasContent && contentLength < 300) missing.push("contenu trop court");

  if (missing.length > 0) return { status: "incomplete", tooltip: `Manque : ${missing.join(", ")}` };

  return { status: "complete", tooltip: "Module complet ✓" };
}

function ModuleHealthBadge({ module }: { module: Module }) {
  const { status, tooltip } = getModuleHealth(module);

  const config = {
    complete: { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
    incomplete: { icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
    error: { icon: AlertCircle, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
  }[status];

  const Icon = config.icon;

  return (
    <span title={tooltip} className={`inline-flex h-6 w-6 items-center justify-center rounded-full border ${config.bg}`}>
      <Icon className={`h-3.5 w-3.5 ${config.color}`} />
    </span>
  );
}

type Props = {
  modules: Module[];
  activeModuleId: string | null;
  selectedBlockId: string | null;
  onSelectModule: (id: string) => void;
  onReorderModules: (next: Module[]) => void;
  onRenameModule: (moduleId: string, title: string) => void;
  onDeleteModule: (moduleId: string) => void;
  onDuplicateModule: (moduleId: string) => void;
  onAddModule: () => void;
  onAddBlock: (moduleId: string, type: BlockType) => void;
  onReorderBlocks: (moduleId: string, nextBlocks: Block[]) => void;
  onSelectBlock: (id: string | null) => void;
  onDuplicateBlock: (moduleId: string, blockId: string) => void;
  onDeleteBlock: (moduleId: string, blockId: string) => void;
  onAddAfter: (
    moduleId: string,
    afterBlockId: string | null,
    type: BlockType,
  ) => void;
};

export function UnifiedModulesBuilder({
  modules,
  activeModuleId,
  selectedBlockId,
  onSelectModule,
  onReorderModules,
  onRenameModule,
  onDeleteModule,
  onDuplicateModule,
  onAddModule,
  onAddBlock,
  onReorderBlocks,
  onSelectBlock,
  onDuplicateBlock,
  onDeleteBlock,
  onAddAfter,
}: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );
  const [openById, setOpenById] = useState<Record<string, boolean>>({});
  const ids = useMemo(() => modules.map((m) => m.id), [modules]);

  const isModuleOpen = (moduleId: string, index: number) => {
    const explicit = openById[moduleId];
    if (typeof explicit === "boolean") return explicit;
    if (activeModuleId) return moduleId === activeModuleId;
    return index === 0;
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = modules.findIndex((m) => m.id === active.id);
    const newIndex = modules.findIndex((m) => m.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    onReorderModules(arrayMove(modules, oldIndex, newIndex));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className="space-y-4">
          {modules.map((module, index) => (
            <SortableModuleSection
              key={module.id}
              module={module}
              moduleIndex={index}
              active={module.id === activeModuleId}
              open={isModuleOpen(module.id, index)}
              selectedBlockId={selectedBlockId}
              onSelectModule={() => {
                onSelectModule(module.id);
                setOpenById((prev) => ({
                  ...prev,
                  [module.id]: true,
                }));
              }}
              onToggleModule={() =>
                setOpenById((prev) => {
                  const current = isModuleOpen(module.id, index);
                  return {
                    ...prev,
                    [module.id]: !current,
                  };
                })
              }
              onRenameModule={(title) => onRenameModule(module.id, title)}
              onDeleteModule={() => onDeleteModule(module.id)}
              onDuplicateModule={() => onDuplicateModule(module.id)}
              onAddBlock={(type) => onAddBlock(module.id, type)}
              onReorderBlocks={(nextBlocks) =>
                onReorderBlocks(module.id, nextBlocks)
              }
              onSelectBlock={onSelectBlock}
              onDuplicateBlock={(blockId) =>
                onDuplicateBlock(module.id, blockId)
              }
              onDeleteBlock={(blockId) => onDeleteBlock(module.id, blockId)}
              onAddAfter={(afterBlockId, type) =>
                onAddAfter(module.id, afterBlockId, type)
              }
            />
          ))}
        </div>
      </SortableContext>

      <div className="mt-3 rounded-xl border border-dashed border-white/15 bg-white/2 p-2.5">
        <button
          type="button"
          onClick={onAddModule}
          title="Creer un nouveau module"
          className="inline-flex h-8 items-center justify-center gap-2 rounded-full border border-white/12 bg-white/6 px-3.5 text-xs font-semibold text-white/80 transition hover:bg-white/10"
        >
          <Plus className="h-3.5 w-3.5" />
          Ajouter un module
        </button>
      </div>
    </DndContext>
  );
}

function SortableModuleSection({
  module,
  moduleIndex,
  active,
  open,
  selectedBlockId,
  onSelectModule,
  onToggleModule,
  onRenameModule,
  onDeleteModule,
  onDuplicateModule,
  onAddBlock,
  onReorderBlocks,
  onSelectBlock,
  onDuplicateBlock,
  onDeleteBlock,
  onAddAfter,
}: {
  module: Module;
  moduleIndex: number;
  active: boolean;
  open: boolean;
  selectedBlockId: string | null;
  onSelectModule: () => void;
  onToggleModule: () => void;
  onRenameModule: (title: string) => void;
  onDeleteModule: () => void;
  onDuplicateModule: () => void;
  onAddBlock: (type: BlockType) => void;
  onReorderBlocks: (nextBlocks: Block[]) => void;
  onSelectBlock: (id: string | null) => void;
  onDuplicateBlock: (blockId: string) => void;
  onDeleteBlock: (blockId: string) => void;
  onAddAfter: (afterBlockId: string | null, type: BlockType) => void;
}) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: module.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <section
      ref={setNodeRef}
      style={style}
      className={[
        "rounded-xl border bg-white/2 p-3 sm:p-4",
        active
          ? "border-[#7C6BF5]/30 ring-1 ring-[#7C6BF5]/15"
          : "border-white/10",
        isDragging ? "opacity-70" : "",
      ].join(" ")}
    >
      <header
        className={[
          "flex items-center justify-between gap-3",
          open ? "mb-3 border-b border-white/8 pb-2.5" : "",
        ].join(" ")}
      >
        <div
          className="min-w-0 flex flex-1 items-center gap-2"
          onClick={onSelectModule}
        >
          <span className="shrink-0 text-xs font-bold text-white/30">
            {moduleIndex + 1}.
          </span>
          <EditableModuleTitle
            title={module.title || ""}
            placeholder={`Titre du module ${moduleIndex + 1}`}
            onRename={onRenameModule}
          />
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            {...attributes}
            {...listeners}
            title="Reorganiser l'ordre des modules"
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-white/10 bg-black/20 text-white/70 transition hover:bg-black/30"
            aria-label="Deplacer le module"
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={onDuplicateModule}
            title="Dupliquer ce module"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-black/20 text-white/70 transition hover:bg-black/30"
            aria-label="Dupliquer le module"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={onDeleteModule}
            title="Supprimer ce module"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-red-500/15 bg-red-500/8 text-red-200 transition hover:bg-red-500/12"
            aria-label="Supprimer le module"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onToggleModule}
            title={open ? "Replier ce module" : "Ouvrir ce module"}
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-white/10 bg-black/20 text-white/70 transition hover:bg-black/30"
            aria-label={open ? "Fermer le module" : "Ouvrir le module"}
          >
            <ChevronDown
              className={[
                "h-3.5 w-3.5 transition-transform",
                open ? "rotate-180" : "rotate-0",
              ].join(" ")}
            />
          </button>
        </div>
      </header>
      {open ? (
        <div className="rounded-xl border border-white/10 bg-black/15 p-2.5 sm:p-3">
          <CourseBuilderColumn
            moduleId={module.id}
            blocks={module.blocks}
            selectedBlockId={selectedBlockId}
            onSelectBlock={(id) => {
              onSelectModule();
              onSelectBlock(id);
            }}
            onReorder={onReorderBlocks}
            onDuplicate={onDuplicateBlock}
            onDelete={onDeleteBlock}
            onAddAfter={onAddAfter}
            showHeader={false}
          />

          <div className="mt-3">
            <AddBlockButton
              onPick={(type) => {
                onSelectModule();
                onAddBlock(type);
              }}
              label="Ajouter"
              buttonTitle="Ajouter un bloc dans ce module"
              className="bg-white/5 text-white/75 hover:bg-white/10"
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}
