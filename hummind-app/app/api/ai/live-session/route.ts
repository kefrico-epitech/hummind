import { NextResponse } from "next/server";
import { openai } from "../../../../src/lib/openai";
import { requireAuth } from "../../../../src/lib/server/requireAuth";
import {
  BLOCK_TYPE_TOOL_MAP,
  LEARNING_TOOL_IDS,
  TOOL_KEYWORDS,
  TOOL_LABELS,
  TOOL_REASONS,
  turnSchema,
  type LearningToolId,
  type LearnerSession,
  type LiveAction,
  type LiveAnswerContext,
  type LiveAnswerPayload,
  type LiveBody,
  type LiveCourseContext,
  type LiveCoursePayload,
  type LiveLearnerPayload,
  type LiveLesson,
  type LiveLessonPayload,
  type LiveTurn,
  type OpenAiErrorLike,
  type QuizQuestion,
  type ToolPriority,
  type ToolSuggestion,
  type TurnButtonAction,
  type UsageSummary,
} from "./types";

export const runtime = "nodejs";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asTrimmed(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function isModelNotFoundError(error: unknown): boolean {
  const err = (error ?? {}) as OpenAiErrorLike;
  const status = Number(err.status);
  const code = asTrimmed(err.code) || asTrimmed(err.error?.code);
  const message = asTrimmed(err.message) || asTrimmed(err.error?.message);

  if (code.toLowerCase() === "model_not_found") return true;
  if (status === 400 && /does not exist|model|not found/i.test(message)) return true;
  return false;
}

function resolveLiveModelCandidates(): string[] {
  return uniqueStrings([
    asTrimmed(process.env.OPENAI_LIVE_MODEL),
    asTrimmed(process.env.OPENAI_COURSE_MODEL),
    asTrimmed(process.env.OPENAI_MODEL),
    "gpt-5.2",
  ]);
}

function toNumber(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => asTrimmed(item))
    .filter(Boolean);
}

function toIntegerArray(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => Number(item))
    .filter((n) => Number.isInteger(n) && n >= 0)
    .map((n) => Math.floor(n));
}

function toBlockTypeArray(value: unknown): string[] {
  return uniqueStrings(
    toStringArray(value)
      .map((item) => item.toLowerCase())
      .filter(Boolean),
  );
}

function normalizeLearningToolId(value: unknown): LearningToolId | null {
  const rawUpper = asTrimmed(value).toUpperCase();
  if ((LEARNING_TOOL_IDS as readonly string[]).includes(rawUpper)) {
    return rawUpper as LearningToolId;
  }

  const raw = asTrimmed(value).toLowerCase();
  if (!raw) return null;
  if (raw.includes("graph") || raw.includes("courbe") || raw.includes("chart")) return "GRAPH";
  if (raw.includes("math") || raw.includes("equat") || raw.includes("latex")) return "MATH";
  if (raw.includes("table")) return "TABLE";
  if (raw.includes("code") || raw.includes("algo") || raw.includes("script")) return "CODE";
  if (raw.includes("draw") || raw.includes("dessin") || raw.includes("schema")) return "DRAWING";
  if (raw.includes("image") || raw.includes("photo") || raw.includes("visuel")) return "IMAGE";
  if (raw.includes("text") || raw.includes("texte")) return "TEXT";
  return null;
}

function normalizeToolPriority(value: unknown): ToolPriority {
  const raw = asTrimmed(value).toLowerCase();
  if (raw === "high" || raw === "medium" || raw === "low") return raw;
  return "medium";
}

function toLearningToolIdArray(value: unknown): LearningToolId[] {
  if (!Array.isArray(value)) return [];
  const ids = value
    .map((item) => normalizeLearningToolId(item))
    .filter((item): item is LearningToolId => item !== null);
  return uniqueStrings(ids) as LearningToolId[];
}

function blockTypeToToolIds(blockType: string): LearningToolId[] {
  const direct = BLOCK_TYPE_TOOL_MAP[blockType.toLowerCase()];
  if (direct?.length) return direct;

  const fromToolName = normalizeLearningToolId(blockType);
  return fromToolName ? [fromToolName] : [];
}

function getLessonAvailableTools(lesson: LiveLesson): LearningToolId[] {
  const fromModuleInventory = lesson.moduleToolInventory.flatMap((entry) =>
    blockTypeToToolIds(entry.toLowerCase()),
  );
  const fromBlockTypes = lesson.blockTypes.flatMap((entry) =>
    blockTypeToToolIds(entry.toLowerCase()),
  );

  return uniqueStrings(["TEXT", ...fromModuleInventory, ...fromBlockTypes]) as LearningToolId[];
}

function normalizeToolSuggestions(value: unknown): ToolSuggestion[] {
  if (!Array.isArray(value)) return [];

  const suggestions: ToolSuggestion[] = [];
  for (const item of value) {
    const record = asRecord(item);
    if (!record) continue;

    const id = normalizeLearningToolId(record.id);
    if (!id) continue;

    suggestions.push({
      id,
      label: asTrimmed(record.label) || TOOL_LABELS[id],
      reason: asTrimmed(record.reason) || TOOL_REASONS[id],
      priority: normalizeToolPriority(record.priority),
    });
  }

  const deduped = new Map<LearningToolId, ToolSuggestion>();
  for (const suggestion of suggestions) {
    if (!deduped.has(suggestion.id)) deduped.set(suggestion.id, suggestion);
  }

  return [...deduped.values()];
}

function normalizeAction(value: unknown): LiveAction {
  const v = asTrimmed(value).toUpperCase();
  if (v === "NEXT" || v === "REEXPLAIN" || v === "QUIZ" || v === "ANSWER") {
    return v;
  }
  return "START";
}

