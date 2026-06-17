"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUp,
  BookOpen,
  ClipboardCheck,
  CornerDownRight,
  Loader2,
  Mic,
  Plus,
  Sparkles,
} from "lucide-react";
import type { CourseDetail } from "../../../../../../../src/lib/course/courseDetail";
import type { LiveCourseStep } from "../../../../../../../src/lib/course/liveCourse";
import { cn } from "../../../../../../../src/lib/utils";
import {
  useCourseLiveTutorSession,
  type TutorSuggestion,
} from "../_hooks/useCourseLiveTutorSession";

type CourseLiveChatPanelProps = {
  course: CourseDetail;
  step: LiveCourseStep;
  moduleSteps: LiveCourseStep[];
  courseSteps: LiveCourseStep[];
  stepIndex: number;
  stepTotal: number;
  nextStep: LiveCourseStep | null;
  locale: string;
  userInitials: string;
  onSelectStep: (stepId: string) => void;
};

type RichContentBlock =
  | { type: "section"; label: string; tone: "accent" | "success" | "neutral" }
  | { type: "list"; ordered: boolean; items: string[]; start?: number }
  | { type: "paragraph"; text: string; emphasized: boolean };

function normalizeParagraph(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function stripOrderedPrefix(value: string) {
  return value.replace(/^(?:\d+|[A-Za-z])[.)]\s+/, "").trim();
}

function splitStructuredParagraphs(paragraphs: string[]) {
  return paragraphs.flatMap((paragraph) => {
    const normalized = paragraph
      .replace(/\r\n/g, "\n")
      // Fix markers glued to preceding text
      .replace(/Point[- ]cl[eé]s?[\s\n]+[aà]\s+retenir\s*:/giu, "Point-cle a retenir:")
      .replace(
        /\s+(?=(?:Objectifs?(?: du chapitre| du module)?|D[eé]finitions? essentielles?|D[eé]finition|Exemple(?: concret)?|Point[- ]cl[eé]s?(?: [aà] retenir)?|M[eé]thode|Explication)\s*:)/giu,
        "\n",
      )
      .replace(
        /((?:Objectifs?(?: du chapitre| du module)?|D[eé]finitions? essentielles?|D[eé]finition|Exemple(?: concret)?|Point[- ]cl[eé]s?(?: [aà] retenir)?|M[eé]thode|Explication)\s*:)[ \t]+/giu,
        "$1\n",
      )
      .replace(/[ \t]+/g, " ")
      .replace(/\s+(?=(?:\d{1,2}|[A-Za-z])[.)]\s+)/g, "\n");

    return normalized
      .split(/\n+/)
      .map((item) => item.trim())
      .filter(Boolean);
  });
}

function parseSemanticLabel(value: string): {
  label: string;
  tone: "accent" | "success" | "neutral";
  rest: string;
} | null {
  const trimmed = normalizeParagraph(value);
  if (!trimmed) return null;

  const patterns = [
    {
      regex: /^(objectif(?:s)?(?: du chapitre| du module)?)\s*:?\s*(.*)$/iu,
      tone: "success" as const,
    },
    {
      regex:
        /^(a retenir|point[- ]cl[eé](?:\s+[aà]\s+retenir)?|points[- ]cl[eé]s)\s*:?\s*(.*)$/iu,
      tone: "accent" as const,
    },
    {
      regex:
        /^(exemple(?: concret)?(?:\s*\([^)]+\))?|cas pratique|mise en pratique)\s*:?\s*(.*)$/iu,
      tone: "accent" as const,
    },
    {
      regex:
        /^(d[eé]finition|notion cl[eé]|notions? et outils essentiels|v[eé]rification rapide|attention|m[eé]thode|r[oô]le symbolique|place dans les symboles nationaux)\s*:?\s*(.*)$/iu,
      tone: "neutral" as const,
    },
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern.regex);
    if (!match) continue;

    return {
      label: match[1].replace(/\s+/g, " ").trim(),
      tone: pattern.tone,
      rest: match[2]?.trim() ?? "",
    };
  }

  return null;
}

