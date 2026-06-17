"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Copy, GripVertical, Trash2 } from "lucide-react";
import { BlockRenderer } from "./BlockRenderer";
import { Block, BlockType } from "../types";

type Props = {
  block: Block;
  moduleId: string;
  selected?: boolean;
  onSelect?: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onAddAfter?: (type: BlockType) => void;
};

function formatBlockType(type: string) {
  switch (type) {
    case "title":
      return "Titre";
    case "content":
      return "Contenu";
    case "quiz":
      return "Quiz";
    case "exercise":
      return "Exercice";
    case "drawing":
      return "Dessin";
    case "image":
      return "Image";
    case "table":
      return "Tableau";
    case "chart":
      return "Graphe";
    case "code":
      return "Code";
    case "divider":
      return "Separateur";
    case "math":
      return "Math";
    default:
      return type;
  }
}

export function SortableBlockCard({
  block,
  moduleId,
  selected = false,
  onSelect,
  onDuplicate,
  onDelete,
}: Props) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={[
        "relative overflow-hidden rounded-lg border bg-black/20",
        "border-white/10 transition",
        selected
          ? "border-[#7C6BF5]/30 ring-1 ring-[#7C6BF5]/15 bg-black/28"
          : "hover:bg-black/24",
        isDragging ? "opacity-70" : "",
      ].join(" ")}
    >
      <div className="flex items-center justify-between border-b border-white/8 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <p className="truncate text-xs font-medium text-white/75">
            {block.title?.trim() || formatBlockType(block.type)}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label="Deplacer le bloc"
            title="Reorganiser l'ordre des blocs"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-black/20 text-white/70 transition hover:bg-black/30"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            aria-label="Dupliquer le bloc"
            title="Dupliquer ce bloc"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-black/20 text-white/70 transition hover:bg-black/30"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            aria-label="Supprimer le bloc"
            title="Supprimer ce bloc"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-red-500/15 bg-red-500/8 text-red-200 transition hover:bg-red-500/12"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="px-3 py-3">
        <BlockRenderer block={block} moduleId={moduleId} />
      </div>
    </div>
  );
}
