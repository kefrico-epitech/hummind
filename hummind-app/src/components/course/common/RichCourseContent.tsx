"use client";

import { type ReactNode } from "react";
import { cn } from "../../../lib/utils";

// ─── LaTeX inline rendering ───
// Lazy-loaded to avoid bundling KaTeX for non-math courses
let BlockMath: React.ComponentType<{ math: string; errorColor?: string }> | null = null;
let InlineMath: React.ComponentType<{ math: string; errorColor?: string }> | null = null;
let katexLoaded = false;

function ensureKatex() {
  if (katexLoaded) return;
  katexLoaded = true;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const rk = require("react-katex");
    BlockMath = rk.BlockMath;
    InlineMath = rk.InlineMath;
  } catch {
    // react-katex not available — formulas render as text
  }
}

/**
 * Parses a string containing $...$ (inline) and $$...$$ (block) LaTeX
 * and returns an array of ReactNodes with KaTeX rendering.
 */
function renderTextWithLatex(text: string, keyPrefix: string): ReactNode {
  // Quick check: if no $ at all, return plain text
  if (!text.includes("$")) return text;

  ensureKatex();
  if (!InlineMath || !BlockMath) return text;

  const ILM = InlineMath;
  const BLM = BlockMath;

  // Split on $$...$$ (block), \[...\] (block), $...$ (inline), \(...\) (inline)
  const parts: ReactNode[] = [];
  const regex = /\$\$([^$]+?)\$\$|\\\[([^\]]+?)\\\]|\$([^$]+?)\$|\\\(([^)]+?)\\\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let partIdx = 0;

  while ((match = regex.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const blockLatex = match[1] ?? match[2]; // $$...$$ or \[...\]
    const inlineLatex = match[3] ?? match[4]; // $...$ or \(...\)

    if (blockLatex) {
      parts.push(
        <BLM key={`${keyPrefix}-bm-${partIdx}`} math={blockLatex.trim()} errorColor="#ff6b6b" />,
      );
    } else if (inlineLatex) {
      parts.push(
        <ILM key={`${keyPrefix}-im-${partIdx}`} math={inlineLatex.trim()} errorColor="#ff6b6b" />,
      );
    }

    lastIndex = match.index + match[0].length;
    partIdx++;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}

type RichContentBlock =
  | { type: "section"; label: string; tone: "accent" | "success" | "neutral" }
  | { type: "list"; ordered: boolean; items: string[]; start?: number }
  | { type: "paragraph"; text: string; emphasized: boolean };

type RichCourseContentProps = {
  content: string | string[];
  idPrefix: string;
  className?: string;
  emptyLabel?: string;
  size?: "sm" | "md";
};

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
      regex: /^(objectifs?(?: du chapitre| du module)?)\s*:?\s*(.*)$/iu,
      tone: "success" as const,
    },
    {
      regex:
        /^(a retenir|point[- ]cle(?:\s+a\s+retenir)?|points[- ]cles)\s*:?\s*(.*)$/iu,
      tone: "accent" as const,
    },
    {
      regex:
        /^(exemple(?: concret)?(?:\s*\([^)]+\))?|cas pratique|mise en pratique)\s*:?\s*(.*)$/iu,
      tone: "accent" as const,
    },
    {
      regex:
        /^(definition|notion cle|notions? et outils essentiels|verification rapide|attention|methode|role symbolique|place dans les symboles nationaux)\s*:?\s*(.*)$/iu,
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

  const unorderedMatch = trimmed.match(/^[-*\u2022]\s+(.+)$/u);
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

function parseOrderedListItem(value: string): { text: string; start: number } | null {
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

// Fix markers at render time for existing courses with bad formatting
const CONTENT_MARKER_BREAK =
  /\s+(?=(?:Objectifs?(?: du chapitre| du module)?|D[eé]finitions? essentielles?|D[eé]finition|Exemple(?: concret)?|Point[- ]cl[eé]s?(?: [aà] retenir)?|Points?[- ]cl[eé]s?|Cas pratique|Mise en pratique|V[eé]rification rapide|M[eé]thode|Explication)\s*:)/giu;
const CONTENT_MARKER_AFTER =
  /((?:Objectifs?(?: du chapitre| du module)?|D[eé]finitions? essentielles?|D[eé]finition|Exemple(?: concret)?|Point[- ]cl[eé]s?(?: [aà] retenir)?|Points?[- ]cl[eé]s?|Cas pratique|Mise en pratique|V[eé]rification rapide|M[eé]thode|Explication)\s*:)[ \t]+/giu;
const CONTENT_BROKEN_MARKER =
  /Point[- ]cl[eé]s?[\s\n]+[aà]\s+retenir\s*:/giu;

function normalizeInputContent(content: string | string[]) {
  if (Array.isArray(content)) {
    return content
      .map((item) => item.trim())
      .filter(Boolean);
  }

  const fixed = content
    .replace(/\r\n/g, "\n")
    .replace(CONTENT_BROKEN_MARKER, "Point-cle a retenir:")
    .replace(CONTENT_MARKER_BREAK, "\n\n")
    .replace(CONTENT_MARKER_AFTER, "$1\n")
    .replace(/\n{3,}/g, "\n\n");

  return fixed
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function RichCourseContent({
  content,
  idPrefix,
  className,
  emptyLabel = "—",
  size = "sm",
}: RichCourseContentProps) {
  const paragraphs = normalizeInputContent(content);
  const blocks = buildRichContentBlocks(paragraphs);

  if (!blocks.length) {
    return <p className="text-sm text-white/55">{emptyLabel}</p>;
  }

  const paragraphClassName =
    size === "md" ? "text-[0.95rem] leading-7" : "text-sm leading-6";
  const sectionClassName =
    size === "md"
      ? "rounded-full px-2.5 py-1 text-[0.72rem]"
      : "rounded-full px-2.5 py-1 text-[0.68rem]";

  return (
    <div className={cn("space-y-3.5 text-white/84", paragraphClassName, className)}>
      {blocks.map((block, blockIndex) => {
        if (block.type === "section") {
          return (
            <div
              key={`${idPrefix}-section-${blockIndex}`}
              className={cn(
                "inline-flex font-semibold uppercase tracking-[0.14em]",
                sectionClassName,
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
              key={`${idPrefix}-list-${blockIndex}`}
              start={block.ordered ? block.start : undefined}
              className={cn(
                "space-y-2 pl-5 text-white/88",
                block.ordered ? "list-decimal" : "list-disc",
              )}
            >
              {block.items.map((item, itemIndex) => (
                <li
                  key={`${idPrefix}-list-${blockIndex}-${itemIndex}`}
                  className="pl-1"
                >
                  {renderTextWithLatex(item, `${idPrefix}-li-${blockIndex}-${itemIndex}`)}
                </li>
              ))}
            </ListTag>
          );
        }

        return (
          <p
            key={`${idPrefix}-paragraph-${blockIndex}`}
            className={cn(block.emphasized ? "font-semibold text-white/96" : "")}
          >
            {renderTextWithLatex(block.text, `${idPrefix}-p-${blockIndex}`)}
          </p>
        );
      })}
    </div>
  );
}