function normalizeCourse(raw: unknown): LiveCourseContext {
  const course = (asRecord(raw) ?? {}) as LiveCoursePayload;
  return {
    id: asTrimmed(course.id) || "course",
    title: asTrimmed(course.title) || "Cours",
    description: asTrimmed(course.description),
    domain: asTrimmed(course.domain),
    level: asTrimmed(course.level),
    objectives: toStringArray(course.objectives),
  };
}

function isValidQuizQuestion(quiz: QuizQuestion | null): quiz is QuizQuestion {
  if (!quiz) return false;
  const question = asTrimmed(quiz.question);
  const choices = toStringArray(quiz.choices);
  if (!question || choices.length < 2) return false;

  const correctIndexes = toIntegerArray(quiz.correctIndexes).filter(
    (index) => index < choices.length,
  );
  return correctIndexes.length > 0;
}

function normalizeQuiz(raw: unknown): QuizQuestion | null {
  const quiz = asRecord(raw);
  if (!quiz) return null;

  const question = asTrimmed(quiz.question);
  const choices = toStringArray(quiz.choices);
  const correctIndexes = toIntegerArray(quiz.correctIndexes).filter(
    (index) => index < choices.length,
  );

  const normalized: QuizQuestion = {
    question,
    choices,
    correctIndexes,
    explanation: asTrimmed(quiz.explanation),
  };
  return isValidQuizQuestion(normalized) ? normalized : null;
}

function normalizeLesson(raw: unknown): LiveLesson {
  const lesson = (asRecord(raw) ?? {}) as LiveLessonPayload;
  const sourceLines = toStringArray(lesson.sourceLines);
  const paragraphs = sourceLines.length > 0 ? sourceLines : toStringArray(lesson.paragraphs);
  const contextLines = toStringArray(lesson.contextLines);
  const quiz = normalizeQuiz(lesson.quiz);
  const rawQuizTotal = Math.max(0, Math.floor(toNumber(lesson.quizTotal, 0)));
  const quizTotal = rawQuizTotal > 0 ? rawQuizTotal : quiz ? 1 : 0;
  const rawQuizPosition = Math.max(0, Math.floor(toNumber(lesson.quizPosition, 0)));
  const quizPosition = quizTotal > 0 ? clamp(rawQuizPosition || 1, 1, quizTotal + 1) : 0;
  const kindRaw = asTrimmed(lesson.kind).toLowerCase();
  const kind: LiveLesson["kind"] =
    kindRaw === "quiz" || kindRaw === "exercise" ? kindRaw : "lesson";
  const exercisePrompt = asTrimmed(lesson.exercisePrompt);
  const exerciseSolution = asTrimmed(lesson.exerciseSolution);

  return {
    id: asTrimmed(lesson.id) || "lesson",
    moduleId: asTrimmed(lesson.moduleId) || "module",
    moduleTitle: asTrimmed(lesson.moduleTitle) || "Module",
    kind,
    title: asTrimmed(lesson.title) || "Section du cours",
    paragraphs:
      paragraphs.length > 0
        ? paragraphs.slice(0, 24)
        : exercisePrompt
          ? [exercisePrompt]
          : ["Aucun contenu detaille fourni pour cette section."],
    contextLines:
      contextLines.length > 0
        ? contextLines.slice(0, 24)
        : paragraphs.length > 0
          ? paragraphs.slice(0, 24)
          : exercisePrompt
            ? [exercisePrompt]
            : [],
    quiz,
    quizPosition,
    quizTotal,
    exercisePrompt,
    exerciseSolution,
    allowImageUpload: Boolean(lesson.allowImageUpload),
    blockTypes: toBlockTypeArray(lesson.blockTypes),
    moduleToolInventory: toBlockTypeArray(lesson.moduleToolInventory),
    index: Math.max(0, Math.floor(toNumber(lesson.index, 0))),
    total: Math.max(1, Math.floor(toNumber(lesson.total, 1))),
  };
}

function normalizeLearner(raw: unknown): LearnerSession {
  const learner = (asRecord(raw) ?? {}) as LiveLearnerPayload;
  return {
    score: Math.max(0, Math.floor(toNumber(learner.score, 0))),
    streak: Math.max(0, Math.floor(toNumber(learner.streak, 0))),
    mastery: Math.min(1, Math.max(0, toNumber(learner.mastery, 0))),
    quizMistakesOnLesson: Math.max(
      0,
      Math.floor(toNumber(learner.quizMistakesOnLesson, 0)),
    ),
  };
}

function normalizeAnswer(raw: unknown): number | null {
  const answer = (asRecord(raw) ?? {}) as LiveAnswerPayload;
  const value = Number(answer.choiceIndex);
  return Number.isInteger(value) && value >= 0 ? value : null;
}

function normalizeAnswerContext(raw: unknown): LiveAnswerContext {
  const answer = (asRecord(raw) ?? {}) as LiveAnswerPayload;
  return {
    choiceIndex: normalizeAnswer(raw),
    text: asTrimmed(answer.text),
    creationTool: asTrimmed(answer.creationTool),
    creationArtifact: asTrimmed(answer.creationArtifact),
    quizQuestion: asTrimmed(answer.quizQuestion),
    quizChoices: toStringArray(answer.quizChoices),
    quizCorrectIndexes: toIntegerArray(answer.quizCorrectIndexes),
  };
}

