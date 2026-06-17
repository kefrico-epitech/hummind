"use client";

import React, { useRef } from "react";
import { Eraser, Redo2, Save, Undo2 } from "lucide-react";
import {
  ReactSketchCanvas,
  type ReactSketchCanvasRef,
} from "react-sketch-canvas";

type DrawingData = {
  drawing: string;
};

type DrawingEditorProps = {
  value: DrawingData;
  onChange: (data: DrawingData) => void;
  selected: boolean;
};

export function DrawingBlockEditor({
  value,
  onChange,
  selected,
}: DrawingEditorProps) {
  const canvasRef = useRef<ReactSketchCanvasRef | null>(null);

  const handleSaveDrawing = async () => {
    if (!canvasRef.current) return;
    const drawing = await canvasRef.current.exportImage("png");
    onChange({ drawing });
  };

  const handleClearDrawing = () => {
    if (!canvasRef.current) return;
    canvasRef.current.clearCanvas();
    onChange({ drawing: "" });
  };

  const handleUndo = () => canvasRef.current?.undo();
  const handleRedo = () => canvasRef.current?.redo();

  const hasDrawing = !!value.drawing;

  return (
    <div className="space-y-3">
      {/* Always show the saved preview if available */}
      {hasDrawing && !selected && (
        <div className="overflow-hidden rounded-lg border border-white/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value.drawing}
            alt="Dessin sauvegardé"
            className="w-full bg-white"
          />
        </div>
      )}

      {/* Show preview above canvas when editing */}
      {hasDrawing && selected && (
        <div className="overflow-hidden rounded-lg border border-white/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value.drawing}
            alt="Aperçu du dessin"
            className="max-h-32 w-full bg-white object-contain"
          />
        </div>
      )}

      {/* Canvas + controls when selected */}
      {selected && (
        <>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => void handleSaveDrawing()}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/20 bg-white/5 px-3 text-xs font-medium text-white transition hover:bg-white/10"
            >
              <Save className="h-3 w-3" /> Sauvegarder
            </button>
            <button
              type="button"
              onClick={handleClearDrawing}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/5 px-3 text-xs font-medium text-red-300 transition hover:bg-red-500/15"
            >
              <Eraser className="h-3 w-3" /> Effacer
            </button>
            <button
              type="button"
              onClick={handleUndo}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/20 bg-white/5 px-3 text-xs font-medium text-white transition hover:bg-white/10"
            >
              <Undo2 className="h-3 w-3" /> Annuler
            </button>
            <button
              type="button"
              onClick={handleRedo}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/20 bg-white/5 px-3 text-xs font-medium text-white transition hover:bg-white/10"
            >
              <Redo2 className="h-3 w-3" /> Refaire
            </button>
          </div>

          <div className="h-[400px] w-full overflow-hidden rounded-lg border border-white/10">
            <ReactSketchCanvas
              ref={canvasRef}
              strokeColor="black"
              strokeWidth={4}
              canvasColor="white"
              style={{ width: "100%", height: "100%" }}
            />
          </div>
        </>
      )}

      {/* Empty state */}
      {!hasDrawing && !selected && (
        <div className="rounded-lg border border-dashed border-white/10 p-6 text-center text-sm text-white/30">
          Cliquez pour dessiner
        </div>
      )}
    </div>
  );
}
