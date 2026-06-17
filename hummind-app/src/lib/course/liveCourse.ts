import type { Block, Module } from "../../components/course/types";

export type LiveStepKind = "lesson" | "quiz" | "exercise";

export type LiveQuizQuestion = {
  question: string;
  choices: string[];
  correctIndexes: number[];
  explanation?: string;
};

export type LiveCourseStep = {
  id: string;
  moduleId: string;
  moduleTitle: string;
  title: string;
  kind: LiveStepKind;
  sourceLines: string[];
  contextLines: string[];
  quizQuestions: LiveQuizQuestion[];
  exercisePrompt: string;
  exerciseSolution: string;
  allowImageUpload: boolean;
  blockTypes: string[];
  moduleToolInventory: string[];
};

function asTrimmed(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function truncateText(value: string, limit: number): string {
  if (value.length <= limit) return value;
  return `${value.slice(0, limit - 1).trimEnd()}...`;
}

function formatDisplayLines(text: string): string[] {
  const normalized = text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\u2022\s*/g, "\n- ");

  return normalized
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function normalizeTitleCandidate(value: string): string {
  return value
    .replace(
      /^\s*(?:[-*•]|(?:\d+|[A-Za-z])(?:[.)]|(?:\s*[-:]))|(?:chapitre|section|partie)\s+\d+\s*[:.-]?)\s*/iu,
      "",
    )
    .replace(/\s+/g, " ")
    .replace(/[;:,.!?-]+$/g, "")
    .trim();
}

function isWeakTitleCandidate(
  candidate: string,
  moduleTitle: string,
  sectionTitle: string,
): boolean {
  const normalizedCandidate = candidate.trim().toLowerCase();
  const normalizedModule = moduleTitle.trim().toLowerCase();
  const normalizedSection = sectionTitle.trim().toLowerCase();
  const lettersCount = (candidate.match(/\p{L}/gu) || []).length;

  if (!normalizedCandidate) return true;
  if (lettersCount < 4) return true;
  if (/^(introduction|module|section|partie|contenu|chapitre)$/iu.test(candidate)) {
    return true;
  }

  return (
    normalizedCandidate === normalizedModule ||
    normalizedCandidate === normalizedSection
  );
}

function firstMeaningfulSentence(value: string): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return "";

  const [sentence] = normalized.split(/(?<=[.!?])\s+/);
  return sentence?.trim() || normalized;
}

function pickLessonTitleFromLines(
  lessonLines: string[],
  moduleTitle: string,
  sectionTitle: string,
): string {
  const normalizedCandidates = lessonLines
    .flatMap(formatDisplayLines)
    .map((line) => normalizeTitleCandidate(firstMeaningfulSentence(line)))
    .filter(Boolean);

  const strongCandidate = normalizedCandidates.find(
    (candidate) => !isWeakTitleCandidate(candidate, moduleTitle, sectionTitle),
  );
  if (strongCandidate) {
    return truncateText(strongCandidate, 78);
  }

  const fallbackCandidate = normalizedCandidates.find(
    (candidate) => (candidate.match(/\p{L}/gu) || []).length >= 4,
  );
  if (fallbackCandidate) {
    return truncateText(fallbackCandidate, 78);
  }

  return "";
}

function readExercisePrompt(block: Block): string {
  return (
    asTrimmed((block.data as { exercise?: { statement?: string } } | undefined)?.exercise?.statement) ||
    asTrimmed(block.text) ||
    asTrimmed(block.title)
  );
}

function readExerciseSolution(block: Block): string {
  return asTrimmed(
    (block.data as { exercise?: { solution?: string } } | undefined)?.exercise?.solution,
  );
}