function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeComparable(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function evaluateTextAgainstQuiz(answerText: string, quiz: QuizQuestion): boolean | null {
  const normalizedAnswer = normalizeComparable(answerText);
  if (!normalizedAnswer) return null;

  if (quiz.correctIndexes.length === 1) {
    const onlyCorrect = quiz.correctIndexes[0] ?? 0;
    const alpha = String.fromCharCode(97 + onlyCorrect);
    if (normalizedAnswer === alpha || normalizedAnswer === String(onlyCorrect + 1)) {
      return true;
    }
  }

  const matchingChoiceIndex = quiz.choices.findIndex((choice) => {
    const normalizedChoice = normalizeComparable(choice);
    return (
      normalizedChoice !== "" &&
      (normalizedAnswer === normalizedChoice ||
        normalizedAnswer.includes(normalizedChoice) ||
        normalizedChoice.includes(normalizedAnswer))
    );
  });

  if (matchingChoiceIndex >= 0) {
    return quiz.correctIndexes.includes(matchingChoiceIndex);
  }

  const normalizedCorrectChoices = quiz.correctIndexes
    .map((idx) => normalizeComparable(quiz.choices[idx] || ""))
    .filter(Boolean);

  if (
    normalizedCorrectChoices.some(
      (choice) =>
        normalizedAnswer === choice ||
        normalizedAnswer.includes(choice) ||
        choice.includes(normalizedAnswer),
    )
  ) {
    return true;
  }

  return false;
}

function evaluateExerciseAgainstSolution(
  answerText: string,
  creationArtifact: string,
  lesson: LiveLesson,
): boolean | null {
  const trimmed = answerText.trim();
  const artifact = creationArtifact.trim();
  const combined = `${trimmed}\n${artifact}`.trim();
  if (!combined) return null;

  const solution = normalizeComparable(lesson.exerciseSolution);
  if (!solution) {
    return isPlausibleExerciseAnswer(answerText, creationArtifact);
  }

  const answerTokens = normalizeComparable(combined)
    .split(" ")
    .filter((token) => token.length >= 3);
  const solutionTokens = solution
    .split(" ")
    .filter((token) => token.length >= 3);

  if (!solutionTokens.length) {
    return isPlausibleExerciseAnswer(answerText, creationArtifact);
  }

  const uniqueSolutionTokens = [...new Set(solutionTokens)].slice(0, 8);
  const overlap = uniqueSolutionTokens.filter((token) => answerTokens.includes(token)).length;
  const ratio = overlap / uniqueSolutionTokens.length;

  if (ratio >= 0.45) return true;
  if (ratio <= 0.1 && answerTokens.length >= 3) return false;
  return isPlausibleExerciseAnswer(answerText, creationArtifact);
}

function isPlausibleExerciseAnswer(answerText: string, creationArtifact: string): boolean {
  const trimmed = answerText.trim();
  const artifact = creationArtifact.trim();
  const combined = `${trimmed}\n${artifact}`.trim();
  if (!combined) return false;

  if (!trimmed && artifact.length >= 8) return true;
  if (!trimmed) return false;

  // Accept concise symbolic answers for math/science exercises.
  if (
    trimmed.length <= 24 &&
    /^[0-9A-Za-z+\-*/^().=,<>\s]+$/.test(trimmed) &&
    /[0-9A-Za-z]/.test(trimmed)
  ) {
    return true;
  }

  const words = normalizeComparable(trimmed)
    .split(" ")
    .filter(Boolean);
  return words.length >= 2 || trimmed.length >= 8;
}

function normalizeTurnButtonAction(value: unknown): TurnButtonAction | null {
  const raw = asTrimmed(value).toUpperCase();
  if (raw === "NEXT" || raw === "QUIZ" || raw === "REEXPLAIN") {
    return raw;
  }
  return null;
}

function inferPrimaryButtonAction(
  nextAction: LiveTurn["nextAction"],
): TurnButtonAction {
  if (nextAction === "quiz" || nextAction === "practice") return "QUIZ";
  if (nextAction === "review") return "REEXPLAIN";
  return "NEXT";
}

function parseModelJson(text: string): Record<string, unknown> {
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
    }
    throw new Error("Reponse IA non-JSON exploitable");
  }
}

