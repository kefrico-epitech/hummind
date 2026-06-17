import type { Action, Block, BlockType, Course, Module } from "../../components/course/types";
import { openai } from "../openai";
import { buildFunctionChartData, normalizeFunctionSpecInput } from "../course/chartFunction";

type Scope = "ALL" | "MODULE" | "BLOCK";
type GenerationMode = "PLAN" | "COMPLETE_MODULE" | "SIMPLIFY" | "GENERATE_QUIZ";

type GenerationInput = {
  mode: GenerationMode;
  course: Course;
  language: string;
  level: string;
  prompt: string;
  scope: Scope;
  targetModuleId: string | null;
  targetBlockId: string | null;
  extractedData: string | null;
  context: {
    title?: string;
    description?: string;
    objectives?: string[];
    domain?: string;
    level?: string;
    style?: string;
  };
};

export type AiUsageSummary = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  consumedCredits: number;
};

export class CourseGenerationError extends Error {
  status: number;
  details?: string;

  constructor(status: number, message: string, details?: string) {
    super(message);
    this.name = "CourseGenerationError";
    this.status = status;
    this.details = details;
  }
}

const BLOCK_TYPES: BlockType[] = [
  "title",
  "content",
  "quiz",
  "exercise",
  "divider",
  "code",
  "math",
  "image",
  "table",
  "chart",
  "drawing",
];

const ACTION_TYPES = new Set<Action["type"]>([
  "ADD_BLOCK",
  "UPDATE_BLOCK",
  "DELETE_BLOCK",
  "MOVE_BLOCK",
]);

const ALLOWED_CHART_TYPES = new Set(["line", "bar", "pie", "chronogram"]);
const ALLOWED_DIVIDER_VARIANTS = new Set(["line", "dashed", "space"]);
const ALLOWED_MATH_MODE = new Set(["inline", "block"]);
const ALLOWED_QUIZ_COVERAGE = new Set(["current_lesson", "previous_lessons", "mixed"]);
const ALLOWED_QUIZ_DIFFICULTY = new Set(["easy", "medium", "hard"]);
const GENERIC_MODULE_TITLE_PATTERNS = [
  /^module\s*\d*$/i,
  /^introduction$/i,
  /^conclusion$/i,
  /^resume$/i,
  /^generalites$/i,
];
const PLACEHOLDER_TEXT_PATTERNS = [
  /^question\s*\d+$/i,
  /^choix\s*\d+$/i,
  /^option\s*\d+$/i,
  /^reponse\s*[a-z0-9]+$/i,
  /^a\s*completer$/i,
  /^quiz a valider/i,
  /^contenu principal du module/i,
  /lorem ipsum/i,
];

const outputSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    actions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          type: {
            type: "string",
            enum: ["ADD_BLOCK", "UPDATE_BLOCK", "DELETE_BLOCK", "MOVE_BLOCK"],
          },
          moduleId: { type: "string" },
          moduleTitle: { type: ["string", "null"] },
          blockId: { type: ["string", "null"] },
          afterBlockId: { type: ["string", "null"] },
          toModuleId: { type: ["string", "null"] },
          toIndex: { type: ["integer", "null"] },
          block: {
            type: "object",
            additionalProperties: false,
            properties: {
              id: { type: "string" },
              type: { type: "string", enum: BLOCK_TYPES },
              text: { type: "string" },
              title: { type: "string" },
              status: { type: "string", enum: ["pending", "ready"] },
              data: { type: "object", additionalProperties: true },
            },
            required: ["id", "type", "text", "title", "status", "data"],
          },
        },
        required: [
          "type",
          "moduleId",
          "blockId",
          "afterBlockId",
          "toModuleId",
          "toIndex",
          "block",
        ],
      },
    },
  },
  required: ["actions"],
} as const;

function uid(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asTrimmed(value: unknown): string {
  return asString(value).trim();
}

/* const EXERCISE_SECTION_PREFIX_BAD =
  /^(?:exercice|exercise|enonce|enonce|enonce|enonce|enonce|enonce|enonce|enonce|enonce|enonce|enonce|enonce|enonce|enonce|enonce|enonce|enonce|enonce|enonce|enonce|enonce|enonce|enonce|enonce|enonce|enonce|enonce|enonce|enonce|enonce|enonce|enonce|enonce|enonce|enonce|enonce|enonce|enonce|enonce|enonce|enonce|enonce|enonce|enonce|enonce|enonce|enonce|enonce|enonce|enonce|enonce|enonce|enonce|enonce|enonce|énoncé|corrige|corrigé|correction|solution)\s*[:;\-]?/i;

*/
const EXERCISE_SECTION_PREFIX =
  /^(?:exercice|exercise|(?:e|\u00e9)nonc(?:e|\u00e9)|corrig(?:e|\u00e9)|correction|solution)\s*[:;\-]?/i;
// Insert \n\n BEFORE a marker that's glued to preceding text
const SEMANTIC_LABEL_BREAK_PATTERN =
  /\s+(?=(?:Objectifs?(?: du chapitre| du module)?|D[eé]finitions? essentielles?|D[eé]finition|Exemple(?: concret)?(?:\s*\([^)]+\))?|Point[- ]cl[eé]s?(?: [aà] retenir)?|Points?[- ]cl[eé]s?|Cas pratique|Mise en pratique|V[eé]rification rapide|M[eé]thode|Explication|R[oô]le symbolique|Place dans les symboles nationaux)\s*:)/giu;

// Insert \n AFTER the colon of a marker (e.g. "Definition: text" → "Definition:\ntext")
const SEMANTIC_LABEL_AFTER_COLON_PATTERN =
  /((?:Objectifs?(?: du chapitre| du module)?|D[eé]finitions? essentielles?|D[eé]finition|Exemple(?: concret)?(?:\s*\([^)]+\))?|Point[- ]cl[eé]s?(?: [aà] retenir)?|Points?[- ]cl[eé]s?|Cas pratique|Mise en pratique|V[eé]rification rapide|M[eé]thode|Explication|R[oô]le symbolique|Place dans les symboles nationaux)\s*:)[ \t]+/giu;

// Fix broken markers split across lines AND the standalone "A retenir" preceded by "Point-cle"
// Runs BEFORE other normalizations to prevent re-splitting
const SEMANTIC_LABEL_BROKEN_PATTERN =
  /Point[- ]cl[eé]s?[\s\n]+[aà]\s+retenir\s*:/giu;

function normalizeInlineText(value: string): string {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeStructuredText(value: string): string {
  const base = asString(value)
    .replace(/\r\n/g, "\n")
    // Fix broken markers BEFORE stripping whitespace around newlines
    .replace(SEMANTIC_LABEL_BROKEN_PATTERN, "Point-cle a retenir:")
    .replace(/\t+/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .replace(/\s+\n/g, "\n")
    .replace(/\n\s+/g, "\n")
    .trim();

  if (!base) return "";

  let normalized = base
    // Insert line break BEFORE markers
    .replace(SEMANTIC_LABEL_BREAK_PATTERN, "\n\n")
    // Insert line break AFTER marker colon
    .replace(SEMANTIC_LABEL_AFTER_COLON_PATTERN, "$1\n")
    // Normalize numbering
    .replace(/(^|\n)\s*(\d+)\)\s+/g, "$1$2. ")
    .replace(/(^|\n)\s*([A-Za-z])\)\s+/g, "$1$2. ")
    .replace(/(^|\n)\s*-\s+/g, "$1- ")
    // Collapse 3+ newlines to 2
    .replace(/\n{3,}/g, "\n\n");

  const hasStructuredLines = /(^|\n)\s*(?:\d+[\.\-\)]|[A-Za-z][\.\-\)]|[-*])\s+/.test(normalized);
  if (!hasStructuredLines && normalized.length > 220) {
    const sentences = normalized
      .split(/(?<=[.!?])\s+/)
      .map((part) => part.trim())
      .filter(Boolean);

    if (sentences.length >= 2) {
      normalized = sentences.map((sentence, index) => `${index + 1}. ${sentence}`).join("\n");
    }
  }

  return normalized;
}

