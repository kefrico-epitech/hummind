"use client";

import React from "react";
import { Check, Plus, Trash2 } from "lucide-react";

type Question = {
  q: string;
  choices: string[];
  answerIndex?: number;
  answerIndexes?: number[];
  multiple?: boolean;
  explanation?: string;
};

type QuizData = {
  questions: Question[];
};

type Props = {
  value: QuizData;
  onChange: (next: QuizData) => void;
};

function getChoiceLabel(index: number) {
  return String.fromCharCode(65 + index);
}

function isCorrectChoice(q: Question, choiceIndex: number): boolean {
  if (q.multiple) return q.answerIndexes?.includes(choiceIndex) ?? false;
  return q.answerIndex === choiceIndex;
}

export function QuizEditor({ value, onChange }: Props) {
  const quiz =
    value && value.questions.length > 0
      ? value
      : { questions: [{ q: "", choices: [""], multiple: false }] };

  const updateQuestion = (index: number, patch: Partial<Question>) => {
    const next = {
      ...quiz,
      questions: quiz.questions.map((q, i) =>
        i === index ? { ...q, ...patch } : q,
      ),
    };
    onChange(next);
  };

  const addQuestion = () => {
    onChange({
      ...quiz,
      questions: [
        ...quiz.questions,
        { q: "", choices: [""], multiple: false },
      ],
    });
  };

  const removeQuestion = (index: number) => {
    const newQuestions = quiz.questions.filter((_, i) => i !== index);
    onChange({
      ...quiz,
      questions:
        newQuestions.length > 0
          ? newQuestions
          : [{ q: "", choices: [""], multiple: false }],
    });
  };

  const removeChoice = (qIdx: number, cIdx: number) => {
    const q = quiz.questions[qIdx];
    const newChoices = q.choices.filter((_, i) => i !== cIdx);
    if (newChoices.length === 0) newChoices.push("");

    // Adjust answer indices after removal
    let newAnswerIndex = q.answerIndex;
    if (typeof newAnswerIndex === "number") {
      if (newAnswerIndex === cIdx) newAnswerIndex = undefined;
      else if (newAnswerIndex > cIdx) newAnswerIndex -= 1;
    }

    let newAnswerIndexes = q.answerIndexes;
    if (newAnswerIndexes) {
      newAnswerIndexes = newAnswerIndexes
        .filter((i) => i !== cIdx)
        .map((i) => (i > cIdx ? i - 1 : i));
    }

    updateQuestion(qIdx, {
      choices: newChoices,
      answerIndex: newAnswerIndex,
      answerIndexes: newAnswerIndexes,
    });
  };

  return (
    <div className="space-y-5">
      {quiz.questions.map((q, idx) => (
        <div
          key={idx}
          className="space-y-3 rounded-xl border border-white/10 bg-black/10 p-4"
        >
          {/* Header: question number + delete */}
          <div className="flex items-center justify-between gap-2">
            <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-white/40">
              Question {idx + 1}
            </span>
            <button
              type="button"
              onClick={() => removeQuestion(idx)}
              className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs text-red-400 transition hover:bg-red-500/10"
            >
              <Trash2 className="h-3 w-3" />
              Supprimer
            </button>
          </div>

          {/* Question text */}
          <input
            type="text"
            value={q.q}
            onChange={(e) => updateQuestion(idx, { q: e.target.value })}
            placeholder="Écrivez la question ici..."
            className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#7C6BF5]/70"
          />

          {/* Toggle simple/multiple */}
          <div className="flex gap-4 text-xs text-white/60">
            <label className="flex cursor-pointer items-center gap-1.5">
              <input
                type="radio"
                checked={!q.multiple}
                onChange={() =>
                  updateQuestion(idx, {
                    multiple: false,
                    answerIndexes: undefined,
                  })
                }
                className="accent-[#7C6BF5]"
              />
              Choix unique
            </label>
            <label className="flex cursor-pointer items-center gap-1.5">
              <input
                type="radio"
                checked={!!q.multiple}
                onChange={() =>
                  updateQuestion(idx, {
                    multiple: true,
                    answerIndex: undefined,
                  })
                }
                className="accent-[#7C6BF5]"
              />
              Choix multiples
            </label>
          </div>

          {/* Choices */}
          <div className="space-y-1.5">
            {q.choices.map((choice, cIdx) => {
              const correct = isCorrectChoice(q, cIdx);
              const isLastEmpty =
                cIdx === q.choices.length - 1 && !choice.trim();

              return (
                <div
                  key={cIdx}
                  className={[
                    "flex items-center gap-2 rounded-lg border px-2 py-1.5 transition",
                    correct
                      ? "border-emerald-500/40 bg-emerald-500/8"
                      : "border-white/8 bg-transparent",
                  ].join(" ")}
                >
                  {/* Choice letter badge */}
                  <span
                    className={[
                      "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                      correct
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-white/8 text-white/50",
                    ].join(" ")}
                  >
                    {correct ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      getChoiceLabel(cIdx)
                    )}
                  </span>

                  {/* Correct answer selector */}
                  {q.multiple ? (
                    <input
                      type="checkbox"
                      checked={correct}
                      onChange={(e) => {
                        const current = q.answerIndexes ?? [];
                        const next = e.target.checked
                          ? [...current, cIdx]
                          : current.filter((i) => i !== cIdx);
                        updateQuestion(idx, { answerIndexes: next });
                      }}
                      className="shrink-0 accent-emerald-500"
                      title="Marquer comme bonne réponse"
                    />
                  ) : (
                    <input
                      type="radio"
                      checked={correct}
                      onChange={() =>
                        updateQuestion(idx, { answerIndex: cIdx })
                      }
                      className="shrink-0 accent-emerald-500"
                      title="Marquer comme bonne réponse"
                    />
                  )}

                  {/* Choice text */}
                  <input
                    type="text"
                    value={choice}
                    onChange={(e) => {
                      const newChoices = [...q.choices];
                      newChoices[cIdx] = e.target.value;
                      if (
                        cIdx === newChoices.length - 1 &&
                        e.target.value.trim() !== ""
                      ) {
                        newChoices.push("");
                      }
                      updateQuestion(idx, { choices: newChoices });
                    }}
                    placeholder={`Choix ${getChoiceLabel(cIdx)}`}
                    className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/20"
                  />

                  {/* Delete choice (not the last empty one) */}
                  {!isLastEmpty && q.choices.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeChoice(idx, cIdx)}
                      className="shrink-0 rounded p-1 text-white/30 transition hover:bg-red-500/10 hover:text-red-400"
                      title="Retirer ce choix"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Explanation */}
          <div>
            <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-white/40">
              Explication pédagogique
            </label>
            <textarea
              value={q.explanation ?? ""}
              onChange={(e) =>
                updateQuestion(idx, { explanation: e.target.value })
              }
              placeholder="Pourquoi cette réponse est correcte ? (obligatoire)"
              rows={2}
              className="w-full resize-none rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-white outline-none placeholder:text-white/20 focus:border-[#7C6BF5]/70"
            />
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addQuestion}
        className="inline-flex items-center gap-1.5 rounded-lg bg-[#7C6BF5]/20 px-4 py-2 text-sm font-medium text-white transition hover:bg-[#7C6BF5]/40"
      >
        <Plus className="h-3.5 w-3.5" />
        Ajouter une question
      </button>
    </div>
  );
}
