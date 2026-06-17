"use client";

import { useEffect, useMemo, useState } from "react";
import { useAppSelector } from "../../../../store/hooks";
import { useCourseAI } from "../../../../hooks/useCourseAI";
import { CourseContentPanel } from "../CourseContentPanel";
import { AssistantPanel } from "../AssistantPanel";

export function Step3Content({ onValidChange }: { onValidChange: (ok: boolean) => void }) {
  useEffect(() => onValidChange(true), [onValidChange]);

  const course = useAppSelector((s) => s.course);
  const { aiStatus, aiError, aiProgress, aiLabel, isAiOnly, step2Ready, runAI } =
    useCourseAI();

  const [prompt, setPrompt] = useState("");
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);

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
    runAI({
      mode: selectedModuleId ? "COMPLETE_MODULE" : "PLAN",
      moduleId: selectedModuleId,
      instructions: prompt,
    });
    setPrompt("");
  };

  return (
    <div className="mx-4 flex flex-col gap-6 md:mx-5 xl:flex-row xl:items-start">
      <CourseContentPanel
        modeLabel={modeLabel}
        isAiOnly={isAiOnly}
        step2ReadyForAi={step2Ready}
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
      />
    </div>
  );
}