function normalizePedagogicContentText(value: string): string {
  const base = asString(value)
    .replace(/\r\n/g, "\n")
    // Fix broken markers BEFORE stripping whitespace around newlines
    .replace(SEMANTIC_LABEL_BROKEN_PATTERN, "Point-cle a retenir:")
    .replace(/\t+/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .replace(/\s+\n/g, "\n")
    .replace(/\n\s+/g, "\n")
    .trim();

  if (!base) return "";

  let normalized = base
    // Insert double line break BEFORE markers (creates clear section separation)
    .replace(SEMANTIC_LABEL_BREAK_PATTERN, "\n\n")
    // Insert line break AFTER marker colon
    .replace(SEMANTIC_LABEL_AFTER_COLON_PATTERN, "$1\n")
    // Normalize numbering
    .replace(/(^|\n)\s*(\d+)\)\s+/g, "$1$2. ")
    .replace(/(^|\n)\s*([A-Za-z])\)\s+/g, "$1$2. ")
    .replace(/(^|\n)\s*-\s+/g, "$1- ")
    // Collapse 3+ newlines to 2
    .replace(/\n{3,}/g, "\n\n");

  const hasStructuredLines = /(^|\n)\s*(?:\d+[\.\-\)]|[A-Za-z][\.\-\)]|[-*])\s+/.test(
    normalized,
  );
  if (!hasStructuredLines && normalized.length > 260) {
    const sentences = normalized
      .split(/(?<=[.!?])\s+/)
      .map((part) => part.trim())
      .filter(Boolean);

    if (sentences.length >= 3) {
      const paragraphs: string[] = [];
      for (let index = 0; index < sentences.length; index += 2) {
        paragraphs.push(sentences.slice(index, index + 2).join(" "));
      }
      normalized = paragraphs.join("\n\n");
    }
  }

  return normalized;
}

type ExerciseItemKind = "numeric" | "alpha" | "bullet" | "plain";

type ExerciseItem = {
  kind: ExerciseItemKind;
  marker?: string;
  parts: string[];
};

function isExerciseSectionHeading(line: string): boolean {
  return EXERCISE_SECTION_PREFIX.test(line.trim()) && !cleanExerciseItemText(line);
}

function cleanExerciseItemText(value: string): string {
  return value
    .replace(EXERCISE_SECTION_PREFIX, "")
    .replace(/^\d+\s*[\.\-\)]\s*/, "")
    .trim();
}

function parseExerciseItem(line: string): ExerciseItem | null {
  const numericMatch = line.match(/^(\d+)\s*[\.\-\)]\s*(.*)$/);
  if (numericMatch) {
    return {
      kind: "numeric",
      marker: numericMatch[1],
      parts: numericMatch[2] ? [numericMatch[2].trim()] : [],
    };
  }

  const alphaMatch = line.match(/^([A-Za-z])\s*[\.\-\)]\s*(.*)$/);
  if (alphaMatch) {
    return {
      kind: "alpha",
      marker: alphaMatch[1].toUpperCase(),
      parts: alphaMatch[2] ? [alphaMatch[2].trim()] : [],
    };
  }

  const bulletMatch = line.match(/^[-*]\s*(.*)$/);
  if (bulletMatch) {
    return {
      kind: "bullet",
      parts: bulletMatch[1] ? [bulletMatch[1].trim()] : [],
    };
  }

  return null;
}

function normalizeExercisePlainItems(items: ExerciseItem[], fallback: string): string {
  const plainLines = items
    .map((item) => item.parts.join(" ").replace(/\s+/g, " ").trim())
    .filter(Boolean);

  if (!plainLines.length) return `1- ${fallback}`;
  if (plainLines.length > 1) {
    return plainLines.map((line, index) => `${index + 1}- ${line}`).join("\n");
  }

  const sentences = plainLines[0]
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (sentences.length <= 1) return `1- ${plainLines[0]}`;
  return sentences.map((sentence, index) => `${index + 1}- ${sentence}`).join("\n");
}

function normalizeExerciseSection(value: string, fallback: string): string {
  const normalized = normalizeStructuredText(value);
  if (!normalized) return `1- ${fallback}`;

  const lines = normalized
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const items: ExerciseItem[] = [];

  for (const line of lines) {
    if (isExerciseSectionHeading(line)) continue;

    const parsed = parseExerciseItem(line);
    if (parsed) {
      const current = {
        ...parsed,
        parts: parsed.parts.map(cleanExerciseItemText).filter(Boolean),
      };

      const firstPart = parsed.parts[0] ?? "";
      if (!current.parts.length && isExerciseSectionHeading(firstPart)) continue;

      if (
        parsed.kind === "numeric" &&
        current.parts.length === 1 &&
        /^[A-Za-z][\.\-\)]$/.test(current.parts[0])
      ) {
        items.push({
          kind: "alpha",
          marker: current.parts[0][0].toUpperCase(),
          parts: [],
        });
        continue;
      }

      items.push(current);
      continue;
    }

    const cleaned = cleanExerciseItemText(line);
    if (!cleaned) continue;

    if (!items.length) {
      items.push({ kind: "plain", parts: [cleaned] });
      continue;
    }

    items[items.length - 1].parts.push(cleaned);
  }

  if (!items.length) return `1- ${fallback}`;
  if (!items.some((item) => item.kind !== "plain")) {
    return normalizeExercisePlainItems(items, fallback);
  }

  let numericIndex = 1;
  const formatted = items
    .map((item) => {
      const content = item.parts.join(" ").replace(/\s+/g, " ").trim();
      if (!content) return "";

      if (item.kind === "alpha") {
        return `${item.marker}. ${content}`;
      }

      if (item.kind === "bullet") {
        return `- ${content}`;
      }

      return `${numericIndex++}- ${content}`;
    })
    .filter(Boolean);

  return formatted.length ? formatted.join("\n") : `1- ${fallback}`;
}

function asNullableString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const v = value.trim();
  return v ? v : null;
}

function asIntegerOrNull(value: unknown): number | null {
  if (Number.isInteger(value)) return value as number;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    if (Number.isInteger(n)) return n;
  }
  return null;
}

function ensureActionType(value: unknown): Action["type"] | null {
  const t = asTrimmed(value) as Action["type"];
  return ACTION_TYPES.has(t) ? t : null;
}

function ensureBlockType(value: unknown): BlockType {
  const t = asTrimmed(value) as BlockType;
  return (BLOCK_TYPES as string[]).includes(t) ? t : "content";
}