function parseListItem(value: string): { ordered: boolean; text: string } | null {
  const trimmed = normalizeParagraph(value);
  if (!trimmed) return null;

  const unorderedMatch = trimmed.match(/^[-•]\s+(.+)$/);
  if (unorderedMatch) {
    return {
      ordered: false,
      text: unorderedMatch[1].trim(),
    };
  }

  const orderedMatch = trimmed.match(/^(?:\d+|[A-Za-z])[.)]\s+(.+)$/);
  if (orderedMatch) {
    return {
      ordered: true,
      text: orderedMatch[1].trim(),
    };
  }

  return null;
}

function parseOrderedListItem(value: string): {
  text: string;
  start: number;
} | null {
  const trimmed = normalizeParagraph(value);
  if (!trimmed) return null;

  const orderedMatch = trimmed.match(/^(\d+)[.)]\s+(.+)$/);
  if (!orderedMatch) return null;

  return {
    start: Number.parseInt(orderedMatch[1], 10),
    text: orderedMatch[2].trim(),
  };
}

function isShortHeading(value: string) {
  const trimmed = normalizeParagraph(value);
  if (!trimmed) return false;
  if (parseListItem(trimmed) || parseSemanticLabel(trimmed)) return false;

  const wordCount = trimmed.split(/\s+/).length;
  return wordCount <= 6 && !/[.!?]$/.test(trimmed);
}

function buildRichContentBlocks(paragraphs: string[]): RichContentBlock[] {
  const blocks: RichContentBlock[] = [];
  let listBuffer: { ordered: boolean; items: string[]; start?: number } | null =
    null;
  const expandedParagraphs = splitStructuredParagraphs(paragraphs);

  const flushList = () => {
    if (!listBuffer || listBuffer.items.length === 0) return;
    blocks.push({
      type: "list",
      ordered: listBuffer.ordered,
      items: [...listBuffer.items],
      start: listBuffer.start,
    });
    listBuffer = null;
  };

  for (const paragraph of expandedParagraphs) {
    const trimmed = normalizeParagraph(paragraph);
    if (!trimmed) continue;

    const semanticCandidate = stripOrderedPrefix(trimmed);
    const semantic = parseSemanticLabel(semanticCandidate);
    if (semantic) {
      flushList();
      blocks.push({
        type: "section",
        label: semantic.label,
        tone: semantic.tone,
      });

      if (semantic.rest) {
        const inlineListItem = parseListItem(semantic.rest);
        if (inlineListItem) {
          const orderedInline = parseOrderedListItem(semantic.rest);
          listBuffer = {
            ordered: inlineListItem.ordered,
            items: [inlineListItem.text],
            start: orderedInline?.start,
          };
        } else {
          blocks.push({
            type: "paragraph",
            text: semantic.rest,
            emphasized: false,
          });
        }
      }

      continue;
    }

    const listItem = parseListItem(trimmed);
    if (listItem) {
      const orderedListItem = parseOrderedListItem(trimmed);

      if (!listBuffer || listBuffer.ordered !== listItem.ordered) {
        flushList();
        listBuffer = {
          ordered: listItem.ordered,
          items: [],
          start: orderedListItem?.start,
        };
      }

      if (
        listBuffer.ordered &&
        orderedListItem &&
        (listBuffer.items.length === 0 || listBuffer.start === undefined)
      ) {
        listBuffer.start = orderedListItem.start;
      }

      listBuffer.items.push(listItem.text);
      continue;
    }

    flushList();
    blocks.push({
      type: "paragraph",
      text: trimmed,
      emphasized: isShortHeading(trimmed),
    });
  }

  flushList();
  return blocks;
}