function toTeachingLines(paragraphs: string[]): string[] {
  const lines: string[] = [];
  for (const paragraph of paragraphs) {
    const cleaned = asTrimmed(paragraph);
    if (!cleaned) continue;

    const parts = cleaned
      .replace(/\r\n/g, "\n")
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (parts.length > 1) {
      lines.push(...parts);
      continue;
    }

    const sentences = cleaned
      .split(/(?<=[.!?])\s+/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (sentences.length > 1) {
      lines.push(...sentences);
      continue;
    }

    lines.push(cleaned);
  }
  return lines.slice(0, 18);
}

function buildLessonSourceScript(lesson: LiveLesson): string {
  const baseLines =
    lesson.kind === "lesson"
      ? lesson.paragraphs
      : lesson.contextLines.length > 0
        ? lesson.contextLines
        : lesson.paragraphs;
  const lines = toTeachingLines(baseLines);
  if (!lines.length) return "1) Aucun contenu detaille disponible.";
  return lines.map((line, index) => `${index + 1}) ${line}`).join("\n");
}

function buildSystemPrompt(): string {
  return `
Tu es un repetiteur IA doux, clair et tres pedagogique.
Objectif principal: dispenser fidelement le cours du professeur, sans inventer.

Contraintes non-negociables:
- Base-toi UNIQUEMENT sur course/step fournis.
- L'ordre du document est decide par le moteur, jamais par toi.
- Respecte la structure et les notions dans l'ordre.
- Si step.kind=lesson: explique fidelement le contenu source, sans ajouter de notion externe.
- Si step.kind=quiz: pose la question courante exactement, sans transformer le quiz en mini-cours.
- Si step.kind=exercise: accompagne la consigne de l'exercice sans la transformer en quiz.
- Si action=ANSWER: corrige avec bienveillance; en cas d'erreur, reformule simplement.
- Apres 2 echecs sur un quiz, autorise une remediation alternative courte (autre angle),
  puis continue le deroule sans bloquer l'apprenant.
- Ne dis jamais de texte technique interne (ex: evaluationResult, null, JSON, variable).

Style attendu:
- Ton rassurant, simple, humain.
- Message concret, lignes courtes.
- Une idee par ligne.
- Pas de blabla, pas de jargon inutile.
- Un seul objectif clair par etape.

Quiz et exercices:
- Les quiz testent les notions enseignees juste avant dans context_script.
- Si step.kind=exercise, demande une reponse redigee courte et exploitable.
- Si allowImageUpload=true, tu peux mentionner qu'une image peut etre jointe en appui.
- suggestedTools: max 4 outils pertinents.
- requiredTools: [] ou une liste courte vraiment indispensable.

Retourne UNIQUEMENT un JSON conforme au schema.
`.trim();
}

function buildUserPrompt(args: {
  action: LiveAction;
  language: string;
  course: LiveCourseContext;
  lesson: LiveLesson;
  learner: LearnerSession;
  answerIndex: number | null;
  answerText: string;
  creationTool: string;
  creationArtifact: string;
  evaluationResult: boolean | null;
}): string {
  const availableTools = getLessonAvailableTools(args.lesson);
  const lessonSourceScript = buildLessonSourceScript(args.lesson);
  const contextScript = toTeachingLines(args.lesson.contextLines)
    .map((line, index) => `${index + 1}) ${line}`)
    .join("\n");
  const quizProgress =
    args.lesson.quizTotal > 0
      ? `${args.lesson.quizPosition}/${args.lesson.quizTotal}`
      : "0/0";
  return `
language=${args.language}
action=${args.action}

course:
- title: ${args.course.title}
- description: ${args.course.description || "N/A"}
- domain: ${args.course.domain || "N/A"}
- level: ${args.course.level || "N/A"}
- objectives: ${args.course.objectives.join(" | ") || "N/A"}

step:
- index: ${args.lesson.index + 1}/${args.lesson.total}
- moduleTitle: ${args.lesson.moduleTitle}
- kind: ${args.lesson.kind}
- title: ${args.lesson.title}
- sourceLines: ${JSON.stringify(args.lesson.paragraphs)}
- source_script:
${lessonSourceScript}
- context_script:
${contextScript || "1) Aucun contexte supplementaire."}
- quiz: ${JSON.stringify(args.lesson.quiz)}
- quizProgress: ${quizProgress}
- exercisePrompt: ${args.lesson.exercisePrompt || "N/A"}
- exerciseSolution: ${args.lesson.exerciseSolution || "N/A"}
- allowImageUpload: ${args.lesson.allowImageUpload ? "true" : "false"}
- blockTypes: ${JSON.stringify(args.lesson.blockTypes)}
- moduleToolInventory: ${JSON.stringify(args.lesson.moduleToolInventory)}
- availableTools: ${JSON.stringify(availableTools)}

learner_state:
- score: ${args.learner.score}
- streak: ${args.learner.streak}
- mastery: ${args.learner.mastery.toFixed(2)}
- quizMistakesOnLesson: ${args.learner.quizMistakesOnLesson}
- answerIndex: ${args.answerIndex === null ? "null" : args.answerIndex}
- answerText: ${args.answerText || "null"}
- creationTool: ${args.creationTool || "null"}
- creationArtifact: ${args.creationArtifact || "null"}
- evaluationResult: ${args.evaluationResult === null ? "null" : args.evaluationResult}

Instruction:
- Si step.kind=lesson et action=START: explique fidèlement source_script (pas d'invention) + micro objectif.
- Si step.kind=lesson et action=REEXPLAIN: reexplique de facon plus concrete.
- Si step.kind=quiz: reste sur le quiz courant et appuie-toi sur context_script.
- Si step.kind=exercise: reste sur l'exercice courant et aide l'apprenant a repondre en texte.
- Si action=ANSWER: donne feedback rapide, doux, et etape suivante.
- Si action=NEXT: checkpoint puis indique si on peut avancer sans sauter les notions.
- Donne toujours ctaPrimaryAction et ctaSecondaryAction (ou null pour secondaire).
- Si interactionKind=exercise, propose des outils dans suggestedTools en priorisant availableTools.
`.trim();
}

function sanitizeTurn(raw: Record<string, unknown>, lesson: LiveLesson): LiveTurn {
  const interactionKindRaw = asTrimmed(raw.interactionKind).toLowerCase();
  const interactionKind: LiveTurn["interactionKind"] =
    interactionKindRaw === "quiz" ||
    interactionKindRaw === "exercise" ||
    interactionKindRaw === "checkpoint"
      ? interactionKindRaw
      : "explain";

  const difficultyRaw = asTrimmed(raw.difficulty).toLowerCase();
  const difficulty: LiveTurn["difficulty"] =
    difficultyRaw === "medium" || difficultyRaw === "hard" ? difficultyRaw : "easy";

  const nextActionRaw = asTrimmed(raw.nextAction).toLowerCase();
  const nextAction: LiveTurn["nextAction"] =
    nextActionRaw === "quiz" ||
    nextActionRaw === "practice" ||
    nextActionRaw === "review"
      ? nextActionRaw
      : "continue";

  const rawChoices = Array.isArray(raw.choices) ? raw.choices : null;
  const choices =
    rawChoices && rawChoices.length
      ? rawChoices.map((item) => asTrimmed(item)).filter(Boolean)
      : null;

  const rawCorrectIndexes = Array.isArray(raw.correctIndexes) ? raw.correctIndexes : null;
  const correctIndexes = rawCorrectIndexes
    ? rawCorrectIndexes
        .map((item) => Number(item))
        .filter((item) => Number.isInteger(item) && item >= 0)
        .map((item) => Math.floor(item))
    : null;

  const fallbackMessage = lesson.paragraphs.slice(0, 6).join("\n\n");
  const message = asTrimmed(raw.message) || fallbackMessage || "Continuons ensemble.";

  const quizFromLesson = lesson.quiz;
  const shouldUseLessonQuiz =
    interactionKind === "quiz" &&
    (!!quizFromLesson && (!choices || choices.length < 2 || !asTrimmed(raw.question)));

  const primaryAction =
    normalizeTurnButtonAction(raw.ctaPrimaryAction) ?? inferPrimaryButtonAction(nextAction);
  const secondaryAction = normalizeTurnButtonAction(raw.ctaSecondaryAction);
  const suggestedTools = normalizeToolSuggestions(raw.suggestedTools);
  const requiredTools = toLearningToolIdArray(raw.requiredTools);

  return {
    message,
    microObjective: asTrimmed(raw.microObjective) || lesson.title,
    interactionKind,
    question: shouldUseLessonQuiz
      ? quizFromLesson?.question ?? null
      : asTrimmed(raw.question) || null,
    choices: shouldUseLessonQuiz
      ? quizFromLesson?.choices ?? null
      : choices && choices.length >= 2
        ? choices
        : null,
    correctIndexes: shouldUseLessonQuiz
      ? quizFromLesson?.correctIndexes ?? null
      : correctIndexes && correctIndexes.length
        ? correctIndexes
        : null,
    hint: asTrimmed(raw.hint) || null,
    feedbackCorrect: asTrimmed(raw.feedbackCorrect) || null,
    feedbackWrong: asTrimmed(raw.feedbackWrong) || null,
    ctaPrimary: asTrimmed(raw.ctaPrimary) || "Continuer",
    ctaPrimaryAction: primaryAction,
    ctaSecondary: asTrimmed(raw.ctaSecondary) || null,
    ctaSecondaryAction: secondaryAction,
    nextAction,
    difficulty,
    masteryDelta: clamp(toNumber(raw.masteryDelta, 0), -0.2, 0.2),
    advanceLesson: Boolean(raw.advanceLesson),
    suggestedTools,
    requiredTools,
  };
}

function inferExerciseTooling(args: {
  lesson: LiveLesson;
  turn: LiveTurn;
  selectedTool: LearningToolId | null;
}): { suggestedTools: ToolSuggestion[]; requiredTools: LearningToolId[] } {
  const availableTools = getLessonAvailableTools(args.lesson);
  const context = normalizeComparable(
    [
      args.lesson.title,
      ...args.lesson.paragraphs,
      args.turn.message,
      args.turn.hint || "",
      args.turn.question || "",
    ].join(" "),
  );

  const scores = new Map<LearningToolId, number>();
  for (const toolId of availableTools) {
    let score = toolId === "TEXT" ? 1 : 0;

    const hasBlockSignal = args.lesson.blockTypes.some((blockType) =>
      blockTypeToToolIds(blockType).includes(toolId),
    );
    if (hasBlockSignal) score += 2;

    const hasModuleSignal = args.lesson.moduleToolInventory.some((entry) =>
      blockTypeToToolIds(entry).includes(toolId),
    );
    if (hasModuleSignal) score += 2;

    const keywordHits = TOOL_KEYWORDS[toolId].reduce((total, keyword) => {
      const normalizedKeyword = normalizeComparable(keyword);
      if (!normalizedKeyword) return total;
      return context.includes(normalizedKeyword) ? total + 1 : total;
    }, 0);
    score += Math.min(keywordHits, 3);

    if (args.selectedTool === toolId) score += 3;
    if (args.turn.interactionKind === "exercise" && toolId !== "TEXT") score += 1;

    scores.set(toolId, score);
  }

  if (args.selectedTool && !scores.has(args.selectedTool)) {
    scores.set(args.selectedTool, 4);
  }

  const sorted = [...scores.entries()]
    .filter(([toolId, score]) => score > 0 || toolId === "TEXT")
    .sort((a, b) => b[1] - a[1]);

  const suggestedTools = sorted.slice(0, 4).map(([toolId, score]) => {
    const priority: ToolPriority = score >= 6 ? "high" : score >= 3 ? "medium" : "low";
    return {
      id: toolId,
      label: TOOL_LABELS[toolId],
      reason: TOOL_REASONS[toolId],
      priority,
    };
  });

  if (!suggestedTools.some((tool) => tool.id === "TEXT")) {
    suggestedTools.push({
      id: "TEXT",
      label: TOOL_LABELS.TEXT,
      reason: TOOL_REASONS.TEXT,
      priority: "medium",
    });
  }

  const requiredTools = suggestedTools
    .filter((tool) => tool.priority === "high" && tool.id !== "TEXT")
    .map((tool) => tool.id)
    .slice(0, 1);

  return { suggestedTools, requiredTools };
}

function applyToolingPolicy(args: {
  turn: LiveTurn;
  lesson: LiveLesson;
  answer: LiveAnswerContext;
}): LiveTurn {
  const baseTurn: LiveTurn = {
    ...args.turn,
    suggestedTools: args.turn.suggestedTools ?? [],
    requiredTools: args.turn.requiredTools ?? [],
  };

  if (baseTurn.interactionKind !== "exercise") {
    return {
      ...baseTurn,
      suggestedTools: [],
      requiredTools: [],
    };
  }

  const selectedTool = normalizeLearningToolId(args.answer.creationTool);
  const inferred = inferExerciseTooling({
    lesson: args.lesson,
    turn: baseTurn,
    selectedTool,
  });

  return {
    ...baseTurn,
    suggestedTools: inferred.suggestedTools,
    requiredTools: inferred.requiredTools,
  };
}

function enforceTurnPolicy(args: {
  turn: LiveTurn;
  action: LiveAction;
  evaluationResult: boolean | null;
  lesson: LiveLesson;
  learner: LearnerSession;
}): LiveTurn {
  const { action, evaluationResult, lesson, learner } = args;
  const turn: LiveTurn = { ...args.turn };
  const isQuizStep = lesson.kind === "quiz";
  const isExerciseStep = lesson.kind === "exercise";

  const forceLessonQuiz = () => {
    if (!lesson.quiz) return;
    turn.interactionKind = "quiz";
    turn.question = lesson.quiz.question;
    turn.choices = lesson.quiz.choices;
    turn.correctIndexes = lesson.quiz.correctIndexes;
    turn.hint = turn.hint || null;
  };

  if (action === "START") {
    if (isQuizStep) {
      if (!lesson.quiz) {
        turn.interactionKind = "checkpoint";
        turn.question = null;
        turn.choices = null;
        turn.correctIndexes = null;
        turn.hint = null;
        turn.message = "Quiz invalide ou absent. Cette etape est sautee automatiquement.";
        turn.nextAction = "continue";
        turn.ctaPrimary = "Continuer";
        turn.ctaPrimaryAction = "NEXT";
        turn.ctaSecondary = "Reexpliquer";
        turn.ctaSecondaryAction = "REEXPLAIN";
        turn.advanceLesson = true;
        return turn;
      }

      forceLessonQuiz();
      turn.message =
        asTrimmed(turn.message) ||
        "Prends le temps de choisir la meilleure reponse. On reste sur ce quiz.";
      turn.nextAction = "quiz";
      turn.ctaPrimary = "Reexpliquer";
      turn.ctaPrimaryAction = "REEXPLAIN";
      turn.ctaSecondary = null;
      turn.ctaSecondaryAction = null;
      turn.advanceLesson = false;
      return turn;
    }

    if (isExerciseStep) {
      turn.interactionKind = "exercise";
      turn.question = null;
      turn.choices = null;
      turn.correctIndexes = null;
      turn.hint = "Redige ta reponse en quelques lignes claires.";
      turn.message =
        asTrimmed(turn.message) ||
        (lesson.allowImageUpload
          ? "Lis l'exercice, reponds par ecrit et joins une image si elle aide."
          : "Lis l'exercice et reponds par ecrit.");
      turn.nextAction = "review";
      turn.ctaPrimary = "Valider ma reponse";
      turn.ctaPrimaryAction = "NEXT";
      turn.ctaSecondary = null;
      turn.ctaSecondaryAction = null;
      turn.advanceLesson = false;
      return turn;
    }

    turn.interactionKind = "explain";
    turn.question = null;
    turn.choices = null;
    turn.correctIndexes = null;
    turn.hint = turn.hint || "Lis tranquillement, puis passe a l'etape suivante.";
    turn.nextAction = "continue";
    turn.ctaPrimary = "J'ai compris";
    turn.ctaPrimaryAction = "NEXT";
    turn.ctaSecondary = "Reexpliquer doucement";
    turn.ctaSecondaryAction = "REEXPLAIN";
    turn.advanceLesson = false;
    return turn;
  }

  if (action === "REEXPLAIN") {
    if (isQuizStep) {
      forceLessonQuiz();
      turn.message =
        asTrimmed(turn.message) ||
        "Relis les notions juste avant, puis choisis la reponse la plus precise.";
      turn.nextAction = "quiz";
      turn.ctaPrimary = "Reessayer";
      turn.ctaPrimaryAction = "QUIZ";
      turn.ctaSecondary = null;
      turn.ctaSecondaryAction = null;
      turn.advanceLesson = false;
      return turn;
    }

    if (isExerciseStep) {
      turn.interactionKind = "exercise";
      turn.question = null;
      turn.choices = null;
      turn.correctIndexes = null;
      turn.hint = "Reponds simplement avec l'idee principale puis une justification.";
      turn.nextAction = "review";
      turn.ctaPrimary = "Valider ma reponse";
      turn.ctaPrimaryAction = "NEXT";
      turn.ctaSecondary = null;
      turn.ctaSecondaryAction = null;
      turn.advanceLesson = false;
      return turn;
    }

    turn.advanceLesson = false;
    turn.nextAction = "continue";
    turn.ctaPrimary = "Continuer";
    turn.ctaPrimaryAction = "NEXT";
    if (!turn.ctaSecondary) {
      turn.ctaSecondary = null;
      turn.ctaSecondaryAction = null;
    }
    return turn;
  }

  if (action === "NEXT") {
    if (isQuizStep) {
      forceLessonQuiz();
      turn.advanceLesson = false;
      turn.nextAction = "quiz";
      turn.ctaPrimary = "Reexpliquer";
      turn.ctaPrimaryAction = "REEXPLAIN";
      turn.ctaSecondary = "Reexpliquer";
      turn.ctaSecondaryAction = "REEXPLAIN";
      return turn;
    }

    if (isExerciseStep) {
      turn.interactionKind = "exercise";
      turn.question = null;
      turn.choices = null;
      turn.correctIndexes = null;
      turn.hint = "Commence par une reponse redigee, puis valide.";
      turn.message = "Cet exercice attend encore une reponse de ta part.";
      turn.nextAction = "review";
      turn.ctaPrimary = "Valider ma reponse";
      turn.ctaPrimaryAction = "NEXT";
      turn.ctaSecondary = null;
      turn.ctaSecondaryAction = null;
      turn.advanceLesson = false;
      return turn;
    }

    turn.interactionKind = "checkpoint";
    turn.question = null;
    turn.choices = null;
    turn.correctIndexes = null;
    turn.hint = null;
    turn.nextAction = "continue";
    turn.ctaPrimary = "Continuer";
    turn.ctaPrimaryAction = "NEXT";
    if (!turn.ctaSecondary) {
      turn.ctaSecondary = "Reexplique";
      turn.ctaSecondaryAction = "REEXPLAIN";
    }
    turn.advanceLesson = true;
    return turn;
  }

  if (action === "ANSWER" && evaluationResult === null) {
    if (isQuizStep && lesson.quiz) {
      forceLessonQuiz();
      turn.nextAction = "quiz";
      turn.message = "Je n'ai pas recu une reponse exploitable. Choisis une reponse.";
      turn.ctaPrimary = "Reexplique";
      turn.ctaPrimaryAction = "REEXPLAIN";
      turn.ctaSecondary = null;
      turn.ctaSecondaryAction = null;
      turn.advanceLesson = false;
      return turn;
    }

    turn.interactionKind = "exercise";
    turn.question = null;
    turn.choices = null;
    turn.correctIndexes = null;
    turn.hint = "Donne une reponse en quelques lignes, puis valide.";
    turn.nextAction = "review";
    turn.message =
      "Ecris ta reponse dans la zone de texte pour valider cet exercice.";
    turn.ctaPrimary = "Valider exercice";
    turn.ctaPrimaryAction = "NEXT";
    turn.ctaSecondary = null;
    turn.ctaSecondaryAction = null;
    turn.advanceLesson = false;
    return turn;
  }

  if (action === "ANSWER" && isExerciseStep && evaluationResult === false) {
    turn.interactionKind = "exercise";
    turn.question = null;
    turn.choices = null;
    turn.correctIndexes = null;
    turn.hint = "Ajoute une explication un peu plus complete.";
    turn.nextAction = "review";
    turn.message =
      "Ta reponse est encore trop courte ou trop vague. Reformule en quelques lignes claires.";
    turn.ctaPrimary = "Valider ma reponse";
    turn.ctaPrimaryAction = "NEXT";
    turn.ctaSecondary = null;
    turn.ctaSecondaryAction = null;
    turn.advanceLesson = false;
    return turn;
  }

  if (action === "ANSWER" && evaluationResult === false) {
    if (learner.quizMistakesOnLesson >= 2) {
      turn.message =
        asTrimmed(turn.message) ||
        "Je te donne une reformulation plus simple, puis on avance pour garder le rythme.";
      turn.interactionKind = "checkpoint";
      turn.question = null;
      turn.choices = null;
      turn.correctIndexes = null;
      turn.hint = null;
      turn.feedbackWrong =
        turn.feedbackWrong || "Deux reformulations effectuees, on continue.";
      turn.nextAction = "continue";
      turn.ctaPrimary = "Continuer";
      turn.ctaPrimaryAction = "NEXT";
      turn.ctaSecondary = null;
      turn.ctaSecondaryAction = null;
      turn.advanceLesson = true;
      return turn;
    }

    forceLessonQuiz();
    turn.advanceLesson = false;
    turn.nextAction = "review";
    turn.ctaPrimary = "Reexpliquer";
    turn.ctaPrimaryAction = "REEXPLAIN";
    turn.ctaSecondary = null;
    turn.ctaSecondaryAction = null;
    return turn;
  }

  if (action === "ANSWER" && evaluationResult === true) {
    if (isExerciseStep) {
      turn.interactionKind = "checkpoint";
      turn.question = null;
      turn.choices = null;
      turn.correctIndexes = null;
      turn.hint = null;
      turn.nextAction = "continue";
      turn.ctaPrimary = "Continuer";
      turn.ctaPrimaryAction = "NEXT";
      turn.ctaSecondary = null;
      turn.ctaSecondaryAction = null;
      turn.advanceLesson = true;
      return turn;
    }

    turn.interactionKind = "checkpoint";
    turn.question = null;
    turn.choices = null;
    turn.correctIndexes = null;
    turn.hint = null;
    turn.nextAction = "continue";
    turn.ctaPrimary = "Continuer";
    turn.ctaPrimaryAction = "NEXT";
    turn.advanceLesson = true;
    return turn;
  }

  if (action === "QUIZ") {
    if (!lesson.quiz || !isQuizStep) {
      turn.interactionKind = "checkpoint";
      turn.question = null;
      turn.choices = null;
      turn.correctIndexes = null;
      turn.hint = null;
      turn.message =
        "Quiz invalide ou absent. Cette etape est sautee automatiquement.";
      turn.nextAction = "continue";
      turn.ctaPrimary = "Continuer";
      turn.ctaPrimaryAction = "NEXT";
      turn.ctaSecondary = "Reexplique";
      turn.ctaSecondaryAction = "REEXPLAIN";
      turn.advanceLesson = true;
      return turn;
    }

    forceLessonQuiz();
    turn.advanceLesson = false;
    turn.nextAction = "quiz";
    turn.ctaPrimary = "Reexplique";
    turn.ctaPrimaryAction = "REEXPLAIN";
    turn.ctaSecondary = null;
    turn.ctaSecondaryAction = null;
    return turn;
  }

  if (!turn.ctaPrimaryAction) {
    turn.ctaPrimaryAction = inferPrimaryButtonAction(turn.nextAction);
  }

  if (turn.ctaSecondary && !turn.ctaSecondaryAction) {
    if (turn.ctaPrimaryAction !== "REEXPLAIN") {
      turn.ctaSecondaryAction = "REEXPLAIN";
    } else if (lesson.quiz) {
      turn.ctaSecondaryAction = "QUIZ";
    } else {
      turn.ctaSecondaryAction = "NEXT";
    }
  }

  return turn;
}

function summarizeUsage(usageRaw: unknown): UsageSummary {
  const usage = asRecord(usageRaw) ?? {};
  const inputTokens = Math.max(
    0,
    Number(usage.input_tokens ?? usage.prompt_tokens ?? usage.inputTokens ?? 0),
  );
  const outputTokens = Math.max(
    0,
    Number(
      usage.output_tokens ?? usage.completion_tokens ?? usage.outputTokens ?? 0,
    ),
  );
  const totalTokens = Math.max(
    0,
    Number(usage.total_tokens ?? usage.totalTokens ?? inputTokens + outputTokens),
  );
  const creditsPer1kTokens = Math.max(
    0,
    Number(process.env.OPENAI_CREDITS_PER_1K_TOKENS ?? "1"),
  );
  const consumedCredits = Number(
    ((totalTokens / 1000) * creditsPer1kTokens).toFixed(3),
  );

  return { inputTokens, outputTokens, totalTokens, consumedCredits };
}

export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = (await req.json()) as LiveBody;
    const action = normalizeAction(body.action);
    const language = asTrimmed(body.language) || "fr";
    const course = normalizeCourse(body.course);
    const lesson = normalizeLesson(body.step ?? body.lesson);
    const learner = normalizeLearner(body.learner);
    const answer = normalizeAnswerContext(body.answer);
    const answerIndex = answer.choiceIndex;

    let evaluationResult: boolean | null = null;
    const nextLearner: LearnerSession = { ...learner };

    const answerQuizFallback = normalizeQuiz({
      question: answer.quizQuestion,
      choices: answer.quizChoices,
      correctIndexes: answer.quizCorrectIndexes,
    });
    const quizForEvaluation = lesson.quiz ?? answerQuizFallback;

    if (action === "ANSWER" && lesson.kind === "quiz" && quizForEvaluation) {
      if (answerIndex !== null) {
        evaluationResult = quizForEvaluation.correctIndexes.includes(answerIndex);
      } else if (answer.text) {
        evaluationResult = evaluateTextAgainstQuiz(answer.text, quizForEvaluation);
      }
    } else if (action === "ANSWER" && lesson.kind === "exercise") {
      evaluationResult = evaluateExerciseAgainstSolution(
        answer.text,
        answer.creationArtifact,
        lesson,
      );
    }

    if (action === "ANSWER" && evaluationResult !== null) {
      if (evaluationResult) {
        nextLearner.score += 10;
        nextLearner.streak += 1;
        nextLearner.mastery = clamp(nextLearner.mastery + 0.06);
        nextLearner.quizMistakesOnLesson = 0;
      } else {
        nextLearner.streak = 0;
        nextLearner.mastery = clamp(nextLearner.mastery - 0.04);
        nextLearner.quizMistakesOnLesson = learner.quizMistakesOnLesson + 1;
      }
    }

    const modelCandidates = resolveLiveModelCandidates();
    const aiInput = [
      { role: "system" as const, content: buildSystemPrompt() },
      {
        role: "user" as const,
        content: buildUserPrompt({
          action,
          language,
          course,
          lesson,
          learner: nextLearner,
          answerIndex,
          answerText: answer.text,
          creationTool: answer.creationTool,
          creationArtifact: answer.creationArtifact,
          evaluationResult,
        }),
      },
    ];

    let response: Awaited<ReturnType<typeof openai.responses.create>> | null = null;
    let lastError: unknown = null;

    for (const model of modelCandidates) {
      try {
        response = await openai.responses.create({
          model,
          input: aiInput,
          text: {
            format: {
              type: "json_schema",
              name: "live_turn",
              strict: false,
              schema: turnSchema,
            },
          },
        });
        break;
      } catch (error) {
        lastError = error;
        if (!isModelNotFoundError(error)) {
          throw error;
        }
      }
    }

    if (!response) {
      throw lastError ?? new Error("Aucun modele IA live disponible.");
    }

    const outputText = response.output_text?.trim();
    if (!outputText) {
      return NextResponse.json(
        { error: "Reponse IA vide" },
        { status: 502 },
      );
    }

    const parsed = parseModelJson(outputText);
    const rawTurn = sanitizeTurn(parsed, lesson);
    const policyTurn = enforceTurnPolicy({
      turn: rawTurn,
      action,
      evaluationResult,
      lesson,
      learner,
    });
    const turn = applyToolingPolicy({
      turn: policyTurn,
      lesson,
      answer,
    });
    nextLearner.mastery = clamp(nextLearner.mastery + turn.masteryDelta);

    return NextResponse.json({
      turn,
      session: nextLearner,
      evaluation: {
        correct: evaluationResult,
      },
      usage: summarizeUsage((response as unknown as Record<string, unknown>).usage),
    });
  } catch (err: unknown) {
    console.error("live-session error", err);
    return NextResponse.json(
      {
        error: "Erreur generation live-session",
        details: String(err instanceof Error ? err.message : err),
      },
      { status: 500 },
    );
  }
}