function normalizeCourse(body: Record<string, unknown>): Course {
  const rawCourse = asRecord(body.course);
  if (!rawCourse) {
    throw new CourseGenerationError(400, "course est requis");
  }

  const rawModules = Array.isArray(rawCourse.modules) ? rawCourse.modules : [];
  const modules: Module[] = rawModules.map((raw, moduleIndex) => {
    const moduleObj = asRecord(raw) ?? {};
    const moduleId = asTrimmed(moduleObj.id) || `module_${moduleIndex + 1}`;
    const moduleTitle = asTrimmed(moduleObj.title) || `Module ${moduleIndex + 1}`;
    const rawBlocks = Array.isArray(moduleObj.blocks) ? moduleObj.blocks : [];

    const blocks: Block[] = rawBlocks.map((rawBlock, blockIndex) => {
      const blockObj = asRecord(rawBlock) ?? {};
      const blockType = ensureBlockType(blockObj.type);
      const blockTitle = asTrimmed(blockObj.title) || `Bloc ${blockIndex + 1}`;
      const blockText = asString(blockObj.text);
      return {
        id: asTrimmed(blockObj.id) || `block_${moduleIndex + 1}_${blockIndex + 1}`,
        type: blockType,
        title: blockTitle,
        text: blockText,
        status: "ready",
        data: asRecord(blockObj.data) ?? {},
      };
    });

    return { id: moduleId, title: moduleTitle, blocks };
  });

  return {
    id: asTrimmed(rawCourse.id) || "draft",
    title: asTrimmed(rawCourse.title) || "Cours",
    modules,
  };
}

function inferScope(body: Record<string, unknown>): Scope {
  const raw = asTrimmed(body.scope);
  if (raw === "ALL" || raw === "MODULE" || raw === "BLOCK") return raw;

  if (asNullableString(body.targetBlockId)) return "BLOCK";
  if (asNullableString(body.targetModuleId) || asNullableString(body.moduleId)) return "MODULE";
  return "ALL";
}

function findModuleIdByBlockId(course: Course, blockId: string | null): string | null {
  if (!blockId) return null;
  const matchedModule = course.modules.find((m) => m.blocks.some((b) => b.id === blockId));
  return matchedModule?.id ?? null;
}

function inferTargetModuleId(body: Record<string, unknown>, course: Course, targetBlockId: string | null): string | null {
  const direct = asNullableString(body.targetModuleId) ?? asNullableString(body.moduleId);
  if (direct) return direct;
  return findModuleIdByBlockId(course, targetBlockId);
}

function extractContext(body: Record<string, unknown>): GenerationInput["context"] {
  const raw = asRecord(body.context) ?? {};
  const objectives = Array.isArray(raw.objectives)
    ? raw.objectives.map((v) => asTrimmed(v)).filter(Boolean)
    : [];

  return {
    title: asTrimmed(raw.title) || undefined,
    description: asTrimmed(raw.description) || undefined,
    objectives,
    domain: asTrimmed(raw.domain) || undefined,
    level: asTrimmed(raw.level) || undefined,
    style: asTrimmed(raw.style) || undefined,
  };
}

function buildModeRules(input: GenerationInput): string {
  if (input.mode === "PLAN") {
    return `
MODE PLAN:
- Si le cours est vide ou quasi vide: propose un plan complet en 4 a 8 modules utiles.
- Chaque module doit cibler une notion explicite (pas de module vague "Introduction" seul).
- Evite les modules redondants ou decoratifs.

STRUCTURE OBLIGATOIRE DE CHAQUE MODULE (PLAN):
- Chaque module DOIT contenir cette sequence EXACTE de blocs:
  1) un bloc type="title" (titre du module)
  2) un bloc type="content" (contenu pedagogique, MINIMUM 1500 caracteres, 6-10 paragraphes)
  3) un ou plusieurs blocs specialises adaptes au domaine (voir regles ci-dessous)
  4) un bloc type="exercise" avec un vrai enonce et un vrai corrige
  5) un bloc type="quiz" avec minimum 3 questions

BLOCS SPECIALISES SELON LE DOMAINE:
- Si domaine = Informatique/programmation: OBLIGATOIRE un bloc type="code" par module avec du vrai code fonctionnel
- Si domaine = Mathematiques/Physique/Chimie: OBLIGATOIRE un bloc type="math" par module avec du LaTeX
- Si le contenu compare des elements: ajouter un bloc type="table" (comparaison, classification)
- Si le contenu montre une evolution ou des proportions: ajouter un bloc type="chart"
- Pour tout domaine: ajouter AU MOINS un bloc type="image" dans le premier module avec status="pending", url="" et un caption qui decrit precisement l'illustration attendue (ex: "Schema montrant le cycle de vie d'une variable en Python")

- Pense chaque module comme un chapitre de manuel avec une progression lisible.
- Le contenu doit contenir definition(s), explication detaillee, exemple concret guide et synthese.
- Ecris comme un professeur qui explique pas a pas, avec un ton narratif et rassurant.
- Utilise un langage simple (niveau professeur -> eleve), phrases courtes et vocabulaire courant.
- Evite les notes brutes et les listes seches de mots-cles.
- Quand c'est utile, utilise exactement ces marqueurs sur leur propre ligne:
  Objectif du chapitre:
  Definition:
  Exemple concret:
  Point-cle a retenir:
`.trim();
  }

  if (input.mode === "COMPLETE_MODULE") {
    return `
MODE COMPLETE_MODULE:
- Enrichis le module cible avec du contenu pedagogique reel, pas de phrase d'introduction seule.
- Garde la coherence avec les objectifs du cours.
- Le quiz/exercice du module doit evaluer uniquement les notions deja introduites dans ce module.
- Reformule en langage simple, concret et comprehensible par un apprenant moyen.
- Rends le texte plus narratif, comme une mini-lecon lue a voix haute par un enseignant.
- Prefere de courts paragraphes relies entre eux a une suite de points trop secs.
- Quand c'est utile, structure les contenus avec ces marqueurs exacts:
  Objectif du chapitre:
  Definition:
  Exemple concret:
  Point-cle a retenir:
- Utilise des intertitres utiles via des blocks title quand cela ameliore la lecture.
`.trim();
  }

  if (input.mode === "GENERATE_QUIZ") {
    return `
MODE GENERATE_QUIZ:
- Ne produis que des actions quiz/exercise liees au contenu existant.
- Minimum 3 questions si quiz, avec corrections explicites.
- Questions en langage simple, sans pieges inutiles, et numerotation nette.
- Le quiz doit ressembler a une vraie section d'auto-evaluation de manuel.
`.trim();
  }

  return `
MODE SIMPLIFY:
- Simplifie sans perdre les notions essentielles.
- Conserve la progression pedagogique.
- Utilise un langage basique, direct et bien structure.
- Rends le contenu plus lisible a l'impression, comme un manuel de cours clair.
- Garde une voix narrative et explicative, pas un style telegraphique.
`.trim();
}