function readBlockParagraph(block: Block): string {
  const primary = asTrimmed(block.text);
  if (primary) return primary;

  if (block.type === "image") {
    const image = (block.data as { image?: { caption?: string; alt?: string } } | undefined)?.image;
    return asTrimmed(image?.caption) || asTrimmed(image?.alt);
  }

  if (block.type === "math") {
    const math = (block.data as { math?: { latex?: string; description?: string } } | undefined)
      ?.math;
    return asTrimmed(math?.description) || (asTrimmed(math?.latex) ? `Formule: ${asTrimmed(math?.latex)}` : "");
  }

  if (block.type === "code") {
    const code = asTrimmed(
      (block.data as { code?: { code?: string } } | undefined)?.code?.code,
    );
    return code;
  }

  if (block.type === "chart") {
    const chart = (block.data as {
      chart?: { title?: string; mode?: string; functionSpec?: { expr?: string } };
    } | undefined)?.chart;
    const title = asTrimmed(chart?.title);
    const expr = asTrimmed(chart?.functionSpec?.expr);
    if (title) return `Graphe: ${title}`;
    if (expr) return `Graphe de fonction: ${expr}`;
  }

  if (block.type === "table") {
    const table = (block.data as { table?: { cols?: { label?: string }[] } } | undefined)?.table;
    const columns =
      Array.isArray(table?.cols) && table?.cols.length > 0
        ? table.cols.map((col) => asTrimmed(col.label)).filter(Boolean).join(", ")
        : "";
    return columns ? `Tableau: ${columns}` : "Tableau de donnees";
  }

  if (block.type === "drawing") {
    return asTrimmed(block.title) || "Schema du cours";
  }

  return "";
}

function readQuizQuestions(block: Block): LiveQuizQuestion[] {
  const quizData = (block.data as { quiz?: { questions?: unknown[] } } | undefined)?.quiz;
  const questions = Array.isArray(quizData?.questions) ? quizData.questions : [];

  const normalized: LiveQuizQuestion[] = [];
  for (const rawQuestion of questions) {
    const questionRecord = rawQuestion as
      | {
          q?: string;
          choices?: unknown[];
          answerIndex?: number;
          answerIndexes?: number[];
          explanation?: string;
        }
      | undefined;
    const question = asTrimmed(questionRecord?.q);
    const choices = Array.isArray(questionRecord?.choices)
      ? questionRecord.choices.map((choice) => asTrimmed(choice)).filter(Boolean)
      : [];

    const fromMany = Array.isArray(questionRecord?.answerIndexes)
      ? questionRecord.answerIndexes.filter((value) => Number.isInteger(value))
      : [];
    const fromOne =
      Number.isInteger(questionRecord?.answerIndex) &&
      questionRecord?.answerIndex !== undefined
        ? [questionRecord.answerIndex]
        : [];
    const correctIndexes = [...new Set([...fromMany, ...fromOne])].filter(
      (value) => value >= 0 && value < choices.length,
    );

    if (!question || choices.length < 2 || correctIndexes.length === 0) {
      continue;
    }

    normalized.push({
      question,
      choices,
      correctIndexes,
      explanation: asTrimmed(questionRecord?.explanation),
    });
  }

  return normalized;
}

function getStepTitle(args: {
  moduleTitle: string;
  sectionTitle: string;
  explicitTitle: string;
  lessonLines?: string[];
  lessonCounter: number;
  kind: LiveStepKind;
}): string {
  const normalizedExplicitTitle = normalizeTitleCandidate(args.explicitTitle);
  if (normalizedExplicitTitle) return normalizedExplicitTitle;

  if (args.kind !== "lesson") {
    if (args.sectionTitle && args.sectionTitle !== args.moduleTitle) {
      return args.sectionTitle;
    }
    return args.kind === "quiz" ? "Quiz du module" : "Exercice du module";
  }

  const lessonTitle = pickLessonTitleFromLines(
    args.lessonLines ?? [],
    args.moduleTitle,
    args.sectionTitle,
  );
  if (lessonTitle) {
    return lessonTitle;
  }

  if (args.sectionTitle) return args.sectionTitle;
  if (args.lessonCounter === 0) return `Introduction au module`;
  return `Point cle ${args.lessonCounter + 1}`;
}

function getExplicitBlockTitle(block: Block): string {
  if (block.type === "title") {
    return asTrimmed(block.text) || asTrimmed(block.title);
  }

  if (block.type === "quiz" || block.type === "exercise") {
    return asTrimmed(block.title);
  }

  if (block.type === "image" || block.type === "drawing" || block.type === "math" || block.type === "code") {
    return asTrimmed(block.title);
  }

  return "";
}

