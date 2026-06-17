"use client";

import React, { useMemo } from "react";
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
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableBlockCard } from "./SortableBlockCard";
import type { Block, BlockType } from "../types";

type Props = {
  moduleId: string;
  blocks: Block[];
  selectedBlockId: string | null;
  onSelectBlock: (id: string | null) => void;
  onReorder: (next: Block[]) => void;
  onDuplicate: (blockId: string) => void;
  onDelete: (blockId: string) => void;
  onAddAfter: (afterId: string | null, type: BlockType) => void;
  showHeader?: boolean;
};

export function CourseBuilderColumn({
  moduleId,
  blocks,
  selectedBlockId,
  onSelectBlock,
  onReorder,
  onDuplicate,
  onDelete,
  onAddAfter,
  showHeader = true,
}: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const ids = useMemo(() => blocks.map((b) => b.id), [blocks]);

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;

    const oldIndex = blocks.findIndex((b) => b.id === String(active.id));
    const newIndex = blocks.findIndex((b) => b.id === String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;

    onReorder(arrayMove(blocks, oldIndex, newIndex));
  };

  return (
    <div className="space-y-3">
      {showHeader ? (
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold tracking-wide text-white/60">
            Blocs
          </p>
        </div>
      ) : null}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {blocks.map((b) => (
              <SortableBlockCard
                key={b.id}
                block={b}
                moduleId={moduleId}
                selected={selectedBlockId === b.id}
                onSelect={() => onSelectBlock(b.id)}
                onDuplicate={() => onDuplicate(b.id)}
                onDelete={() => onDelete(b.id)}
                onAddAfter={(type) => onAddAfter(b.id, type)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div className="h-6" onClick={() => onSelectBlock(null)} aria-hidden />
    </div>
  );
}