function buildSystemPrompt(input: GenerationInput): string {
  const documentRules = input.extractedData
    ? `
DOCUMENT-FIRST:
- Base-toi en priorite sur le document fourni.
- Si une information critique n'est pas presente, marque le bloc concerne en status="pending".
- N'invente pas de donnees chiffrees en dehors du document.
`
    : "";

  const scopeRules =
    input.scope === "BLOCK"
      ? `
PORTEE CIBLEE (BLOCK):
- Autorise uniquement:
  1) UPDATE_BLOCK sur le blockId cible.
  2) ADD_BLOCK avec afterBlockId = blockId cible.
- N'utilise ni DELETE_BLOCK ni MOVE_BLOCK dans ce mode.
`
      : input.scope === "MODULE"
        ? `
PORTEE CIBLEE (MODULE):
- Toutes les actions doivent rester dans moduleId="${input.targetModuleId ?? "module_cible"}".
`
        : `
PORTEE GLOBALE (ALL):
- Tu peux agir sur tout le cours, mais garde une progression pedagogique claire.
`;

  return `
Tu es l'architecte IA d'un editeur de cours academique.
Ta sortie DOIT etre un JSON valide conforme au schema fourni, sans markdown.

OBJECTIF:
- Produire des actions strictement exploitables par l'editeur de blocs.
- Garantir une qualite pedagogique elevee avec un langage simple, clair et accessible.
- Eliminer les modules inutiles, les blocs gadgets et les quiz hors-sujet.
- Faire en sorte que le rendu final puisse etre lu comme un vrai manuel de cours.

${documentRules}
${scopeRules}
${buildModeRules(input)}

CANEVAS EDITORIAL MANUEL:
- Chaque module doit se lire comme un chapitre coherent.
- Progression attendue dans un module:
  1) notion ou objectif du chapitre
  2) explication claire
  3) exemple concret ou application guidee
  4) synthese ou point cle
  5) exercice ou quiz de verification
- Utilise les blocks title pour poser de vrais intertitres editoriaux.
- Les intertitres doivent etre utiles, precis et lisibles a l'impression.
- Evite absolument les textes de remplissage, les phrases d'accueil vides et les transitions bavardes.
- La voix doit etre celle d'un enseignant qui raconte et explique, pas d'une liste de notes.
- Le rythme doit etre progressif: on introduit, on detaille, on illustre, puis on verifie.

REGLES STRUCTURE:
- Cours = modules[] ; module = blocks[].
- Chaque action doit contenir: type, moduleId, blockId, afterBlockId, toModuleId, toIndex, block.
- moduleTitle est optionnel et sert uniquement au renommage de module.
- Aucun module ne doit garder un titre generique ("Module 1", "Introduction", "Conclusion") sans notion cible.

CONTRAT DES BLOCS (OBLIGATOIRE):
1) title
- block.text: titre court
- block.title: meme valeur que text
- block.data: {}

2) content
- block.text: contenu pedagogique clair et substantiel (pas une phrase vide)
- block.title: titre court de section (si pertinent)
- block.data: {}
- Le texte doit inclure des notions explicites et une application concrete.
- Le texte doit etre facile a lire: phrases courtes, mots simples, lignes aerees et transitions naturelles.
- Ecris comme une mini-lecon narrative, pas comme une liste de notes ou un plan brut.
- Ecris au minimum 5 a 8 paragraphes par bloc content. Chaque notion merite une explication detaillee.
- Vise au moins 400 caracteres par bloc content. Un bloc de 2 phrases est trop court pour un cours.
- Prefere 5 a 10 courts paragraphes a une longue masse compacte.
- Quand c'est pertinent, utilise exactement ces marqueurs. CHAQUE MARQUEUR DOIT ETRE SEUL SUR SA LIGNE, suivi d'un saut de ligne, puis du contenu:

  Objectif du chapitre:\n[contenu ici]
  Definition:\n[contenu ici]
  Exemple concret:\n[contenu ici]
  Point-cle a retenir:\n[contenu ici]

- INTERDIT: coller un marqueur au texte qui precede. Toujours un saut de ligne AVANT et APRES le marqueur.
- Exemple CORRECT:
  "...fin du paragraphe precedent.\n\nDefinition:\nL'ADN est une molecule..."
- Exemple INCORRECT:
  "...fin du paragraphe precedent. Definition: L'ADN est une molecule..."
- Chaque marqueur doit etre suivi d'un vrai contenu explicatif, jamais d'un titre vide.
- Apres le contenu d'un marqueur, laisse une ligne vide avant le marqueur suivant.
- Si le contenu est long, numerote uniquement les idees qui gagnent vraiment a etre distinguees.
- Le rendu doit ressembler a une section de manuel, pas a une note brute.
- Structure attendue quand pertinent:
  definition -> explication -> exemple -> synthese.

3) quiz
- block.data.quiz.questions[] requis — MINIMUM 3 QUESTIONS PAR QUIZ, OBLIGATOIRE.
- Chaque question: q, choices(min 3), answerIndex ou answerIndexes, multiple(bool), explanation(requis)
- Ajoute sourceBlockIds et targetObjectiveIds quand possible
- Interdits: "Question 1", "Choix 1", placeholders et questions de pure memorisation hors contenu.
- Le quiz doit pouvoir etre imprime comme une section "Verification rapide".
- Si tu ne trouves pas 3 questions pertinentes, invente des variantes qui testent la meme notion sous des angles differents (application, definition, exemple).

4) exercise
- block.data.exercise.statement requis — DOIT CONTENIR UN VRAI ENONCE, PAS "Exercice a completer."
- block.data.exercise.solution requis — DOIT CONTENIR UNE VRAIE CORRECTION, PAS "Corrige a completer."
- L'exercice doit tester les notions enseignees dans le module. Ecris un enonce concret avec des donnees reelles.
- Minimum 2 consignes par exercice pour que l'apprenant puisse pratiquer.
- IMPORTANT:
  - statement contient uniquement l'enonce.
  - solution contient uniquement le corrige.
  - N'ecris jamais "Exercice :", "Corrige :", "Correction :" ou "Solution :" dans ces champs.
  - N'ajoute pas une numerotation parasite ligne par ligne.
  - Si l'exercice contient des cas A/B/C, garde-les comme sous-elements lisibles au lieu de transformer chaque ligne en item numerote.
- Format attendu pour statement:
  1- Consigne principale. Si besoin, ajoute la justification attendue dans la meme consigne.
  A. Cas ou situation A.
  B. Cas ou situation B.
  2- Deuxieme consigne si necessaire.
- Format attendu pour solution:
  1- A. Reponse attendue + justification.
  B. Reponse attendue + justification.
  2- Reponse attendue + explication.
- Si la solution contient du code, ecris chaque instruction sur sa propre ligne avec un tiret.
- Ne melange pas code et texte sur la meme ligne.

5) divider
- block.data.divider.variant: "line" | "dashed" | "space"
- block.data.divider.label optionnel

6) code
- block.data.code.language requis (ex: "python", "javascript", "html", "sql")
- block.data.code.code requis — code reel, fonctionnel, pas du pseudo-code
- QUAND UTILISER: si le cours enseigne la programmation, les bases de donnees, ou tout sujet technique impliquant du code.
- Chaque fois que tu montres du code dans un bloc content avec des backticks, demande-toi si un bloc code serait plus lisible.
- Un bloc code par exemple concret est souvent preferable a du code inline dans le texte.

7) math
- block.data.math.latex requis — DOIT CONTENIR UNE VRAIE FORMULE LaTeX, JAMAIS VIDE.
  Exemples: "\\frac{a}{b}", "\\sqrt{x^2+y^2}", "E=mc^2", "a^2+b^2=c^2"
- block.data.math.mode: "inline" | "block" (optionnel, defaut "block")
- block.data.math.description requis — description en francais de la formule
- QUAND UTILISER: si le cours contient des formules mathematiques, de la physique, de la chimie, ou des equations.
- Prefere un bloc math a du texte brut pour toute formule comportant des fractions, des exposants, des racines ou des symboles speciaux.
- INTERDIT: latex vide (""), latex placeholder ("formule"), latex sans vraie expression.

LATEX INLINE DANS LES BLOCS CONTENT:
- Pour les domaines scientifiques, utilise du LaTeX inline dans les blocs content avec la syntaxe $..$
- Exemple: "Si $a = 3$ et $b = 4$, alors $a^2 + b^2 = 9 + 16 = 25$ donc $c = 5$"
- Utilise $$...$$ pour les formules centrees sur leur propre ligne dans le texte.
- TOUJOURS utiliser la notation $..$ pour les variables et formules, ne jamais les ecrire en texte brut.

8) image
- block.data.image.url: laisse url="" et mets status="pending" (le professeur ajoutera l'image)
- block.data.image.caption: description de l'image attendue (ex: "Schema de la double helice de l'ADN")
- block.data.image.alt: texte alternatif descriptif
- QUAND UTILISER: quand un schema, un diagramme ou une illustration aiderait a comprendre une notion abstraite.
- Ajoute au moins 1 image par cours pour les notions qui beneficient d'un visuel.
- Le caption doit decrire precisement ce que l'image devrait montrer pour que le professeur sache quelle image ajouter.

9) table
- block.data.table.cols[] avec {id,label}
- block.data.table.rows[] avec {id,cells}
- chaque row.cells doit contenir une valeur texte pour chaque col.id
- QUAND UTILISER: pour presenter des comparaisons, des donnees structurees, des conversions, ou des classifications.
- Exemples: tableau de conjugaison, comparaison de concepts, unite de mesure, chronologie.
- Les donnees du tableau doivent etre reelles et pedagogiques, pas des placeholders.

10) chart
- block.data.chart.chartType: "line" | "bar" | "pie" | "chronogram"
- block.data.chart.labels[] requis
- block.data.chart.datasets[] requis avec {label,data:number[]}
- labels.length doit correspondre a chaque dataset.data.length
- block.data.chart.mode optionnel: "data" | "function" | "chronogram"
- Si mode="function", ajoute block.data.chart.functionSpec:
  { expr, xMin, xMax, step, tangents?, asymptotesX?, asymptotesY? }
- En mode function: utilise chartType="line", avec des tangentes/asymptotes coherentes.
- QUAND UTILISER:
  - "bar" pour comparer des quantites (ex: population, scores, budgets)
  - "pie" pour montrer des proportions (ex: repartition, pourcentages)
  - "line" pour montrer une evolution (ex: temperature, croissance)
  - mode="function" pour les cours de mathematiques (ex: f(x) = x^2)
  - "chronogram" pour les signaux logiques (ex: electronique, informatique)

11) drawing
- block.data.drawing: laisse vide et mets status="pending"
- Le professeur dessinera manuellement dans l'editeur.
- QUAND UTILISER: pour des schemas simples que le professeur voudra dessiner a la main (ex: circuits, diagrammes)

REGLES D'UTILISATION DES BLOCS AVANCES:
- Ne te limite PAS a title/content/quiz/exercise. Utilise les blocs avances quand ils apportent une vraie valeur pedagogique.
- Un cours de maths DOIT utiliser des blocs math pour les formules.
- Un cours de programmation DOIT utiliser des blocs code pour les exemples.
- Un cours avec des donnees comparatives DEVRAIT utiliser un tableau ou un graphique.
- Un cours avec des notions visuelles DEVRAIT inclure au moins un bloc image (en pending) avec un caption descriptif.
- Prefere un bloc specialise a du texte brut : code > backticks, math > texte, table > liste.

REGLES PEDAGOGIQUES:
- Respecte la progression: introduire -> expliquer -> pratiquer -> evaluer.
- Les quiz/exercices doivent se baser sur du contenu deja present.
- Ajoute une image (schema, illustration, figure) quand cela ameliore clairement la comprehension.
- Evite les images decoratives; privilegie les visuels explicatifs utiles.
- Si incomplet, utilise status="pending"; sinon "ready".
- Evite les actions inutiles (pas de bloc vide, pas de renommage parasite).
- Ton: pedagogique, rassurant, direct, sans jargon inutile.
- Presentation: coherent, ordonnee, numerotation claire et constante.
- Vise un rendu final digne d'un support de cours imprime ou d'un manuel de reference.
- Le lecteur doit avoir l'impression qu'un enseignant guide la lecture pas a pas.

REGLE OBLIGATOIRE PAR MODULE:
- Chaque module final doit contenir au minimum:
  1) un bloc type="title"
  2) un bloc type="content" (minimum 1500 caracteres, 6+ paragraphes)
  3) un bloc type="exercise" avec un vrai enonce (pas "Exercice a completer") et un vrai corrige
  4) un bloc type="quiz" avec minimum 3 questions, explications, et 3+ choix par question
- Les deux (exercise ET quiz) sont obligatoires, pas l'un ou l'autre.
- Si un module ne respecte pas cette structure, ajoute les blocs manquants avec du vrai contenu.
- Pour les cours techniques: ajouter aussi un bloc code/math selon le domaine.

CHECKLIST AVANT REPONSE (OBLIGATOIRE):
1) Chaque module traite une notion identifiable.
2) Chaque module contient: title + content(1500+ chars) + exercise(reel) + quiz(3+ questions).
3) Les blocs specialises sont presents selon le domaine (code pour informatique, math pour maths).
4) Aucun quiz hors-sujet ni placeholder.
5) Aucun exercice avec "Exercice a completer" ou "Corrige a completer".
6) Au moins 1 bloc image (pending) avec caption descriptif dans le cours.
7) Sortie strictement JSON, conforme au schema.
`.trim();
}