export function buildLiveSteps(
  modules: Module[],
  fallbackDescription: string,
): LiveCourseStep[] {
  const steps: LiveCourseStep[] = [];

  for (const moduleItem of modules) {
    const moduleTitle = asTrimmed(moduleItem.title) || "Module";
    const moduleBlockTypes = uniqueStrings(
      (moduleItem.blocks ?? [])
        .map((block) => block.type)
        .filter((type) => type !== "title"),
    );

    let sectionTitle = moduleTitle;
    let lessonLines: string[] = [];
    let lessonBlockTypes: string[] = [];
    let lastContextLines: string[] = [];
    let lessonCounter = 0;

    const flushLesson = () => {
      const normalizedLines = lessonLines.filter(Boolean);
      if (!normalizedLines.length) return;

      const title = getStepTitle({
        moduleTitle,
        sectionTitle,
        explicitTitle: "",
        lessonLines: normalizedLines,
        lessonCounter,
        kind: "lesson",
      });

      steps.push({
        id: `${moduleItem.id}-lesson-${lessonCounter + 1}`,
        moduleId: moduleItem.id,
        moduleTitle,
        title,
        kind: "lesson",
        sourceLines: normalizedLines,
        contextLines: normalizedLines,
        quizQuestions: [],
        exercisePrompt: "",
        exerciseSolution: "",
        allowImageUpload: false,
        blockTypes: uniqueStrings(lessonBlockTypes),
        moduleToolInventory: moduleBlockTypes,
      });

      lastContextLines = normalizedLines;
      lessonCounter += 1;
      lessonLines = [];
      lessonBlockTypes = [];
    };

    for (const block of moduleItem.blocks ?? []) {
      const explicitBlockTitle = getExplicitBlockTitle(block);

      if (block.type === "title") {
        flushLesson();
        sectionTitle = explicitBlockTitle || moduleTitle;
        lastContextLines = [];
        continue;
      }

      if (block.type === "quiz") {
        flushLesson();
        const quizQuestions = readQuizQuestions(block);
        if (!quizQuestions.length) continue;

        steps.push({
          id: block.id,
          moduleId: moduleItem.id,
          moduleTitle,
          title: getStepTitle({
            moduleTitle,
            sectionTitle,
            explicitTitle: explicitBlockTitle,
            lessonCounter,
            kind: "quiz",
          }),
          kind: "quiz",
          sourceLines: [],
          contextLines: lastContextLines,
          quizQuestions,
          exercisePrompt: "",
          exerciseSolution: "",
          allowImageUpload: false,
          blockTypes: ["quiz"],
          moduleToolInventory: moduleBlockTypes,
        });
        continue;
      }

      if (block.type === "exercise") {
        flushLesson();
        const prompt = readExercisePrompt(block);
        if (!prompt) continue;

        steps.push({
          id: block.id,
          moduleId: moduleItem.id,
          moduleTitle,
          title: getStepTitle({
            moduleTitle,
            sectionTitle,
            explicitTitle: explicitBlockTitle,
            lessonCounter,
            kind: "exercise",
          }),
          kind: "exercise",
          sourceLines: prompt ? [prompt] : [],
          contextLines: lastContextLines,
          quizQuestions: [],
          exercisePrompt: prompt,
          exerciseSolution: readExerciseSolution(block),
          allowImageUpload: true,
          blockTypes: ["exercise"],
          moduleToolInventory: moduleBlockTypes,
        });
        continue;
      }

      const paragraph = readBlockParagraph(block);
      if (!paragraph) continue;

      if (explicitBlockTitle && explicitBlockTitle !== sectionTitle && lessonLines.length > 0) {
        flushLesson();
        sectionTitle = explicitBlockTitle;
      }

      lessonLines.push(paragraph);
      lessonBlockTypes.push(block.type);
    }

    flushLesson();
  }

  if (steps.length > 0) return steps;

  return [
    {
      id: "fallback-lesson",
      moduleId: "fallback",
      moduleTitle: "Introduction",
      title: "Introduction",
      kind: "lesson",
      sourceLines: fallbackDescription
        ? [fallbackDescription]
        : ["Ce cours est pret. Ajoutez du contenu detaille pour le mode live."],
      contextLines: fallbackDescription
        ? [fallbackDescription]
        : ["Ce cours est pret. Ajoutez du contenu detaille pour le mode live."],
      quizQuestions: [],
      exercisePrompt: "",
      exerciseSolution: "",
      allowImageUpload: false,
      blockTypes: [],
      moduleToolInventory: [],
    },
  ];
}
