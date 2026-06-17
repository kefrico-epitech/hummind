"use client";

import React, { useMemo } from "react";
import type { Module } from "../types";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Copy, GripVertical, Trash2 } from "lucide-react";
import { EditableModuleTitle } from "./editor/EditableModuleTitle";

type Props = {
  modules: Module[];
  activeModuleId: string | null;
  onSelectModule: (id: string) => void;
  onReorder: (next: Module[]) => void;
  onRename: (moduleId: string, title: string) => void;
  onDelete: (moduleId: string) => void;
  onDuplicate: (moduleId: string) => void;
};

export function ModulesSortableList({
  modules,
  activeModuleId,
  onSelectModule,
  onReorder,
  onRename,
  onDelete,
  onDuplicate,
}: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const ids = useMemo(() => modules.map((m) => m.id), [modules]);

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    if (active.id === over.id) return;

    const oldIndex = modules.findIndex((m) => m.id === active.id);
    const newIndex = modules.findIndex((m) => m.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    onReorder(arrayMove(modules, oldIndex, newIndex));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {modules.map((m, idx) => (
            <SortableModuleRow
              key={m.id}
              module={m}
              index={idx}
              active={m.id === activeModuleId}
              onSelect={() => onSelectModule(m.id)}
              onRename={(title) => onRename(m.id, title)}
              onDuplicate={() => onDuplicate(m.id)}
              onDelete={() => onDelete(m.id)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableModuleRow({
  module,
  index,
  active,
  onSelect,
  onRename,
  onDelete,
  onDuplicate,
}: {
  module: Module;
  index: number;
  active: boolean;
  onSelect: () => void;
  onRename: (title: string) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: module.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        "group overflow-hidden rounded-xl border px-3 py-3 text-left transition",
        active
          ? "border-[#7C6BF5]/40 bg-[#7C6BF5]/10"
          : "border-white/10 bg-black/10 hover:bg-white/5",
        isDragging ? "opacity-80" : "",
      ].join(" ")}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") onSelect();
      }}
    >
      <div className="min-w-0">
        <div className="flex items-start gap-2">
          <button
            type="button"
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
            title="Deplacer le module"
            aria-label="Deplacer le module"
          >
            <GripVertical className="h-4 w-4" />
          </button>

          <div className="min-w-0 flex-1">
            <EditableModuleTitle
              title={module.title || ""}
              placeholder={`Module ${index + 1}`}
              onRename={onRename}
            />
            <div className="mt-2 flex items-center gap-1.5 opacity-100 transition md:opacity-0 md:group-hover:opacity-100">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate();
                }}
                className="inline-flex h-7 items-center justify-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 text-[11px] font-medium text-white/75 hover:bg-white/10 hover:text-white transition"
                title="Dupliquer le module"
              >
                <Copy className="h-3.5 w-3.5" />
                Dupliquer
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="inline-flex h-7 items-center justify-center gap-1 rounded-md border border-red-500/20 bg-red-500/10 px-2 text-[11px] font-medium text-red-200 hover:bg-red-500/20 transition"
                title="Supprimer le module"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Supprimer
              </button>
            </div>
          </div>
        </div>

        <p className="mt-1 truncate text-xs text-white/50">
          {module.blocks?.length ?? 0} bloc(s)
        </p>
      </div>
    </div>
  );
}