function buildUserPrompt(input: GenerationInput): string {
  const targetLabel =
    input.scope === "ALL"
      ? "Tous les modules"
      : input.scope === "MODULE"
        ? `Module ${input.targetModuleId ?? "non defini"}`
        : `Bloc ${input.targetBlockId ?? "non defini"}`;

  return `
Langue: ${input.language}
Niveau: ${input.level || "non precise"}
Mode de generation: ${input.mode}
Cible: ${targetLabel}

Contexte cours:
- Titre: ${input.context.title ?? input.course.title ?? "Non renseigne"}
- Description: ${input.context.description ?? "Non renseignee"}
- Domaine: ${input.context.domain ?? "Non renseigne"}
- Objectifs: ${(input.context.objectives ?? []).join(" | ") || "Non renseignes"}
- Style souhaite: ${input.context.style ?? "Narratif, progressif, pedagogique"}

Contraintes de qualite:
- Eviter tout module generique ou redondant.
- Produire un contenu explicatif reel (pas une simple introduction).
- Produire des quiz coherents avec le contenu deja present.
- Utiliser un langage simple et comprehensible par un apprenant non expert.
- Ecrire avec une voix de professeur: fluide, narrative, concrete et rassurante.
- Eviter les suites de mots-cles, les notes brutes et les blocs trop secs.
- Utiliser si pertinent les marqueurs:
  Objectif du chapitre:
  Definition:
  Exemple concret:
  Point-cle a retenir:
- Assurer une numerotation claire seulement quand elle aide vraiment la lecture.
- Maintenir une coherence forte entre objectifs, contenu, quiz et exercices.
- Faire en sorte que le document final puisse etre lu comme un manuel de cours.
- Utiliser des intertitres utiles et une redaction propre a l'impression.

Demande utilisateur:
${input.prompt || "Aucune consigne"}

${input.extractedData ? `Document source (extrait):\n"""${input.extractedData.slice(0, 18000)}"""` : ""}

Etat actuel du cours (JSON):
${JSON.stringify(input.course)}
`.trim();
}

