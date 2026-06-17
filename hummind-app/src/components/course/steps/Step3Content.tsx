"use client";

import { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { useCourseAI } from "../../../hooks/useCourseAI";
import { CourseContentPanel } from "../CourseContentPanel";
import { AssistantPanel } from "../AssistantPanel";
import { useExtractFile } from "../../../hooks/useExtractFile";
import { updateDraft } from "../../../store/slices/courseSlice";

type Scope = "ALL" | "MODULE" | "BLOCK";

export function Step3Content({
  onValidChange,
}: {
  onValidChange: (ok: boolean) => void;
}) {
  useEffect(() => onValidChange(true), [onValidChange]);

  const course = useAppSelector((s) => s.course);
  const selectedBlockId = useAppSelector((s) => s.course.ui.selectedBlockId);
  const activeModuleId = useAppSelector((s) => s.course.ui.activeModuleId);
  const aiCredits = useAppSelector((s) => s.course.aiCredits);
  const dispatch = useAppDispatch();

  const {
    loading: extractLoading,
    progress: extractProgress,
    error: extractError,
    extract,
  } = useExtractFile({
    onSuccess: (content) => dispatch(updateDraft({ extractedData: content })),
  });

  const handleUploadFile = async (file: File) => {
    await extract(file);
  };

  const { aiStatus, aiError, aiProgress, aiLabel, isHybrid, hybridReady, runAI } =
    useCourseAI();

  const [prompt, setPrompt] = useState("");
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [scope, setScope] = useState<Scope>("MODULE");

  const modeLabel = useMemo(
    () =>
      course.mode === "AI_ONLY"
        ? "IA uniquement"
        : course.mode === "HYBRID"
          ? "Hybride"
          : "Step by Step",
    [course.mode],
  );

  const handleSubmit = () => {
    const resolvedScope: Scope =
      scope === "BLOCK" && !selectedBlockId ? "MODULE" : scope;

    const moduleId =
      resolvedScope === "ALL"
        ? null
        : resolvedScope === "MODULE"
          ? selectedModuleId ?? activeModuleId ?? null
          : (
              course.builder.modules.find((mod) =>
                mod.blocks.some((b) => b.id === selectedBlockId),
              )?.id ??
              selectedModuleId ??
              activeModuleId ??
              null
            );

    runAI({
      mode: selectedModuleId || resolvedScope !== "ALL" ? "COMPLETE_MODULE" : "PLAN",
      moduleId,
      instructions: prompt,
      scope: resolvedScope,
      targetBlockId: resolvedScope === "BLOCK" ? selectedBlockId : null,
    });

    setPrompt("");
  };

  return (
    <div className="mx-4 flex flex-col gap-6 md:mx-5 xl:flex-row xl:items-start">
      <CourseContentPanel
        aiStatus={aiStatus}
        aiError={aiError}
        aiProgress={aiProgress}
        aiLabel={aiLabel}
        modules={course.builder.modules}
      />

      <AssistantPanel
        modeLabel={modeLabel}
        prompt={prompt}
        onPromptChange={setPrompt}
        onSubmit={handleSubmit}
        loading={aiStatus === "loading"}
        modules={course.builder.modules}
        selectedModuleId={selectedModuleId}
        onSelectModuleId={setSelectedModuleId}
        scope={scope}
        onScopeChange={setScope}
        selectedBlockId={selectedBlockId}
        hasExtract={hybridReady}
        onUploadFile={isHybrid ? handleUploadFile : undefined}
        extractLoading={extractLoading}
        extractProgress={extractProgress}
        extractError={extractError}
        isHybrid={isHybrid}
        credits={{
          total: aiCredits.total,
          consumed: aiCredits.consumed,
          remaining: aiCredits.remaining,
          lastConsumed: aiCredits.lastConsumed,
        }}
      />
    </div>
  );
}
