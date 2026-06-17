"use client";

import React from "react";
import type {
  Block,
  DrawingData,
  ExerciseData,
  QuizData,
  TableData,
} from "../types";
import { TitleBlockEditor } from "./editor/TitleBlockEditor";
import { ContentTextareaEditor } from "./editor/ContentTextareaEditor";
import { QuizEditor } from "./editor/QuizEditor";
import { ExerciseEditor } from "./editor/ExerciseEditor";
import { CodeEditor } from "./editor/CodeEditor";
import { MathEditor } from "./editor/MathEditor";
import { ImageBlockEditor } from "./editor/ImageBlockEditor";

let BlockMathPreview: React.ComponentType<{ math: string; errorColor?: string }> | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  BlockMathPreview = require("react-katex").BlockMath;
} catch { /* react-katex not available */ }
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { updateBlock } from "../../../store/slices/courseSlice";
import { TableBlockEditor } from "./editor/TableBlockEditor";
import { ChartBlockEditor } from "./editor/ChartBlockEditor";
import { DrawingBlockEditor } from "./editor/DrawingBlockEditor";
import { RichCourseContent } from "../common/RichCourseContent";

type Props = {
  block: Block;
  moduleId: string;
};

function EditorShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      {children}
    </div>
  );
}

export function BlockRenderer({ block, moduleId }: Props) {
  const dispatch = useAppDispatch();
  const selectedBlockId = useAppSelector((s) => s.course.ui.selectedBlockId);
  const selected = selectedBlockId === block.id;
  const blockData = block.data ?? {};
  const quizValue: QuizData = blockData.quiz ?? { questions: [] };
  const quizQuestions = quizValue.questions;
  const tableValue: TableData = blockData.table ?? { cols: [], rows: [] };
  const drawingPreview =
    typeof block.data?.drawing === "string"
      ? block.data.drawing
      : block.data?.drawing?.preview ?? "";

  switch (block.type) {
    case "title":
      return (
        <EditorShell>
          <TitleBlockEditor
            value={block.text || ""}
            selected={selected}
            onChange={(next) => {
              dispatch(
                updateBlock({
                  moduleId,
                  blockId: block.id,
                  patch: { text: next, title: next },
                }),
              );
            }}
          />
        </EditorShell>
      );

    case "content":
      return selected ? (
        <EditorShell>
          <ContentTextareaEditor
            value={block.text || ""}
            selected={selected}
            onChange={(next) => {
              dispatch(
                updateBlock({
                  moduleId,
                  blockId: block.id,
                  patch: { text: next },
                }),
              );
            }}
          />
        </EditorShell>
      ) : (
        <RichCourseContent
          content={block.text || ""}
          idPrefix={`builder-content-${block.id}`}
        />
      );

    case "quiz":
      return selected ? (
        <EditorShell>
          <QuizEditor
            value={quizValue}
            onChange={(next) => {
              dispatch(
                updateBlock({
                  moduleId,
                  blockId: block.id,
                  patch: { data: { ...blockData, quiz: next } } as Partial<Block>,
                }),
              );
            }}
          />
        </EditorShell>
      ) : (
        <div>
          <p className="text-xs tracking-wide text-white/50">Quiz</p>
          <p className="mt-1 text-base font-semibold text-white">
            {block.title || "Quiz"}
          </p>
          {quizQuestions.length > 0 ? (
            <div className="mt-3 rounded-2xl border border-white/10 bg-black/25 p-3">
              <p className="text-sm font-medium leading-6 text-white/90">
                {quizQuestions[0]?.q || "Question a configurer"}
              </p>
              <div className="mt-3 space-y-2">
                {(quizQuestions[0]?.choices || [])
                  .slice(0, 4)
                  .map((choice, choiceIndex) => (
                    <div
                      key={`${block.id}-choice-${choiceIndex}`}
                      className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-white/72"
                    >
                      <span className="mr-2 text-white/42">
                        {String.fromCharCode(65 + choiceIndex)}.
                      </span>
                      {choice}
                    </div>
                  ))}
              </div>
              <p className="mt-3 text-xs text-white/52">
                {quizQuestions.length} question(s) preparee(s)
              </p>
            </div>
          ) : (
            <p className="mt-2 text-sm text-white/70">Questions a configurer</p>
          )}
        </div>
      );

    case "exercise": {
      const ex = blockData.exercise as ExerciseData | undefined;

      return selected ? (
        <EditorShell>
          <ExerciseEditor
            title={block.title || ""}
            value={ex}
            onChange={(nextEx) =>
              dispatch(
                updateBlock({
                  moduleId,
                  blockId: block.id,
                  patch: {
                    data: {
                      ...blockData,
                      exercise: nextEx,
                    },
                  },
                }),
              )
            }
            onChangeTitle={(t) =>
              dispatch(
                updateBlock({
                  moduleId,
                  blockId: block.id,
                  patch: { title: t },
                }),
              )
            }
          />
        </EditorShell>
      ) : (
        <div className="space-y-4 text-sm text-white/80">
          <p className="font-semibold">{block.title?.trim() || "Exercice"}</p>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-3.5">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-white/48">
              Consigne
            </p>
            <RichCourseContent
              content={ex?.statement || ""}
              idPrefix={`builder-exercise-statement-${block.id}`}
              className="mt-3"
            />
          </div>

          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3.5">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-white/44">
              Piste de correction
            </p>
            <RichCourseContent
              content={ex?.solution || ""}
              idPrefix={`builder-exercise-solution-${block.id}`}
              className="mt-3 text-white/72"
            />
          </div>
        </div>
      );
    }

    /* -------------------- âœ… NEW BLOCKS (v1) -------------------- */

    case "divider": {
      const d = blockData.divider as
        | { variant?: "line" | "dashed" | "space"; label?: string }
        | undefined;

      const variant = d?.variant ?? "line";

      return (
        <div className="py-2">
          {d?.label ? (
            <div className="mb-2 text-xs font-semibold text-white/60">
              {d.label}
            </div>
          ) : null}

          {variant === "space" ? (
            <div className="h-6" />
          ) : variant === "dashed" ? (
            <div className="w-full border-t border-dashed border-white/15" />
          ) : (
            <div className="h-px w-full bg-white/10" />
          )}
        </div>
      );
    }

    case "code": {
      const code = blockData.code as
        | { language?: string; code?: string }
        | undefined;

      return selected ? (
        <EditorShell>
          <CodeEditor
            value={code}
            onChange={(next) =>
              dispatch(
                updateBlock({
                  moduleId,
                  blockId: block.id,
                  patch: { data: { ...blockData, code: next } },
                }),
              )
            }
          />
        </EditorShell>
      ) : (
        <div className="text-sm text-white/80">
          <p className="font-semibold">{block.title?.trim() || "Code"}</p>
          <p className="mt-2 text-xs text-white/50">
            Langage : {(code?.language || "â€”").toString()}
          </p>
          <pre className="mt-3 max-h-32 overflow-hidden rounded-xl border border-white/10 bg-black/30 p-3 font-mono text-xs text-white/70">
            {(code?.code || "").slice(0, 260)}
            {(code?.code || "").length > 260 ? "â€¦" : ""}
          </pre>
        </div>
      );
    }

    case "math": {
      const math = blockData.math as
        | { mode?: "inline" | "block"; latex?: string; description?: string }
        | undefined;

      return selected ? (
        <EditorShell>
          <MathEditor
            value={math}
            onChange={(next) =>
              dispatch(
                updateBlock({
                  moduleId,
                  blockId: block.id,
                  patch: { data: { ...blockData, math: next } },
                }),
              )
            }
          />
        </EditorShell>
      ) : (
        <div className="text-sm text-white/80">
          {math?.description?.trim() ? (
            <p className="mb-2 text-xs font-medium text-white/55">{math.description}</p>
          ) : null}
          {math?.latex?.trim() && BlockMathPreview ? (
            <div className="my-2 flex justify-center rounded-lg bg-white/5 px-4 py-3">
              <BlockMathPreview math={math.latex} errorColor="#ff6b6b" />
            </div>
          ) : (
            <p className="text-xs italic text-white/40">
              Cliquez pour ajouter une formule LaTeX
            </p>
          )}
        </div>
      );
    }

    /* -------------------- âœ… IMAGE BLOCK -------------------- */

    case "image": {
      const imageData = block.data?.image || { url: "", alt: "", caption: "" };
      return (
        <EditorShell>
          <ImageBlockEditor
            value={{
              url: imageData.url,
              alt: imageData.alt || "", // Valeur par dÃ©faut si 'alt' est undefined
              caption: imageData.caption || "", // Valeur par dÃ©faut si 'caption' est undefined
              width: imageData.width,
              height: imageData.height,
            }}
            onChange={(newImage) => {
              dispatch(
                updateBlock({
                  moduleId,
                  blockId: block.id,
                  patch: { data: { image: newImage } },
                }),
              );
            }}
          />
        </EditorShell>
      );
    }

    case "table": {
      return (
        <EditorShell>
          <TableBlockEditor
            value={tableValue}
            onChange={(newTable) => {
              dispatch(
                updateBlock({
                  moduleId,
                  blockId: block.id,
                  patch: { data: { table: newTable } },
                }),
              );
            }}
          />
        </EditorShell>
      );
    }

    case "chart": {
      return (
        <EditorShell>
          <ChartBlockEditor
            value={
              block.data?.chart || {
                labels: [],
                datasets: [{ label: "", data: [] }],
              }
            }
            onChange={(newChart) => {
              dispatch(
                updateBlock({
                  moduleId,
                  blockId: block.id,
                  patch: { data: { chart: newChart } },
                }),
              );
            }}
          />
        </EditorShell>
      );
    }
    case "drawing": {
      return (
        <EditorShell>
          <DrawingBlockEditor
            selected={selected}
            value={{
              drawing: drawingPreview,
            }}
            onChange={(newDrawing) => {
              const nextDrawing: DrawingData = {
                version: 1,
                tool: "tldraw",
                snapshot: null,
                preview: newDrawing.drawing,
              };
              dispatch(
                updateBlock({
                  moduleId,
                  blockId: block.id,
                  patch: { data: { drawing: nextDrawing } },
                }),
              );
            }}
          />
        </EditorShell>
      );
    }

    default:
      return (
        <div className="text-sm text-white/70">
          Bloc <span className="font-semibold">{block.type}</span>
        </div>
      );
  }
}