function looksLikePlaceholderText(value: string): boolean {
  const clean = value.trim().toLowerCase();
  if (!clean) return true;
  return PLACEHOLDER_TEXT_PATTERNS.some((pattern) => pattern.test(clean));
}

function hasMinimumPedagogicDensity(text: string): boolean {
  const clean = text.trim();
  if (clean.length < 300) return false;
  const sentences = clean
    .split(/[.!?]+/g)
    .map((part) => part.trim())
    .filter(Boolean);
  return sentences.length >= 4;
}

function isGenericModuleTitle(title: string): boolean {
  const clean = title.trim().toLowerCase();
  if (!clean) return true;
  return GENERIC_MODULE_TITLE_PATTERNS.some((pattern) => pattern.test(clean));
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => asTrimmed(v))
    .filter(Boolean);
}

function normalizeQuizData(rawData: Record<string, unknown>): Record<string, unknown> {
  const rawQuiz = asRecord(rawData.quiz) ?? {};
  const rawQuestions = Array.isArray(rawQuiz.questions) ? rawQuiz.questions : [];

  const questions: Record<string, unknown>[] = [];
  let hasRejectedQuestions = false;

  for (const rawQuestion of rawQuestions) {
    const qObj = asRecord(rawQuestion) ?? {};
    const questionText = normalizeInlineText(asTrimmed(qObj.q));

    const uniqueChoices = toStringArray(qObj.choices)
      .map((choice) => normalizeInlineText(choice))
      .filter(
      (choice, idx, arr) => arr.indexOf(choice) === idx,
      );
    const cleanedChoices = uniqueChoices
      .filter((choice) => !looksLikePlaceholderText(choice))
      .slice(0, 6);

    if (
      !questionText ||
      looksLikePlaceholderText(questionText) ||
      cleanedChoices.length < 3
    ) {
      hasRejectedQuestions = true;
      continue;
    }

    const multiple = Boolean(qObj.multiple);
    const safeMax = cleanedChoices.length - 1;

    const answerIndexRaw = asIntegerOrNull(qObj.answerIndex);
    const answerIndexesRaw = Array.isArray(qObj.answerIndexes)
      ? qObj.answerIndexes
          .map((v) => asIntegerOrNull(v))
          .filter((v): v is number => v !== null)
      : [];

    const answerIndexes = answerIndexesRaw
      .map((i) => Math.min(Math.max(i, 0), safeMax))
      .filter((v, i, arr) => arr.indexOf(v) === i);

    const explanation = normalizeStructuredText(asTrimmed(qObj.explanation));
    const normalizedQuestion: Record<string, unknown> = {
      q: questionText,
      choices: cleanedChoices,
      multiple,
      explanation:
        explanation || "Justifie ta reponse en t'appuyant sur le contenu du module.",
    };

    if (multiple) {
      normalizedQuestion.answerIndexes = answerIndexes.length ? answerIndexes : [0];
    } else {
      normalizedQuestion.answerIndex =
        answerIndexRaw !== null ? Math.min(Math.max(answerIndexRaw, 0), safeMax) : 0;
    }

    const sourceBlockIds = toStringArray(qObj.sourceBlockIds);
    if (sourceBlockIds.length) normalizedQuestion.sourceBlockIds = sourceBlockIds;

    const targetObjectiveIds = toStringArray(qObj.targetObjectiveIds);
    if (targetObjectiveIds.length) normalizedQuestion.targetObjectiveIds = targetObjectiveIds;

    const coverageType = asTrimmed(qObj.coverageType);
    if (ALLOWED_QUIZ_COVERAGE.has(coverageType)) {
      normalizedQuestion.coverageType = coverageType;
    }

    const difficulty = asTrimmed(qObj.difficulty);
    if (ALLOWED_QUIZ_DIFFICULTY.has(difficulty)) {
      normalizedQuestion.difficulty = difficulty;
    }

    questions.push(normalizedQuestion);
  }

  if (!questions.length) {
    questions.push({
      q: "Quel est le concept principal presente dans ce module ?",
      choices: [
        "Le concept central du module",
        "Un sujet hors programme",
        "Une notion vue dans un autre module",
      ],
      multiple: false,
      answerIndex: 0,
      explanation:
        "La bonne reponse correspond a la notion principale abordee dans ce module. Ce quiz a ete genere automatiquement et peut etre ameliore par l'enseignant.",
    });
  }

  return { quiz: { questions } };
}

function hasLowQualityQuizData(data: Record<string, unknown>): boolean {
  const quiz = asRecord(data.quiz) ?? {};
  const questions = Array.isArray(quiz.questions) ? quiz.questions : [];
  if (questions.length < 3) return true;

  return questions.some((rawQuestion) => {
    const qObj = asRecord(rawQuestion) ?? {};
    const questionText = asTrimmed(qObj.q);
    const choices = toStringArray(qObj.choices);
    const uniqueChoices = choices.filter((choice, idx, arr) => arr.indexOf(choice) === idx);
    const explanation = asTrimmed(qObj.explanation);

    if (!questionText || questionText.length < 12 || looksLikePlaceholderText(questionText)) {
      return true;
    }
    if (uniqueChoices.length < 3) return true;
    if (uniqueChoices.some((choice) => looksLikePlaceholderText(choice))) return true;
    if (!explanation) return true;
    return false;
  });
}

function normalizeExerciseData(rawData: Record<string, unknown>): Record<string, unknown> {
  const rawExercise = asRecord(rawData.exercise) ?? {};
  return {
    exercise: {
      statement: normalizeExerciseSection(
        asString(rawExercise.statement),
        "Exercice a completer.",
      ),
      solution: normalizeExerciseSection(
        asString(rawExercise.solution),
        "Corrige a completer.",
      ),
    },
  };
}

function normalizeDividerData(rawData: Record<string, unknown>): Record<string, unknown> {
  const rawDivider = asRecord(rawData.divider) ?? {};
  const variantRaw = asTrimmed(rawDivider.variant);
  return {
    divider: {
      variant: ALLOWED_DIVIDER_VARIANTS.has(variantRaw) ? variantRaw : "line",
      label: asString(rawDivider.label),
    },
  };
}

function normalizeCodeData(rawData: Record<string, unknown>): Record<string, unknown> {
  const rawCode = asRecord(rawData.code) ?? {};
  return {
    code: {
      language: asTrimmed(rawCode.language) || "plaintext",
      code: asString(rawCode.code),
    },
  };
}

function normalizeMathData(rawData: Record<string, unknown>): Record<string, unknown> {
  const rawMath = asRecord(rawData.math) ?? {};
  const modeRaw = asTrimmed(rawMath.mode);
  return {
    math: {
      mode: ALLOWED_MATH_MODE.has(modeRaw) ? modeRaw : "block",
      latex: asString(rawMath.latex),
      description: asString(rawMath.description),
    },
  };
}

function normalizeImageData(rawData: Record<string, unknown>): Record<string, unknown> {
  const rawImage = asRecord(rawData.image) ?? {};
  return {
    image: {
      url: asString(rawImage.url),
      alt: asString(rawImage.alt),
      caption: asString(rawImage.caption),
    },
  };
}