function renderRichBlocks(messageId: string, paragraphs: string[]) {
  return buildRichContentBlocks(paragraphs).map((block, blockIndex) => {
    if (block.type === "section") {
      return (
        <div
          key={`${messageId}-section-${blockIndex}`}
          className={cn(
            "inline-flex rounded-full px-2.5 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.12em]",
            block.tone === "accent"
              ? "bg-[#4D467A]/35 text-[#A9A2FF]"
              : block.tone === "success"
                ? "bg-[#0B4D3D]/35 text-[#6EE7BF]"
                : "bg-white/7 text-white/62",
          )}
        >
          {block.label}
        </div>
      );
    }

    if (block.type === "list") {
      const ListTag = block.ordered ? "ol" : "ul";

      return (
        <ListTag
          key={`${messageId}-list-${blockIndex}`}
          start={block.ordered ? block.start : undefined}
          className={cn(
            "space-y-2 pl-5 text-white/88",
            block.ordered ? "list-decimal" : "list-disc",
          )}
        >
          {block.items.map((item, itemIndex) => (
            <li
              key={`${messageId}-list-${blockIndex}-${itemIndex}`}
              className="pl-1"
            >
              {item}
            </li>
          ))}
        </ListTag>
      );
    }

    return (
      <p
        key={`${messageId}-paragraph-${blockIndex}`}
        className={cn(block.emphasized ? "font-semibold text-white/96" : "")}
      >
        {block.text}
      </p>
    );
  });
}

function getStepEyebrow(step: LiveCourseStep) {
  if (step.kind === "quiz") return "Verification rapide";
  if (step.kind === "exercise") return "Mise en pratique";
  return "Lecon du cours";
}

function getStepInstruction(step: LiveCourseStep) {
  if (step.kind === "quiz") {
    return "Choisis la meilleure reponse. Le tuteur peut te guider si besoin.";
  }

  if (step.kind === "exercise") {
    return "Lis la consigne et redige une premiere tentative.";
  }

  return "";
}

function getQuizChoiceLabel(index: number) {
  return String.fromCharCode(65 + index);
}