function normalizeTableData(rawData: Record<string, unknown>): Record<string, unknown> {
  const rawTable = asRecord(rawData.table) ?? {};
  const rawCols = Array.isArray(rawTable.cols) ? rawTable.cols : [];
  const cols = rawCols.map((rawCol, i) => {
    const colObj = asRecord(rawCol) ?? {};
    const id = asTrimmed(colObj.id) || `col_${i + 1}`;
    const label = asTrimmed(colObj.label) || `Colonne ${i + 1}`;
    return { id, label };
  });

  if (!cols.length) cols.push({ id: "col_1", label: "Colonne 1" });

  const rawRows = Array.isArray(rawTable.rows) ? rawTable.rows : [];
  const rows = rawRows.map((rawRow, i) => {
    const rowObj = asRecord(rawRow) ?? {};
    const rowId = asTrimmed(rowObj.id) || `row_${i + 1}`;
    const cellsRecord = asRecord(rowObj.cells) ?? {};
    const cells: Record<string, string> = {};
    for (const col of cols) {
      cells[col.id] = asString(cellsRecord[col.id]);
    }
    return { id: rowId, cells };
  });

  if (!rows.length) {
    rows.push({
      id: "row_1",
      cells: cols.reduce<Record<string, string>>((acc, col) => {
        acc[col.id] = "";
        return acc;
      }, {}),
    });
  }

  return { table: { cols, rows } };
}

function normalizeChartData(rawData: Record<string, unknown>): Record<string, unknown> {
  const rawChart = asRecord(rawData.chart) ?? {};
  const modeRaw = asTrimmed(rawChart.mode).toLowerCase();
  const mode: "data" | "function" | "chronogram" =
    modeRaw === "function"
      ? "function"
      : modeRaw === "chronogram"
        ? "chronogram"
        : "data";

  const rawOptions = asRecord(rawChart.options) ?? {};

  const defaultFunctionSpec = normalizeFunctionSpecInput({
    expr: asTrimmed(rawChart.expr) || "x",
    xMin: rawChart.xMin,
    xMax: rawChart.xMax,
    step: rawChart.step,
    tangents: rawChart.tangents,
    asymptotesX: rawChart.asymptotesX,
    asymptotesY: rawChart.asymptotesY,
  });

  const functionSpec = normalizeFunctionSpecInput(rawChart.functionSpec) ?? defaultFunctionSpec;

  if (mode === "function" && functionSpec) {
    const generated = buildFunctionChartData(functionSpec);
    return {
      chart: {
        chartType: "line",
        mode: "function",
        title: asString(rawChart.title),
        labels: generated.labels,
        datasets: generated.datasets,
        functionSpec,
        options: {
          ...rawOptions,
          asymptotesX: functionSpec.asymptotesX ?? [],
        },
      },
    };
  }

  const chartTypeRaw = asTrimmed(rawChart.chartType);
  const chartType =
    mode === "chronogram"
      ? "chronogram"
      : ALLOWED_CHART_TYPES.has(chartTypeRaw)
        ? chartTypeRaw
        : "line";

  const labels = toStringArray(rawChart.labels);
  const rawDatasets = Array.isArray(rawChart.datasets) ? rawChart.datasets : [];

  const datasets = rawDatasets.map((rawDataset, i) => {
    const dsObj = asRecord(rawDataset) ?? {};
    const data = Array.isArray(dsObj.data)
      ? dsObj.data.map((v) => {
          const n = Number(v);
          return Number.isFinite(n) ? n : 0;
        })
      : [];
    return {
      label: asTrimmed(dsObj.label) || `Serie ${i + 1}`,
      data,
    };
  });

  if (!labels.length) labels.push("0", "1", "2");
  if (!datasets.length) datasets.push({ label: "Serie 1", data: [0, 1, 2] });

  const alignedDatasets = datasets.map((ds) => {
    const values = [...ds.data];
    while (values.length < labels.length) values.push(0);
    return { ...ds, data: values.slice(0, labels.length) };
  });

  return {
    chart: {
      chartType,
      mode: mode === "chronogram" ? "chronogram" : "data",
      title: asString(rawChart.title),
      labels,
      datasets: alignedDatasets,
      options: rawOptions,
    },
  };
}

function normalizeDrawingData(rawData: Record<string, unknown>): Record<string, unknown> {
  const rawDrawing = rawData.drawing;
  if (typeof rawDrawing === "string" && rawDrawing.startsWith("data:image")) {
    return { drawing: rawDrawing };
  }
  return { drawing: "" };
}

function normalizeBlockData(type: BlockType, rawData: Record<string, unknown>): Record<string, unknown> {
  switch (type) {
    case "quiz":
      return normalizeQuizData(rawData);
    case "exercise":
      return normalizeExerciseData(rawData);
    case "divider":
      return normalizeDividerData(rawData);
    case "code":
      return normalizeCodeData(rawData);
    case "math":
      return normalizeMathData(rawData);
    case "image":
      return normalizeImageData(rawData);
    case "table":
      return normalizeTableData(rawData);
    case "chart":
      return normalizeChartData(rawData);
    case "drawing":
      return normalizeDrawingData(rawData);
    default:
      return {};
  }
}

function inferBlockStatus(
  type: BlockType,
  data: Record<string, unknown>,
  text?: string,
): "pending" | "ready" {
  if (type === "exercise") {
    const exercise = asRecord(data.exercise) ?? {};
    const statement = asTrimmed(exercise.statement);
    const solution = asTrimmed(exercise.solution);
    if (!statement || !solution) return "pending";
    // Reject placeholder exercise content
    if (looksLikePlaceholderText(statement) || /^exercice\s+(a|à)\s+completer/i.test(statement)) return "pending";
    if (looksLikePlaceholderText(solution) || /^corrig[eé]\s+(a|à)\s+completer/i.test(solution)) return "pending";
    // Require minimum substance (not just a label)
    if (statement.length < 30 || solution.length < 15) return "pending";
    return "ready";
  }
  if (type === "quiz") {
    return hasLowQualityQuizData(data) ? "pending" : "ready";
  }
  if (type === "content") {
    return hasMinimumPedagogicDensity(text ?? "") ? "ready" : "pending";
  }
  if (type === "image") {
    const image = asRecord(data.image) ?? {};
    return asTrimmed(image.url) ? "ready" : "pending";
  }
  if (type === "drawing") {
    return asTrimmed(data.drawing) ? "ready" : "pending";
  }
  return "ready";
}

function normalizeBlock(rawBlock: unknown, forcedType?: BlockType): Block {
  const blockObj = asRecord(rawBlock) ?? {};
  const type = forcedType ?? ensureBlockType(blockObj.type);
  const baseTextRaw = asString(blockObj.text);
  const baseTitleRaw = asString(blockObj.title);
  const baseText =
    type === "content"
      ? normalizePedagogicContentText(baseTextRaw)
      : type === "exercise"
      ? normalizeStructuredText(baseTextRaw)
      : normalizeInlineText(baseTextRaw);
  const baseTitle = normalizeInlineText(baseTitleRaw);
  const rawData = asRecord(blockObj.data) ?? {};
  const data = normalizeBlockData(type, rawData);

  const title = baseTitle || (type === "title" ? baseText : "");
  const text = type === "title" ? baseText || title || "Titre" : baseText;
  const statusRaw = asTrimmed(blockObj.status);
  const inferredStatus = inferBlockStatus(type, data, text);
  let status =
    statusRaw === "pending" || statusRaw === "ready"
      ? statusRaw
      : inferredStatus;

  if (inferredStatus === "pending") {
    status = "pending";
  }

  return {
    id: asTrimmed(blockObj.id) || uid("block"),
    type,
    text,
    title: title || (type === "quiz" ? "Quiz" : type === "exercise" ? "Exercice" : ""),
    status,
    data,
  };
}