function SystemCardHeader({
  step,
  stepIndex,
  stepTotal,
}: {
  step: LiveCourseStep;
  stepIndex: number;
  stepTotal: number;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-white/8 pb-4">
      <div className="flex items-center gap-2 text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-[#8E8BFF]">
        <BookOpen className="h-3.5 w-3.5" />
        <span>{getStepEyebrow(step)}</span>
        <span className="rounded-full border border-white/10 bg-white/6 px-2 py-0.5 text-[0.66rem] tracking-[0.08em] text-white/55">
          {stepIndex + 1}/{stepTotal}
        </span>
      </div>

      <div>
        <h1 className="text-[1.1rem] font-semibold leading-tight text-white/96 sm:text-[1.45rem]">
          {step.title}
        </h1>
        {getStepInstruction(step) ? (
          <p className="mt-2 max-w-3xl text-[0.92rem] leading-6 text-white/60">
            {getStepInstruction(step)}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function LessonSystemCard({
  step,
  stepIndex,
  stepTotal,
  embedded = false,
}: {
  step: LiveCourseStep;
  stepIndex: number;
  stepTotal: number;
  embedded?: boolean;
}) {
  return (
    <section
      className={cn(
        embedded
          ? "px-0 py-0"
          : "rounded-[1.6rem] border border-white/8 bg-[#2E2F34] px-4 py-4 shadow-[0_20px_45px_rgba(0,0,0,0.16)] sm:px-5 sm:py-5",
      )}
    >
      <SystemCardHeader step={step} stepIndex={stepIndex} stepTotal={stepTotal} />

      <div className="mt-4 space-y-3.5 text-[14px] leading-7 text-white/86 sm:text-[0.96rem]">
        {renderRichBlocks(`${step.id}-lesson`, step.sourceLines)}
      </div>
    </section>
  );
}

function ExerciseSystemCard({
  step,
  stepIndex,
  stepTotal,
  exerciseDraft,
  exerciseEvaluation,
  pending,
  onDraftChange,
  onSubmit,
  readOnly = false,
  embedded = false,
}: {
  step: LiveCourseStep;
  stepIndex: number;
  stepTotal: number;
  exerciseDraft: string;
  exerciseEvaluation: "none" | "partial" | "strong";
  pending: boolean;
  onDraftChange: (value: string) => void;
  onSubmit: () => void;
  readOnly?: boolean;
  embedded?: boolean;
}) {
  return (
    <section
      className={cn(
        embedded
          ? "px-0 py-0"
          : "rounded-[1.6rem] border border-white/8 bg-[#2E2F34] px-4 py-4 shadow-[0_20px_45px_rgba(0,0,0,0.16)] sm:px-5 sm:py-5",
      )}
    >
      <SystemCardHeader step={step} stepIndex={stepIndex} stepTotal={stepTotal} />

      <div className="mt-4 rounded-[1.15rem] border border-white/8 bg-[#25262A] px-4 py-4">
        <div className="flex items-center gap-2 text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-white/44">
          <ClipboardCheck className="h-3.5 w-3.5" />
          <span>Consigne</span>
        </div>

        <div className="mt-3 space-y-3 text-[0.95rem] leading-7 text-white/88">
          {renderRichBlocks(`${step.id}-exercise`, step.sourceLines)}
        </div>

      </div>

      <div className="mt-4 rounded-[1.15rem] border border-dashed border-[#7C6BF5]/20 bg-[#7C6BF5]/5 px-4 py-3">
        <p className="text-[0.88rem] leading-6 text-white/70">
          Reponds directement dans le chat ci-dessous. Le tuteur te guidera pas a pas.
        </p>
      </div>
    </section>
  );
}

export function CourseLiveChatPanel({
  course,
  step,
  moduleSteps,
  courseSteps,
  stepIndex,
  stepTotal,
  nextStep,
  locale,
  userInitials,
  onSelectStep,
}: CourseLiveChatPanelProps) {
  const [question, setQuestion] = useState("");
  const scrollViewportRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const shouldAutoScrollRef = useRef(true);
  const {
    messages,
    sessionMessagesByStepId,
    pending,
    pendingLabel,
    error,
    activeQuizMessageId,
    lastQuizChoiceIndex,
    lastQuizEvaluation,
    exerciseDraft,
    exerciseEvaluation,
    askTutor,
    triggerSuggestedPrompt,
    progressToNextStep,
    answerQuiz,
    updateExerciseDraft,
    submitExerciseAnswer,
  } = useCourseLiveTutorSession({
    course,
    step,
    nextStep,
    locale,
  });

  const latestAssistantMessageId = useMemo(() => {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      if (messages[index]?.role === "assistant") {
        return messages[index]?.id ?? null;
      }
    }
    return null;
  }, [messages]);

  const stepIndexById = useMemo(
    () =>
      new Map(courseSteps.map((courseStep, index) => [courseStep.id, index])),
    [courseSteps],
  );
  const stepMessagesById = useMemo(
    () =>
      Object.fromEntries(
        moduleSteps.map((moduleStep) => [
          moduleStep.id,
          moduleStep.id === step.id
            ? messages
            : sessionMessagesByStepId[moduleStep.id] ?? [],
        ]),
      ) as Record<string, typeof messages>,
    [messages, moduleSteps, sessionMessagesByStepId, step.id],
  );
  const visibleModuleSteps = useMemo(
    () =>
      moduleSteps.filter((moduleStep) => {
        const stepMessages = stepMessagesById[moduleStep.id] ?? [];
        return moduleStep.id === step.id || stepMessages.length > 0;
      }),
    [moduleSteps, step.id, stepMessagesById],
  );
  const conversationSignature = useMemo(
    () =>
      visibleModuleSteps
        .map(
          (moduleStep) =>
            `${moduleStep.id}:${(stepMessagesById[moduleStep.id] ?? []).length}`,
        )
        .join("|"),
    [stepMessagesById, visibleModuleSteps],
  );

  useEffect(() => {
    const viewport = scrollViewportRef.current;
    if (!viewport) return;

    const updateAutoScrollState = () => {
      const distanceFromBottom =
        viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
      shouldAutoScrollRef.current = distanceFromBottom <= 120;
    };

    updateAutoScrollState();
    viewport.addEventListener("scroll", updateAutoScrollState, { passive: true });

    return () => {
      viewport.removeEventListener("scroll", updateAutoScrollState);
    };
  }, []);

  useEffect(() => {
    if (!shouldAutoScrollRef.current && conversationSignature) return;

    messagesEndRef.current?.scrollIntoView({
      behavior: messages.length > 0 ? "smooth" : "auto",
      block: "end",
    });
  }, [conversationSignature, messages.length, pending]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "0px";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 500)}px`;
  }, [question]);

  const canSend = question.trim().length > 0;

  async function handleSubmitQuestion() {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) return;

    shouldAutoScrollRef.current = true;
    setQuestion("");
    await askTutor(trimmedQuestion);
  }

  function handleSuggestionClick(suggestion: TutorSuggestion) {
    if (pending) return;

    shouldAutoScrollRef.current = true;

    if (suggestion.intent === "next_step" && nextStep?.id) {
      void progressToNextStep(suggestion.label, () => {
        onSelectStep(nextStep.id);
      });
      return;
    }

    void triggerSuggestedPrompt(suggestion.label);
  }

  function renderTutorMessage(message: (typeof messages)[number], showSuggestions: boolean) {
    const suggestions =
      showSuggestions &&
      message.id === latestAssistantMessageId &&
      message.suggestions?.length
        ? message.suggestions
        : [];
    const isSuccessMessage = message.evaluation === "correct";
    const isQuizQuestionMessage =
      message.kind === "quiz_question" && message.quizQuestion;

    if (isQuizQuestionMessage) {
      const quizQuestion = message.quizQuestion!;
      const isActiveQuizQuestion =
        showSuggestions && message.id === activeQuizMessageId;
      const quizSuggestions =
        isActiveQuizQuestion && message.suggestions?.length
          ? message.suggestions
          : [];

      return (
        <div key={message.id} className="flex items-start gap-2.5">
          <div className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#5D56C8]/35 bg-[#302F45] text-[#938CFF] shadow-[0_10px_24px_rgba(93,86,200,0.18)]">
            <Sparkles className="h-4 w-4" />
          </div>

          <div className="min-w-0 max-w-[min(100%,44rem)] rounded-[1.45rem] rounded-tl-md border border-white/8 bg-[#2E2F34] px-4 py-3.5 shadow-[0_18px_34px_rgba(0,0,0,0.14)]">
            <div className="flex items-center gap-2">
              <span className="text-[0.74rem] font-medium uppercase tracking-[0.16em] text-[#9A94FF]">
                Hummind AI
              </span>
              <span className="rounded-full border border-white/10 bg-white/6 px-2 py-0.5 text-[0.66rem] tracking-[0.08em] text-white/55">
                Question {(message.quizCursor ?? 0) + 1}/{message.quizTotal ?? 1}
              </span>
            </div>

            <p className="mt-3 text-[1rem] font-semibold leading-7 text-white/96">
              {quizQuestion.question}
            </p>

            <div className="mt-4 space-y-2.5">
              {quizQuestion.choices.map((choice, choiceIndex) => {
                const selected =
                  isActiveQuizQuestion && lastQuizChoiceIndex === choiceIndex;
                const wrongSelected =
                  isActiveQuizQuestion && selected && lastQuizEvaluation === false;

                return (
                  <button
                    key={`${message.id}-choice-${choiceIndex}`}
                    type="button"
                    onClick={() => {
                      if (isActiveQuizQuestion) {
                        void answerQuiz(choiceIndex, () => {
                          if (nextStep?.id) {
                            onSelectStep(nextStep.id);
                          }
                        });
                      }
                    }}
                    disabled={!isActiveQuizQuestion || pending}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-[1rem] border px-3.5 py-3 text-left transition",
                      wrongSelected
                        ? "border-[#E25A5D]/30 bg-[#E25A5D]/10 text-white"
                        : "border-white/10 bg-white/[0.03] text-white/88",
                      !isActiveQuizQuestion || pending
                        ? "cursor-not-allowed opacity-70"
                        : "hover:bg-white/[0.06]",
                    )}
                  >
                    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-[0.74rem] font-semibold text-white/85">
                      {getQuizChoiceLabel(choiceIndex)}
                    </span>
                    <span className="flex-1 text-[0.92rem] leading-6">{choice}</span>
                  </button>
                );
              })}
            </div>

            {quizSuggestions.length > 0 ? (
              <div className="mt-4 space-y-2 border-t border-white/8 pt-3.5">
                {quizSuggestions.map((suggestion, suggestionIndex) => (
                  <button
                    key={`${message.id}-quiz-suggestion-${suggestionIndex}`}
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      handleSuggestionClick(suggestion);
                    }}
                    className="w-full rounded-[1rem] border border-white/8 bg-white/[0.03] px-3.5 py-2.5 text-left text-white/82 transition hover:border-white/12 hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <div className="flex items-start gap-2.5">
                      <CornerDownRight className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <p className="min-w-0 text-[0.92rem] font-medium leading-6">
                        {suggestion.label}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      );
    }

    return (
      <div key={message.id} className="flex items-start gap-2.5">
        <div className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#5D56C8]/35 bg-[#302F45] text-[#938CFF] shadow-[0_10px_24px_rgba(93,86,200,0.18)]">
          <Sparkles className="h-4 w-4" />
        </div>

        <div
          className={cn(
            "min-w-0 max-w-[min(100%,44rem)] rounded-[1.45rem] rounded-tl-md border px-4 py-3.5 shadow-[0_18px_34px_rgba(0,0,0,0.14)]",
            isSuccessMessage
              ? "border-[#0B8A68]/35 bg-[#0B8A68]/10"
              : "border-white/8 bg-[#2E2F34]",
          )}
        >
          <div className="flex items-center gap-2">
            <span className="text-[0.74rem] font-medium uppercase tracking-[0.16em] text-[#9A94FF]">
              Hummind AI
            </span>
          </div>

          {message.title && message.title !== "Hummind AI" ? (
            <h2 className="mt-2.5 text-[1rem] font-semibold leading-tight text-white/96 sm:text-[1.2rem]">
              {message.title}
            </h2>
          ) : null}

          <div className="mt-2.5 space-y-3.5 text-[14px] leading-7 text-white/84 sm:text-[0.95rem]">
            {renderRichBlocks(message.id, message.content)}
          </div>

          {suggestions.length > 0 ? (
            <div className="mt-4 space-y-2 border-t border-white/8 pt-3.5">
              {suggestions.map((suggestion, suggestionIndex) => (
                <button
                  key={`${message.id}-suggestion-${suggestionIndex}`}
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    handleSuggestionClick(suggestion);
                  }}
                  className="w-full rounded-[1rem] border border-white/8 bg-white/[0.03] px-3.5 py-2.5 text-left text-white/82 transition hover:border-white/12 hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <div className="flex items-start gap-2.5">
                    <CornerDownRight className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <p className="min-w-0 text-[0.92rem] font-medium leading-6">
                      {suggestion.label}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  function renderUserMessage(message: (typeof messages)[number]) {
    return (
      <div
        key={message.id}
        className="ml-auto flex w-full max-w-[min(100%,40rem)] items-end justify-end gap-2.5 pl-8 sm:pl-12"
      >
        <div className="rounded-[1.45rem] rounded-br-md border border-white/6 bg-background px-3.5 py-3 text-[14px] leading-7 text-white/94 shadow-[0_16px_34px_rgba(0,0,0,0.16)]">
          {message.content.map((paragraph, paragraphIndex) => (
            <p
              key={`${message.id}-user-${paragraphIndex}`}
              className="whitespace-pre-wrap"
            >
              {paragraph}
            </p>
          ))}
        </div>

        <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0D8E69] text-[0.78rem] font-semibold tracking-[0.08em] text-white shadow-[0_10px_24px_rgba(13,142,105,0.26)]">
          {userInitials}
        </div>
      </div>
    );
  }

  function renderPendingMessage(label: string) {
    return (
      <div className="flex items-start gap-2.5">
        <div className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#5D56C8]/35 bg-[#302F45] text-[#938CFF] shadow-[0_10px_24px_rgba(93,86,200,0.18)]">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>

        <div className="min-w-0 max-w-[min(100%,38rem)] rounded-[1.45rem] rounded-tl-md border border-white/8 bg-[#2E2F34] px-4 py-3 shadow-[0_18px_34px_rgba(0,0,0,0.14)]">
          <div className="flex items-center gap-2">
            <span className="text-[0.74rem] font-medium uppercase tracking-[0.16em] text-[#9A94FF]">
              Hummind AI
            </span>
          </div>

          <div className="mt-2.5 flex items-center gap-3 text-[0.92rem] text-white/76">
            <span>{label}</span>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-white/45 animate-pulse" />
              <span
                className="h-1.5 w-1.5 rounded-full bg-white/45 animate-pulse"
                style={{ animationDelay: "120ms" }}
              />
              <span
                className="h-1.5 w-1.5 rounded-full bg-white/45 animate-pulse"
                style={{ animationDelay: "240ms" }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <section
        ref={scrollViewportRef}
        className="hummind-scrollbar min-h-0 flex-1 overflow-y-auto"
      >
        <div className="mx-auto w-full max-w-5xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="mx-auto flex w-full max-w-4xl flex-col">
            <div className="space-y-4 pb-6 pt-1">
              {error ? (
                <div className="rounded-[1.15rem] border border-[#A06A16]/25 bg-[#A06A16]/10 px-4 py-3 text-[0.9rem] leading-6 text-[#F8DCA6]">
                  Le tuteur a rencontre un souci temporaire. Tu peux continuer le cours ou reposer ta question.
                </div>
              ) : null}

              <div className="space-y-4">
                {visibleModuleSteps.map((moduleStep) => {
                  const isCurrentStep = moduleStep.id === step.id;
                  const stepMessages = stepMessagesById[moduleStep.id] ?? [];
                  const introTutorMessage =
                    stepMessages[0]?.role === "assistant" ? stepMessages[0] : null;
                  const conversationMessages =
                    introTutorMessage ? stepMessages.slice(1) : stepMessages;
                  const stepSuggestions =
                    isCurrentStep && introTutorMessage?.suggestions?.length
                      ? introTutorMessage.suggestions
                      : [];
                  const resolvedStepIndex = stepIndexById.get(moduleStep.id) ?? stepIndex;
                  const showsEmbeddedSystemCard = moduleStep.kind !== "quiz";
                  const hasIntroContent = Boolean(introTutorMessage?.content.length);
                  const hasStepSuggestions = stepSuggestions.length > 0;
                  const shouldRenderStepBubble =
                    showsEmbeddedSystemCard || hasIntroContent || hasStepSuggestions;

                  return (
                    <div key={`step-thread-${moduleStep.id}`} className="space-y-4">
                      {shouldRenderStepBubble ? (
                        <div className="flex items-start gap-2.5">
                          <div className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#5D56C8]/35 bg-[#302F45] text-[#938CFF] shadow-[0_10px_24px_rgba(93,86,200,0.18)]">
                            <Sparkles className="h-4 w-4" />
                          </div>

                          <div className="min-w-0 max-w-[min(100%,44rem)] rounded-[1.45rem] rounded-tl-md border border-white/8 bg-[#2E2F34] px-4 py-3.5 shadow-[0_18px_34px_rgba(0,0,0,0.14)]">
                            <div className="flex items-center gap-2">
                              <span className="text-[0.74rem] font-medium uppercase tracking-[0.16em] text-[#9A94FF]">
                                Hummind AI
                              </span>
                            </div>

                            {moduleStep.kind === "lesson" ? (
                              <div className="mt-2.5">
                                <LessonSystemCard
                                  step={moduleStep}
                                  stepIndex={resolvedStepIndex}
                                  stepTotal={stepTotal}
                                  embedded
                                />
                              </div>
                            ) : null}

                            {moduleStep.kind === "exercise" ? (
                              <div className="mt-2.5">
                                <ExerciseSystemCard
                                  step={moduleStep}
                                  stepIndex={resolvedStepIndex}
                                  stepTotal={stepTotal}
                                  exerciseDraft={isCurrentStep ? exerciseDraft : ""}
                                  exerciseEvaluation={
                                    isCurrentStep ? exerciseEvaluation : "none"
                                  }
                                  pending={isCurrentStep ? pending : false}
                                  onDraftChange={updateExerciseDraft}
                                  onSubmit={() => {
                                    if (isCurrentStep) {
                                      void submitExerciseAnswer();
                                    }
                                  }}
                                  readOnly={!isCurrentStep}
                                  embedded
                                />
                              </div>
                            ) : null}

                            {hasIntroContent ? (
                              <div
                                className={cn(
                                  showsEmbeddedSystemCard
                                    ? "mt-4 border-t border-white/8 pt-3.5"
                                    : "mt-2.5",
                                )}
                              >
                                <div className="space-y-3.5 text-[14px] leading-7 text-white/84 sm:text-[0.95rem]">
                                  {renderRichBlocks(
                                    `${introTutorMessage!.id}-intro`,
                                    introTutorMessage!.content,
                                  )}
                                </div>
                              </div>
                            ) : null}

                            {hasStepSuggestions ? (
                              <div
                                className={cn(
                                  "space-y-2",
                                  showsEmbeddedSystemCard || hasIntroContent
                                    ? "mt-4 border-t border-white/8 pt-3.5"
                                    : "mt-2.5",
                                )}
                              >
                                {stepSuggestions.map((suggestion, suggestionIndex) => (
                                  <button
                                    key={`${moduleStep.id}-suggestion-${suggestionIndex}`}
                                    type="button"
                                    disabled={pending}
                                    onClick={() => {
                                      handleSuggestionClick(suggestion);
                                    }}
                                    className="w-full rounded-[1rem] border border-white/8 bg-white/[0.03] px-3.5 py-2.5 text-left text-white/82 transition hover:border-white/12 hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    <div className="flex items-start gap-2.5">
                                      <CornerDownRight className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                      <p className="min-w-0 text-[0.92rem] font-medium leading-6">
                                        {suggestion.label}
                                      </p>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      ) : null}

                      {conversationMessages.map((message) =>
                        message.role === "assistant"
                          ? renderTutorMessage(message, isCurrentStep)
                          : renderUserMessage(message),
                      )}

                      {isCurrentStep && pending && pendingLabel
                        ? renderPendingMessage(pendingLabel)
                        : null}
                    </div>
                  );
                })}

                <div ref={messagesEndRef} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="shrink-0 border-t border-white/6 bg-[#262628]/96 backdrop-blur">
        <div className="mx-auto w-full max-w-5xl px-4 py-2.5 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-4xl rounded-[1rem] border border-white/10 bg-background px-3.5 py-2.5 shadow-[0_20px_45px_rgba(0,0,0,0.16)] sm:px-4 sm:py-2.5">
            <div className="flex items-start pt-0.5 pb-1">
              <textarea
                ref={textareaRef}
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void handleSubmitQuestion();
                  }
                }}
                placeholder="Poser une question"
                rows={2}
                className="min-h-7 max-h-[500px] flex-1 resize-none overflow-y-auto bg-transparent text-[14px] leading-5 text-white outline-none placeholder:text-[14px] placeholder:text-white/30"
              />
            </div>

            <div className="mt-1 flex items-center justify-between gap-3">
              <button
                type="button"
                aria-label="Ajouter"
                className="inline-flex h-6 w-6 items-center justify-center rounded-full text-white/55 transition hover:bg-white/6 hover:text-white/82"
              >
                <Plus className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  aria-label="Micro"
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full text-white/55 transition hover:bg-white/6 hover:text-white/82"
                >
                  <Mic className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  aria-label="Envoyer"
                  onClick={() => {
                    void handleSubmitQuestion();
                  }}
                  disabled={!canSend || pending}
                  className={cn(
                    "inline-flex h-8 w-8 items-center justify-center rounded-full transition",
                    canSend && !pending
                      ? "bg-[#868688] text-[#232325] hover:bg-[#A1A1A3]"
                      : "bg-white/12 text-white/30",
                  )}
                >
                  {pending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowUp className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