function findFallbackModuleId(course: Course): string {
  if (course.modules.length > 0) return course.modules[0].id;
  return uid("module");
}

function normalizeActions(
  rawActions: unknown,
  input: Pick<GenerationInput, "scope" | "targetModuleId" | "targetBlockId" | "course" | "prompt">,
): Action[] {
  const list = Array.isArray(rawActions) ? rawActions : [];
  const fallbackModuleId = findFallbackModuleId(input.course);
  const allowDecorativeBlocks = /\b(divider|separateur|mise en page|drawing|dessin|tldraw|excalidraw)\b/i.test(
    input.prompt,
  );

  const normalized = list
    .slice(0, 120)
    .map((rawAction) => {
      const actionObj = asRecord(rawAction);
      if (!actionObj) return null;

      const type = ensureActionType(actionObj.type);
      if (!type) return null;

      const block = normalizeBlock(actionObj.block);
      const moduleId =
        asNullableString(actionObj.moduleId) ??
        input.targetModuleId ??
        findModuleIdByBlockId(input.course, input.targetBlockId) ??
        fallbackModuleId;

      const blockId = asNullableString(actionObj.blockId) ?? (type !== "ADD_BLOCK" ? block.id : null);
      const afterBlockId = asNullableString(actionObj.afterBlockId);
      const toModuleId = asNullableString(actionObj.toModuleId);
      const toIndex = asIntegerOrNull(actionObj.toIndex);
      const rawModuleTitle = asNullableString(actionObj.moduleTitle);
      const moduleTitle =
        rawModuleTitle && isGenericModuleTitle(rawModuleTitle)
          ? null
          : rawModuleTitle;

      if (
        !allowDecorativeBlocks &&
        type === "ADD_BLOCK" &&
        (block.type === "divider" || block.type === "drawing")
      ) {
        return null;
      }

      const normalizedBlock =
        type !== "ADD_BLOCK" && blockId ? { ...block, id: blockId } : block;

      const action: Action = {
        type,
        moduleId,
        moduleTitle,
        blockId,
        afterBlockId,
        toModuleId,
        toIndex,
        block: normalizedBlock,
      };
      return action;
    })
    .filter((a): a is Action => a !== null);

  if (input.scope === "ALL") return normalized;

  if (input.scope === "MODULE") {
    if (!input.targetModuleId) return normalized;
    return normalized.filter(
      (a) => a.moduleId === input.targetModuleId || a.toModuleId === input.targetModuleId,
    );
  }

  if (!input.targetBlockId) return normalized;

  return normalized.filter((a) => {
    if (a.type === "UPDATE_BLOCK") {
      return a.blockId === input.targetBlockId || a.block.id === input.targetBlockId;
    }
    if (a.type === "ADD_BLOCK") {
      return a.afterBlockId === input.targetBlockId;
    }
    return false;
  });
}

function parseModelJson(text: string): Record<string, unknown> {
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
      } catch {
        // noop
      }
    }
    throw new CourseGenerationError(500, "Reponse IA non-JSON exploitable");
  }
}

function normalizeInput(body: unknown): GenerationInput {
  const root = asRecord(body);
  if (!root) {
    throw new CourseGenerationError(400, "Payload JSON invalide");
  }

  const modeRaw = asTrimmed(root.mode) as GenerationMode;
  const mode: GenerationMode = ["PLAN", "COMPLETE_MODULE", "SIMPLIFY", "GENERATE_QUIZ"].includes(modeRaw)
    ? modeRaw
    : "PLAN";

  const course = normalizeCourse(root);
  const scope = inferScope(root);
  const targetBlockId = asNullableString(root.targetBlockId);
  const targetModuleId = inferTargetModuleId(root, course, targetBlockId);
  const context = extractContext(root);

  const prompt = asTrimmed(root.prompt) || asString(root.instructions);

  return {
    mode,
    course,
    language: asTrimmed(root.language) || "fr",
    level: asTrimmed(root.level) || "non precise",
    prompt,
    scope,
    targetModuleId,
    targetBlockId,
    extractedData: asNullableString(root.extractedData),
    context,
  };
}

export async function generateCourseActions(
  body: unknown,
  options: { requireDocument: boolean },
): Promise<{ actions: Action[]; usage: AiUsageSummary }> {
  const input = normalizeInput(body);
  const primaryModel =
    asTrimmed(process.env.OPENAI_COURSE_MODEL) || "gpt-4o-mini";
  const fallbackModel =
    asTrimmed(process.env.OPENAI_COURSE_FALLBACK_MODEL) || "gpt-4o";

  if (options.requireDocument && !input.extractedData) {
    throw new CourseGenerationError(400, "extractedData est requis en mode hybride");
  }

  const system = buildSystemPrompt(input);
  const user = buildUserPrompt(input);

  let response:
    | Awaited<ReturnType<typeof openai.responses.create>>
    | null = null;
  let lastError: unknown = null;

  for (const model of [primaryModel, fallbackModel]) {
    if (!model || response) continue;

    try {
      response = await openai.responses.create({
        model,
        input: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "course_actions",
            strict: false,
            schema: outputSchema,
          },
        },
      });
    } catch (error) {
      lastError = error;
      console.error(`courseGeneration failed with model ${model}`, error);
    }
  }

  if (!response) {
    throw new CourseGenerationError(
      500,
      "La generation IA a echoue",
      String(lastError instanceof Error ? lastError.message : lastError ?? ""),
    );
  }

  const jsonText = response.output_text?.trim();
  if (!jsonText) {
    throw new CourseGenerationError(500, "Reponse IA vide");
  }

  const parsed = parseModelJson(jsonText);
  const actions = normalizeActions(parsed.actions, {
    scope: input.scope,
    targetModuleId: input.targetModuleId,
    targetBlockId: input.targetBlockId,
    course: input.course,
    prompt: input.prompt,
  });

  const usageRecord = asRecord((response as unknown as Record<string, unknown>).usage) ?? {};
  const inputTokens = Math.max(
    0,
    Number(
      usageRecord.input_tokens ??
        usageRecord.prompt_tokens ??
        usageRecord.inputTokens ??
        0,
    ),
  );
  const outputTokens = Math.max(
    0,
    Number(
      usageRecord.output_tokens ??
        usageRecord.completion_tokens ??
        usageRecord.outputTokens ??
        0,
    ),
  );
  const totalTokens = Math.max(
    0,
    Number(usageRecord.total_tokens ?? usageRecord.totalTokens ?? inputTokens + outputTokens),
  );
  const creditsPer1kTokens = Math.max(
    0,
    Number(process.env.OPENAI_CREDITS_PER_1K_TOKENS ?? "1"),
  );
  const consumedCredits = Number(
    ((totalTokens / 1000) * creditsPer1kTokens).toFixed(3),
  );

  return {
    actions,
    usage: {
      inputTokens,
      outputTokens,
      totalTokens,
      consumedCredits,
    },
  };
}

