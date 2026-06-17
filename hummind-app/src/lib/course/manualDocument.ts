type ManualQuizQuestion = {
  q?: string;
  choices?: string[];
  answerIndex?: number;
  answerIndexes?: number[];
  multiple?: boolean;
  explanation?: string;
};

type ManualBlockData = {
  quiz?: { questions?: ManualQuizQuestion[] };
  exercise?: { statement?: string; solution?: string };
  divider?: { variant?: string; label?: string };
  code?: { language?: string; code?: string };
  math?: { latex?: string; description?: string };
  image?: {
    url?: string;
    alt?: string;
    caption?: string;
    width?: number;
    height?: number;
  };
  table?: {
    cols?: { id?: string; label?: string }[];
    rows?: { id?: string; cells?: Record<string, string> }[];
  };
  chart?: {
    chartType?: "line" | "bar" | "pie" | "chronogram";
    title?: string;
    labels?: string[];
    datasets?: { label?: string; data?: number[] }[];
    mode?: "data" | "function" | "chronogram";
    functionSpec?: {
      expr?: string;
      xMin?: number;
      xMax?: number;
      step?: number;
      tangents?: number[];
      asymptotesX?: number[];
      asymptotesY?: number[];
    };
  };
  drawing?: unknown;
};

export type ManualRenderableBlock = {
  id?: string;
  type?: string;
  title?: string;
  text?: string;
  status?: string;
  data?: ManualBlockData;
};

export type ManualRenderableModule = {
  id?: string;
  title?: string;
  blocks?: ManualRenderableBlock[];
};

export type ManualDocumentMeta = {
  title: string;
  description?: string;
  domain?: string;
  level?: string;
  objectives?: string[];
};

export type ManualDocumentRenderOptions = {
  screenScale?: number;
};

export type ManualDocumentStats = {
  chapterCount: number;
  sectionCount: number;
  activityCount: number;
  figureCount: number;
};

export type ManualDocumentOutlineItem = {
  id: string;
  label: string;
  pageNumber: number;
};

const CHART_COLORS = ["#0f766e", "#2563eb", "#b45309", "#be123c", "#7c3aed"];
const GENERIC_HEADING_PATTERNS = [
  /^module\s*\d*$/i,
  /^chapitre\s*\d*$/i,
  /^introduction$/i,
  /^conclusion$/i,
  /^resume$/i,
  /^sans titre$/i,
];
const PLACEHOLDER_PATTERNS = [
  /^quiz a valider/i,
  /^complete ce quiz/i,
  /^proposition [abc]/i,
  /^exercice a completer/i,
  /^corrige a completer/i,
  /^non renseigne/i,
  /^question\s*\d+$/i,
  /^choix\s*\d+$/i,
];

function esc(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

// ─── KaTeX server-side rendering for manual/PDF ───
let katexModule: { renderToString: (latex: string, opts?: Record<string, unknown>) => string } | null = null;
let katexLoadAttempted = false;

function getKatex() {
  if (katexLoadAttempted) return katexModule;
  katexLoadAttempted = true;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    katexModule = require("katex") as typeof katexModule;
  } catch { /* katex not available */ }
  return katexModule;
}

function renderLatexToHtml(latex: string, displayMode: boolean): string {
  const katex = getKatex();
  if (!katex) return esc(latex);
  try {
    return katex.renderToString(latex, {
      displayMode,
      throwOnError: false,
      output: "html",
    });
  } catch {
    return `<code>${esc(latex)}</code>`;
  }
}

/**
 * Replace $...$ (inline), $$...$$ (display), \(...\) (inline), \[...\] (display)
 * with KaTeX-rendered HTML in an already-escaped HTML string.
 * Must be called AFTER esc() since it produces raw HTML.
 */
function renderLatexInText(escapedHtml: string): string {
  const katex = getKatex();
  if (!katex) return escapedHtml;

  let result = escapedHtml;

  // $$...$$ display math (non-greedy)
  result = result.replace(/\$\$([^$]+?)\$\$/g, (_, latex) => {
    const raw = latex.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    return `<div style="text-align:center;margin:8px 0;">${renderLatexToHtml(raw, true)}</div>`;
  });

  // \[...\] display math
  result = result.replace(/\\\[([^\]]+?)\\\]/g, (_, latex) => {
    const raw = latex.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    return `<div style="text-align:center;margin:8px 0;">${renderLatexToHtml(raw, true)}</div>`;
  });

  // $...$ inline math (non-greedy, not preceded/followed by $)
  result = result.replace(/\$([^$]+?)\$/g, (_, latex) => {
    const raw = latex.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    return renderLatexToHtml(raw, false);
  });

  // \(...\) inline math
  result = result.replace(/\\\(([^)]+?)\\\)/g, (_, latex) => {
    const raw = latex.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    return renderLatexToHtml(raw, false);
  });

  // **..** bold markdown
  result = result.replace(/\*\*([^*]+?)\*\*/g, "<strong>$1</strong>");

  return result;
}

function safeTitle(value: string, fallback: string) {
  return value.trim() ? value.trim() : fallback;
}

function looksPlaceholder(value: string) {
  const clean = value.trim();
  if (!clean) return true;
  return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(clean));
}

function isGenericHeading(value: string) {
  const clean = value.trim();
  if (!clean) return true;
  return GENERIC_HEADING_PATTERNS.some((pattern) => pattern.test(clean));
}

function toArray<T>(value: T[] | undefined | null): T[] {
  return Array.isArray(value) ? value : [];
}

function normalizeObjectives(objectives?: string[]) {
  return toArray(objectives).map((item) => text(item)).filter(Boolean);
}

function getChapterTitle(courseModule: ManualRenderableModule, index: number) {
  const moduleTitle = text(courseModule.title);
  if (moduleTitle && !isGenericHeading(moduleTitle)) return moduleTitle;

  for (const block of toArray(courseModule.blocks)) {
    if (text(block.type).toLowerCase() !== "title") continue;
    const candidate = text(block.text) || text(block.title);
    if (candidate && !isGenericHeading(candidate)) return candidate;
  }

  return `Chapitre ${index + 1}`;
}

export function getManualDocumentOutline(
  modules: ManualRenderableModule[],
): ManualDocumentOutlineItem[] {
  const safeModules = toArray(modules);
  return [
    { id: "page-cover", label: "Couverture", pageNumber: 1 },
    { id: "page-toc", label: "Sommaire", pageNumber: 2 },
    ...safeModules.map((courseModule, index) => ({
      id: `chapter-${index + 1}`,
      label: getChapterTitle(courseModule, index),
      pageNumber: index + 3,
    })),
  ];
}

// Fix marker formatting at render time (for existing courses with bad formatting)
const RENDER_MARKER_BREAK =
  /\s+(?=(?:Objectifs?(?: du chapitre| du module)?|D[eé]finitions? essentielles?|D[eé]finition|Exemple(?: concret)?|Point[- ]cl[eé]s?(?: [aà] retenir)?|Points?[- ]cl[eé]s?|Cas pratique|Mise en pratique|V[eé]rification rapide|M[eé]thode|Explication)\s*:)/giu;
const RENDER_MARKER_AFTER_COLON =
  /((?:Objectifs?(?: du chapitre| du module)?|D[eé]finitions? essentielles?|D[eé]finition|Exemple(?: concret)?|Point[- ]cl[eé]s?(?: [aà] retenir)?|Points?[- ]cl[eé]s?|Cas pratique|Mise en pratique|V[eé]rification rapide|M[eé]thode|Explication)\s*:)[ \t]+/giu;
const RENDER_BROKEN_MARKER =
  /Point[- ]cl[eé]s?[\s\n]+[aà]\s+retenir\s*:/giu;

function splitRichText(textValue: string) {
  // Fix markers before splitting
  const fixed = textValue
    .replace(/\r\n/g, "\n")
    .replace(RENDER_BROKEN_MARKER, "Point-cle a retenir:")
    .replace(RENDER_MARKER_BREAK, "\n\n")
    .replace(RENDER_MARKER_AFTER_COLON, "$1\n")
    .replace(/\n{3,}/g, "\n\n");

  return fixed
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);
}

// Detect semantic marker labels for styled rendering
const MARKER_LABEL_PATTERN =
  /^(Objectifs?(?: du chapitre| du module)?|D[eé]finitions? essentielles?|D[eé]finition|Exemple(?: concret)?(?:\s*\([^)]+\))?|Point[- ]cl[eé]s?(?: [aà] retenir)?|Points?[- ]cl[eé]s?|[AÀ] retenir|Cas pratique|Mise en pratique|V[eé]rification rapide|M[eé]thode|Explication)\s*:?\s*$/iu;

function getMarkerTone(label: string): "success" | "accent" | "neutral" {
  const lower = label.toLowerCase();
  if (/objectif/i.test(lower)) return "success";
  if (/point|retenir|exemple|cas pratique/i.test(lower)) return "accent";
  return "neutral";
}

const MARKER_TONE_STYLES = {
  success: "background: #ecfdf5; border-left: 3px solid #10b981; color: #065f46;",
  accent: "background: #f5f3ff; border-left: 3px solid #7c3aed; color: #4c1d95;",
  neutral: "background: #f8fafc; border-left: 3px solid #94a3b8; color: #334155;",
};

// Render backticks as inline code, then LaTeX, then markdown bold
function escWithCode(value: string): string {
  const escaped = esc(value).replace(/`([^`]+)`/g, '<code style="background:#f1f5f9;padding:1px 4px;border-radius:3px;font-family:Consolas,monospace;font-size:11pt;">$1</code>');
  return renderLatexInText(escaped);
}

function renderRichText(textValue: string) {
  const chunks = splitRichText(textValue);
  if (!chunks.length) {
    return `<p class="muted">Contenu à finaliser.</p>`;
  }

  return chunks
    .map((chunk) => {
      const lines = chunk
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      if (!lines.length) return "";

      // Check if first line is a semantic marker
      if (lines.length >= 1 && MARKER_LABEL_PATTERN.test(lines[0])) {
        const label = lines[0].replace(/:\s*$/, "");
        const tone = getMarkerTone(label);
        const style = MARKER_TONE_STYLES[tone];
        const content = lines.slice(1);
        const contentHtml = content.length > 0
          ? `<p style="margin-top:6px;">${escWithCode(content.join(" "))}</p>`
          : "";
        return `<div class="marker-badge" style="padding:8px 12px;margin:10px 0;${style}font-family:Arial,sans-serif;font-size:11pt;page-break-inside:avoid;"><strong style="text-transform:uppercase;font-size:9pt;letter-spacing:0.1em;">${esc(label)}</strong>${contentHtml}</div>`;
      }

      const ordered = lines.every((line) => /^\d+[\.\-\)]\s+/.test(line));
      if (ordered) {
        return `<ol>${lines
          .map((line) => line.replace(/^\d+[\.\-\)]\s+/, ""))
          .map((line) => `<li>${escWithCode(line)}</li>`)
          .join("")}</ol>`;
      }

      const bulleted = lines.every((line) => /^[-*]\s+/.test(line));
      if (bulleted) {
        return `<ul>${lines
          .map((line) => line.replace(/^[-*]\s+/, ""))
          .map((line) => `<li>${escWithCode(line)}</li>`)
          .join("")}</ul>`;
      }

      return `<p>${escWithCode(lines.join("\n")).replace(/\n/g, "<br />")}</p>`;
    })
    .join("");
}

function extractDrawingPreview(drawingRaw: unknown): string {
  if (typeof drawingRaw === "string") {
    if (drawingRaw.startsWith("data:image")) return drawingRaw;

    try {
      const parsed = JSON.parse(drawingRaw) as
        | { preview?: string; drawing?: string }
        | undefined;
      if (typeof parsed?.preview === "string" && parsed.preview.startsWith("data:image")) {
        return parsed.preview;
      }
      if (typeof parsed?.drawing === "string" && parsed.drawing.startsWith("data:image")) {
        return parsed.drawing;
      }
    } catch {
      return "";
    }
  }

  if (drawingRaw && typeof drawingRaw === "object") {
    const candidate = drawingRaw as { preview?: string; drawing?: string };
    if (typeof candidate.preview === "string" && candidate.preview.startsWith("data:image")) {
      return candidate.preview;
    }
    if (typeof candidate.drawing === "string" && candidate.drawing.startsWith("data:image")) {
      return candidate.drawing;
    }
  }

  return "";
}

function svgDataUrl(svg: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function toChartSeries(chart: ManualBlockData["chart"]) {
  const rawLabels = toArray(chart?.labels).map((label) => `${label ?? ""}`);
  const rawSets = toArray(chart?.datasets);
  const maxDataLen = rawSets.reduce(
    (acc, dataset) => Math.max(acc, toArray(dataset.data).length),
    0,
  );
  const labels =
    rawLabels.length > 0
      ? rawLabels
      : Array.from({ length: maxDataLen }, (_, index) => `P${index + 1}`);
  const length = labels.length;

  const datasets = rawSets
    .map((dataset, index) => ({
      label: text(dataset.label) || `Serie ${index + 1}`,
      values: Array.from({ length }, (_, valueIndex) => {
        const value = Number(toArray(dataset.data)[valueIndex]);
        return Number.isFinite(value) ? value : 0;
      }),
      color: CHART_COLORS[index % CHART_COLORS.length],
    }))
    .filter((dataset) => dataset.values.length > 0);

  return { labels, datasets };
}

function buildLineOrBarSvg(chart: ManualBlockData["chart"], stepped = false) {
  const { labels, datasets } = toChartSeries(chart);
  if (!labels.length || !datasets.length) return "";

  const width = 920;
  const height = 420;
  const left = 70;
  const right = 24;
  const top = 24;
  const bottom = 56;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;

  const allValues = datasets.flatMap((dataset) => dataset.values);
  let min = Math.min(...allValues);
  let max = Math.max(...allValues);
  if (min === max) {
    min -= 1;
    max += 1;
  }

  const xForIndex = (index: number) =>
    left + (index * plotWidth) / Math.max(labels.length - 1, 1);
  const yForValue = (value: number) =>
    top + ((max - value) / (max - min)) * plotHeight;
  const zeroY = Math.min(top + plotHeight, Math.max(top, yForValue(0)));

  const grid = Array.from({ length: 6 }, (_, index) => {
    const ratio = index / 5;
    const y = top + ratio * plotHeight;
    const value = max - ratio * (max - min);
    return `<g>
      <line x1="${left}" y1="${y.toFixed(2)}" x2="${left + plotWidth}" y2="${y.toFixed(2)}" stroke="#dbe4ee" stroke-width="1" />
      <text x="${left - 8}" y="${(y + 4).toFixed(2)}" text-anchor="end" fill="#64748b" font-size="11">${esc(value.toFixed(2))}</text>
    </g>`;
  }).join("");

  const axisLabels = labels
    .map((label, index) => ({ label, index }))
    .filter(
      ({ index }) =>
        index === labels.length - 1 ||
        index % Math.max(1, Math.ceil(labels.length / 10)) === 0,
    )
    .map(({ label, index }) => {
      const x = xForIndex(index);
      return `<text x="${x.toFixed(2)}" y="${height - 20}" text-anchor="middle" fill="#64748b" font-size="11">${esc(label)}</text>`;
    })
    .join("");

  let shapes = "";
  if ((chart?.chartType ?? "line") === "bar") {
    const groupWidth = plotWidth / Math.max(labels.length, 1);
    const barWidth = (groupWidth * 0.76) / Math.max(datasets.length, 1);

    shapes = datasets
      .map((dataset, datasetIndex) =>
        dataset.values
          .map((value, index) => {
            const x =
              left + index * groupWidth + groupWidth * 0.12 + datasetIndex * barWidth;
            const y = yForValue(value);
            const startY = Math.min(y, zeroY);
            const heightValue = Math.max(1, Math.abs(zeroY - y));
            return `<rect x="${x.toFixed(2)}" y="${startY.toFixed(2)}" width="${Math.max(1, barWidth - 2).toFixed(2)}" height="${heightValue.toFixed(2)}" fill="${dataset.color}" opacity="0.84" />`;
          })
          .join(""),
      )
      .join("");
  } else {
    shapes = datasets
      .map((dataset) => {
        const points = dataset.values.map((value, index) => ({
          x: xForIndex(index),
          y: yForValue(value),
        }));

        const polyline = stepped
          ? points
              .flatMap((point, index) => {
                if (index === 0) return [point];
                const previous = points[index - 1];
                return [{ x: point.x, y: previous.y }, point];
              })
              .map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`)
              .join(" ")
          : points
              .map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`)
              .join(" ");

        const dots = points
          .map(
            (point) =>
              `<circle cx="${point.x.toFixed(2)}" cy="${point.y.toFixed(2)}" r="2.4" fill="${dataset.color}" />`,
          )
          .join("");

        return `<polyline points="${polyline}" fill="none" stroke="${dataset.color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />${dots}`;
      })
      .join("");
  }

  const legend = datasets
    .map(
      (dataset, index) =>
        `<g transform="translate(${left + index * 170}, ${height - 2})">
          <rect x="0" y="-10" width="12" height="12" rx="2" fill="${dataset.color}" />
          <text x="18" y="0" fill="#334155" font-size="11">${esc(dataset.label)}</text>
        </g>`,
    )
    .join("");

  return svgDataUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect x="0" y="0" width="${width}" height="${height}" fill="#ffffff" />
    ${grid}
    <line x1="${left}" y1="${zeroY.toFixed(2)}" x2="${left + plotWidth}" y2="${zeroY.toFixed(2)}" stroke="#334155" stroke-width="1.2" />
    <line x1="${left}" y1="${top}" x2="${left}" y2="${top + plotHeight}" stroke="#334155" stroke-width="1.2" />
    ${shapes}
    ${axisLabels}
    ${legend}
  </svg>`);
}

function buildPieSvg(chart: ManualBlockData["chart"]) {
  const { datasets } = toChartSeries(chart);
  const values = (datasets[0]?.values ?? []).filter(
    (value) => Number.isFinite(value) && value > 0,
  );
  if (!values.length) return "";

  const width = 920;
  const height = 420;
  const cx = 250;
  const cy = 210;
  const radius = 140;
  const total = values.reduce((acc, value) => acc + value, 0);

  let angle = -Math.PI / 2;
  const slices = values
    .map((value, index) => {
      const arc = (value / total) * Math.PI * 2;
      const x1 = cx + radius * Math.cos(angle);
      const y1 = cy + radius * Math.sin(angle);
      const x2 = cx + radius * Math.cos(angle + arc);
      const y2 = cy + radius * Math.sin(angle + arc);
      const largeArc = arc > Math.PI ? 1 : 0;
      const color = CHART_COLORS[index % CHART_COLORS.length];
      angle += arc;
      return `<path d="M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${radius} ${radius} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z" fill="${color}" opacity="0.86" />`;
    })
    .join("");

  const legend = values
    .map((value, index) => {
      const percent = ((value / total) * 100).toFixed(1);
      const color = CHART_COLORS[index % CHART_COLORS.length];
      return `<g transform="translate(500, ${72 + index * 28})">
        <rect x="0" y="-10" width="12" height="12" rx="2" fill="${color}" />
        <text x="18" y="0" fill="#334155" font-size="12">Valeur ${index + 1}: ${esc(value.toFixed(2))} (${percent}%)</text>
      </g>`;
    })
    .join("");

  return svgDataUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect x="0" y="0" width="${width}" height="${height}" fill="#ffffff" />
    ${slices}
    ${legend}
  </svg>`);
}

function buildChartSvgDataUrl(chart: ManualBlockData["chart"]) {
  if (!chart) return "";
  if (chart.chartType === "pie") return buildPieSvg(chart);
  if (chart.chartType === "bar") return buildLineOrBarSvg(chart, false);
  if (chart.chartType === "chronogram") return buildLineOrBarSvg(chart, true);
  return buildLineOrBarSvg(chart, false);
}

function formatQuizCorrection(question: ManualQuizQuestion) {
  const choices = toArray(question.choices).map((choice) => text(choice));

  if (question.multiple) {
    const indexes = toArray(question.answerIndexes);
    if (!indexes.length) return "Correction a finaliser.";
    const answers = indexes
      .map((index) => {
        const choice = choices[index];
        if (!choice) return `Reponse ${index + 1}`;
        return `${index + 1}. ${choice}`;
      })
      .join(" ; ");
    return `Bonne(s) reponse(s) : ${answers}`;
  }

  if (typeof question.answerIndex === "number") {
    const answer = choices[question.answerIndex];
    if (answer) {
      return `Bonne reponse : ${question.answerIndex + 1}. ${answer}`;
    }
    return `Bonne reponse : ${question.answerIndex + 1}`;
  }

  return "Correction a finaliser.";
}

function hasPrintableQuiz(block: ManualRenderableBlock) {
  const questions = toArray(block.data?.quiz?.questions);
  if (!questions.length) return false;

  return questions.some((question) => {
    const questionText = text(question.q);
    const choices = toArray(question.choices)
      .map((choice) => text(choice))
      .filter(Boolean);
    const hasAnswer =
      typeof question.answerIndex === "number" ||
      toArray(question.answerIndexes).length > 0;
    const hasExplanation = text(question.explanation) !== "";
    return (
      (!looksPlaceholder(questionText) && questionText !== "") ||
      choices.length > 0 ||
      hasAnswer ||
      hasExplanation
    );
  });
}

function hasPrintableExercise(block: ManualRenderableBlock) {
  const statement = text(block.data?.exercise?.statement);
  const solution = text(block.data?.exercise?.solution);
  return (
    (statement !== "" && !looksPlaceholder(statement)) ||
    (solution !== "" && !looksPlaceholder(solution))
  );
}

function renderQuizBlock(block: ManualRenderableBlock, blockIndex: number) {
  if (!hasPrintableQuiz(block)) {
    return `<section class="pedagogic-card assessment-card">
      <p class="card-kicker">Verification rapide</p>
      <p class="muted">Section d'evaluation a finaliser.</p>
    </section>`;
  }

  const title = text(block.title);
  const visibleTitle =
    title && !/^quiz$/i.test(title) ? `<h4>${esc(title)}</h4>` : "";
  const questions = toArray(block.data?.quiz?.questions)
    .filter((question) => {
      const questionText = text(question.q);
      const choices = toArray(question.choices)
        .map((choice) => text(choice))
        .filter(Boolean);
      const hasAnswer =
        typeof question.answerIndex === "number" ||
        toArray(question.answerIndexes).length > 0;
      const hasExplanation = text(question.explanation) !== "";
      return (
        (!looksPlaceholder(questionText) && questionText !== "") ||
        choices.length > 0 ||
        hasAnswer ||
        hasExplanation
      );
    })
    .map((question, questionIndex) => {
      const choicesHtml = toArray(question.choices)
        .map((choice) => text(choice))
        .filter(Boolean)
        .map((choice) => `<li>${esc(choice)}</li>`)
        .join("");
      const questionLabel = text(question.q);
      const explanation = text(question.explanation)
        ? `<p class="note"><strong>Repere pedagogique :</strong> ${esc(
            text(question.explanation),
          )}</p>`
        : "";

      return `<article class="question">
        <p><strong>${blockIndex + 1}.${questionIndex + 1}</strong> ${esc(
          questionLabel || `Question ${questionIndex + 1}`,
        )}</p>
        ${choicesHtml ? `<ol>${choicesHtml}</ol>` : `<p class="muted">Choix a completer.</p>`}
        <p class="note">${esc(formatQuizCorrection(question))}</p>
        ${explanation}
      </article>`;
    })
    .join("");

  return `<section class="pedagogic-card assessment-card">
    <p class="card-kicker">Verification rapide</p>
    ${visibleTitle}
    ${questions}
  </section>`;
}

function renderExerciseBlock(block: ManualRenderableBlock) {
  if (!hasPrintableExercise(block)) {
    return `<section class="pedagogic-card practice-card">
      <p class="card-kicker">Mise en pratique</p>
      <p class="muted">Exercice a finaliser.</p>
    </section>`;
  }

  const title = text(block.title);
  const visibleTitle =
    title && !/^exercice$/i.test(title) ? `<h4>${esc(title)}</h4>` : "";
  const statement = text(block.data?.exercise?.statement);
  const solution = text(block.data?.exercise?.solution);

  return `<section class="pedagogic-card practice-card">
    <p class="card-kicker">Mise en pratique</p>
    ${visibleTitle}
    ${
      statement && !looksPlaceholder(statement)
        ? `<p class="label">Exercice</p>
    <div class="rich-text">${renderRichText(statement)}</div>`
        : `<p class="label">Exercice</p><p class="muted">Consigne a finaliser.</p>`
    }
    ${
      solution && !looksPlaceholder(solution)
        ? `<p class="label">Reponse attendue</p>
    <div class="rich-text">${renderRichText(solution)}</div>`
        : `<p class="label">Reponse attendue</p><p class="muted">Correction a completer.</p>`
    }
  </section>`;
}

function renderTableBlock(block: ManualRenderableBlock, tableIndex: number) {
  const table = block.data?.table;
  const cols = toArray(table?.cols).map((col, index) => ({
    id: text(col.id) || `col_${index + 1}`,
    label: text(col.label) || `Colonne ${index + 1}`,
  }));
  const rows = toArray(table?.rows);

  if (!cols.length) {
    return `<section class="manual-block">
      <p class="muted">Tableau ${tableIndex} a finaliser.</p>
    </section>`;
  }

  const header = cols.map((col) => `<th>${esc(col.label)}</th>`).join("");
  const body =
    rows.length === 0
      ? `<tr><td colspan="${cols.length}">Aucune ligne.</td></tr>`
      : rows
          .map((row) => {
            const cells = row.cells ?? {};
            return `<tr>${cols
              .map((col) => `<td>${esc(`${cells[col.id] ?? "-"}`)}</td>`)
              .join("")}</tr>`;
          })
          .join("");

  const caption = text(block.title) || `Tableau ${tableIndex}`;
  return `<section class="manual-block">
    <p class="figure-label">Tableau ${tableIndex}</p>
    <h4>${esc(caption)}</h4>
    <table><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table>
  </section>`;
}

function resolveFigureSizing(block: ManualRenderableBlock) {
  const width = Number(block.data?.image?.width);
  const height = Number(block.data?.image?.height);
  const hasMetrics = Number.isFinite(width) && width > 0 && Number.isFinite(height) && height > 0;
  const ratio = hasMetrics ? width / height : 16 / 9;

  const editorBaseHeight = ratio >= 1 ? 280 : 360;
  const previewBaseHeight = editorBaseHeight * 0.8;
  const derivedWidth = previewBaseHeight * ratio;

  const maxWidthMm = Math.min(150, Math.max(62, derivedWidth / 3.78));
  const maxHeightMm = Math.min(105, Math.max(48, previewBaseHeight / 3.78));

  const aspectRatio = hasMetrics
    ? `${Math.round(width)} / ${Math.round(height)}`
    : ratio >= 1
      ? "16 / 9"
      : "3 / 4";

  return {
    maxWidthMm,
    maxHeightMm,
    aspectRatio,
  };
}

function renderFigureBlock(
  block: ManualRenderableBlock,
  figureIndex: number,
  imageUrl: string,
  fallbackAlt: string,
) {
  const title = text(block.title) || fallbackAlt;
  const caption = text(block.data?.image?.caption) || title;
  const sizing = resolveFigureSizing(block);
  return `<section class="manual-block figure-block">
    <p class="figure-label">Figure ${figureIndex}</p>
    <h4>${esc(title)}</h4>
    <figure style="--figure-max-width:${sizing.maxWidthMm.toFixed(2)}mm; --figure-max-height:${sizing.maxHeightMm.toFixed(2)}mm; --figure-aspect-ratio:${sizing.aspectRatio};">
      <div class="figure-media">
        <img src="${esc(imageUrl)}" alt="${esc(text(block.data?.image?.alt) || fallbackAlt)}" />
      </div>
      <figcaption>${esc(caption)}</figcaption>
    </figure>
  </section>`;
}

function renderSupplementBlock(
  block: ManualRenderableBlock,
  titleValue: string,
  bodyHtml: string,
) {
  return `<section class="manual-block">
    <h4>${esc(text(block.title) || titleValue)}</h4>
    ${bodyHtml}
  </section>`;
}

function renderChapter(
  courseModule: ManualRenderableModule,
  chapterIndex: number,
  counters: { figure: number; table: number },
) {
  const chapterTitle = getChapterTitle(courseModule, chapterIndex);
  const chapterId = `chapter-${chapterIndex + 1}`;
  let lastHeading = chapterTitle.toLowerCase();

  const blocksHtml = toArray(courseModule.blocks)
    .map((block, blockIndex) => {
      const type = text(block.type).toLowerCase();

      if (type === "title") {
        const sectionTitle = text(block.text) || text(block.title);
        if (!sectionTitle || sectionTitle.toLowerCase() === lastHeading) return "";
        lastHeading = sectionTitle.toLowerCase();
        return `<h3 class="section-title">${esc(sectionTitle)}</h3>`;
      }

      if (type === "content") {
        const contentTitle = text(block.title);
        const headingHtml =
          contentTitle &&
          contentTitle.toLowerCase() !== lastHeading &&
          !isGenericHeading(contentTitle)
            ? `<h3 class="section-title">${esc(contentTitle)}</h3>`
            : "";

        if (headingHtml) lastHeading = contentTitle.toLowerCase();

        return `${headingHtml}<section class="manual-block rich-text">${renderRichText(
          text(block.text),
        )}</section>`;
      }

      if (type === "quiz") {
        return renderQuizBlock(block, blockIndex);
      }

      if (type === "exercise") {
        return renderExerciseBlock(block);
      }

      if (type === "divider") {
        const label = text(block.data?.divider?.label);
        return `<div class="divider-wrap">${
          label ? `<p class="divider-label">${esc(label)}</p>` : ""
        }<hr class="divider" /></div>`;
      }

      if (type === "math") {
        const latex = text(block.data?.math?.latex);
        const description = text(block.data?.math?.description);
        const title = description || text(block.title) || "Formule";
        return renderSupplementBlock(
          block,
          title,
          latex
            ? `<div style="text-align:center;margin:12px 0;padding:16px;background:#f8fafc;border-radius:8px;">${renderLatexToHtml(latex, true)}</div>`
            : `<p style="color:#888;font-style:italic">Formule LaTeX à compléter.</p>`,
        );
      }

      if (type === "code") {
        const language = text(block.data?.code?.language);
        const code = text(block.data?.code?.code);
        return renderSupplementBlock(
          block,
          "Exemple de code",
          `${language ? `<p class="note">${esc(language.toUpperCase())}</p>` : ""}<pre>${esc(
            code || "// Code a finaliser",
          )}</pre>`,
        );
      }

      if (type === "image") {
        const imageUrl = text(block.data?.image?.url);
        if (!imageUrl) {
          return `<section class="manual-block"><p class="muted">Illustration a finaliser.</p></section>`;
        }
        counters.figure += 1;
        return renderFigureBlock(
          block,
          counters.figure,
          imageUrl,
          "Illustration pedagogique",
        );
      }

      if (type === "drawing") {
        const preview = extractDrawingPreview(block.data?.drawing);
        if (!preview) {
          return `<section class="manual-block"><p class="muted">Schema a finaliser.</p></section>`;
        }
        counters.figure += 1;
        return renderFigureBlock(block, counters.figure, preview, "Schema pedagogique");
      }

      if (type === "chart") {
        const chartImage = buildChartSvgDataUrl(block.data?.chart);
        if (!chartImage) {
          return `<section class="manual-block"><p class="muted">Graphique a finaliser.</p></section>`;
        }
        counters.figure += 1;
        const chartTitle =
          text(block.data?.chart?.title) || text(block.title) || "Graphique pedagogique";
        const notes =
          block.data?.chart?.mode === "function" && text(block.data?.chart?.functionSpec?.expr)
            ? `<p class="note">f(x) = ${esc(text(block.data?.chart?.functionSpec?.expr))}</p>`
            : "";
        return `<section class="manual-block figure-block">
          <p class="figure-label">Figure ${counters.figure}</p>
          <h4>${esc(chartTitle)}</h4>
          ${notes}
          <figure>
            <img src="${chartImage}" alt="${esc(chartTitle)}" />
          </figure>
        </section>`;
      }

      if (type === "table") {
        counters.table += 1;
        return renderTableBlock(block, counters.table);
      }

      return "";
    })
    .filter(Boolean)
    .join("");

  return `<section class="chapter" id="${chapterId}">
    <header class="chapter-header">
      <p class="chapter-kicker">Chapitre ${chapterIndex + 1}</p>
      <h2>${esc(chapterTitle)}</h2>
    </header>
    ${blocksHtml || `<p class="muted">Contenu du chapitre a finaliser.</p>`}
  </section>`;
}

export function getManualDocumentStats(
  modules: ManualRenderableModule[],
): ManualDocumentStats {
  let sectionCount = 0;
  let activityCount = 0;
  let figureCount = 0;

  for (const courseModule of toArray(modules)) {
    for (const block of toArray(courseModule.blocks)) {
      const type = text(block.type).toLowerCase();
      if (type === "title" || type === "content") sectionCount += 1;
      if (type === "quiz" || type === "exercise") activityCount += 1;
      if (type === "image" || type === "chart" || type === "drawing" || type === "table") {
        figureCount += 1;
      }
    }
  }

  return {
    chapterCount: toArray(modules).length,
    sectionCount,
    activityCount,
    figureCount,
  };
}

export function renderManualDocumentHtml(
  meta: ManualDocumentMeta,
  modules: ManualRenderableModule[],
  options?: ManualDocumentRenderOptions,
) {
  const safeModules = toArray(modules);
  const resolvedTitle = safeTitle(meta.title, "Cours sans titre");
  const objectives = normalizeObjectives(meta.objectives);
  const stats = getManualDocumentStats(safeModules);
  const screenScale = Math.min(1.5, Math.max(1, options?.screenScale ?? 1));
  const generatedAt = new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const tocHtml = safeModules
    .map((courseModule, index) => {
      const chapterTitle = getChapterTitle(courseModule, index);
      return `<li><span>${index + 1}. ${esc(chapterTitle)}</span></li>`;
    })
    .join("");

  const counters = { figure: 0, table: 0 };
  const chaptersHtml = safeModules
    .map(
      (courseModule, index) =>
        `<section class="page">${renderChapter(courseModule, index, counters)}</section>`,
    )
    .join("");

  const objectivesHtml = objectives.length
    ? `<section class="cover-section">
        <p class="meta-label">Objectifs d'apprentissage</p>
        <ul class="objective-list">${objectives
          .map((objective) => `<li>${esc(objective)}</li>`)
          .join("")}</ul>
      </section>`
    : "";

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${esc(resolvedTitle)}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.28/dist/katex.min.css" crossorigin="anonymous" />
  <style>
    @page { size: A4; margin: 18mm; }
    :root {
      color-scheme: light;
      --ink: #111827;
      --muted: #5b6474;
      --line: #d8dee8;
      --soft: #f3f4f6;
      --soft-2: #eef2f7;
      --accent: #0f172a;
      --preview-screen-scale: ${screenScale};
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: var(--ink);
      font-family: "Times New Roman", Georgia, serif;
      font-size: 12pt;
      line-height: 1.72;
      background: #ffffff;
    }
    h1, h2, h3, h4, p, ul, ol { margin: 0; }
    main { width: 100%; }
    .page {
      width: 100%;
      background: #ffffff;
    }
    .cover {
      min-height: calc(297mm - 36mm);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 12mm 10mm 8mm;
      border: 1px solid var(--line);
      background:
        linear-gradient(180deg, rgba(241,245,249,0.85), rgba(255,255,255,0) 38%),
        linear-gradient(135deg, rgba(15,23,42,0.06), rgba(255,255,255,0) 50%);
    }
    .cover-top {
      display: flex;
      flex-direction: column;
      gap: 10mm;
    }
    .eyebrow {
      font-family: Arial, sans-serif;
      font-size: 10pt;
      text-transform: uppercase;
      letter-spacing: 0.18em;
      color: var(--muted);
    }
    .cover h1 {
      font-size: 28pt;
      line-height: 1.18;
      max-width: 150mm;
    }
    .cover-subtitle {
      max-width: 145mm;
      font-size: 12.5pt;
      color: var(--muted);
    }
    .cover-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 10px;
      margin-top: 8mm;
    }
    .stat-card {
      border: 1px solid var(--line);
      background: rgba(255,255,255,0.8);
      padding: 10px 12px;
    }
    .stat-card span {
      display: block;
      font-family: Arial, sans-serif;
      font-size: 9pt;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: var(--muted);
      margin-bottom: 6px;
    }
    .stat-card strong {
      font-size: 16pt;
      font-weight: 700;
    }
    .cover-meta {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
      margin-top: 8mm;
    }
    .cover-section {
      border-top: 1px solid var(--line);
      padding-top: 10px;
    }
    .meta-label {
      font-family: Arial, sans-serif;
      font-size: 9pt;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: var(--muted);
      margin-bottom: 6px;
    }
    .objective-list {
      margin-left: 18px;
    }
    .cover-footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      border-top: 1px solid var(--line);
      padding-top: 10px;
      font-size: 10.5pt;
      color: var(--muted);
    }
    .page-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: auto;
      padding-top: 12px;
      border-top: 1px solid var(--line);
      font-size: 9pt;
      color: var(--muted);
    }
    .page { display: flex; flex-direction: column; }
    .toc { padding-top: 10mm; }
    .toc h2 {
      font-size: 22pt;
      margin-bottom: 12px;
    }
    .toc-list {
      list-style: none;
      padding: 0;
      display: grid;
      gap: 8px;
    }
    .toc-list li {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      border-bottom: 1px solid var(--line);
      padding-bottom: 6px;
      font-size: 12pt;
    }
    .chapter { padding-top: 8mm; }
    .chapter-header {
      border-bottom: 2px solid var(--line);
      padding-bottom: 10px;
      margin-bottom: 16px;
    }
    .chapter-kicker {
      font-family: Arial, sans-serif;
      font-size: 9.5pt;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      color: var(--muted);
      margin-bottom: 6px;
    }
    .chapter h2 {
      font-size: 22pt;
      line-height: 1.2;
    }
    .section-title {
      font-size: 16pt;
      margin: 18px 0 10px;
      color: var(--accent);
    }
    .manual-block {
      margin-bottom: 14px;
    }
    .rich-text p {
      margin-bottom: 9px;
      text-align: justify;
    }
    .rich-text ul,
    .rich-text ol {
      margin: 4px 0 10px 20px;
    }
    .pedagogic-card {
      margin: 18px 0;
      padding: 14px 16px;
      border: 1px solid var(--line);
      background: linear-gradient(180deg, var(--soft), #ffffff);
      page-break-inside: avoid;
    }
    .assessment-card {
      border-left: 4px solid #2563eb;
    }
    .practice-card {
      border-left: 4px solid #b45309;
    }
    .card-kicker {
      font-family: Arial, sans-serif;
      font-size: 9pt;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      color: var(--muted);
      margin-bottom: 8px;
    }
    .pedagogic-card h4,
    .manual-block h4 {
      font-size: 13.5pt;
      margin-bottom: 8px;
    }
    .question {
      margin-bottom: 12px;
      padding-left: 12px;
      border-left: 2px solid var(--line);
    }
    .question ol,
    .question ul {
      margin: 6px 0 8px 18px;
    }
    .figure-label,
    .label,
    .note {
      font-family: Arial, sans-serif;
      font-size: 10pt;
      color: var(--muted);
    }
    .label {
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin: 12px 0 6px;
    }
    figure {
      margin: 8px auto 0;
      width: min(100%, var(--figure-max-width, 100%));
    }
    .figure-media {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: var(--figure-max-height, auto);
    }
    img {
      max-width: 100%;
      max-height: var(--figure-max-height, none);
      width: auto;
      display: block;
      margin: 0 auto;
      border: 1px solid var(--line);
      background: #ffffff;
      object-fit: contain;
      aspect-ratio: var(--figure-aspect-ratio, auto);
    }
    figcaption {
      margin-top: 6px;
      font-size: 10.5pt;
      color: var(--muted);
      font-style: italic;
      width: min(100%, var(--figure-max-width, 100%));
      margin-left: auto;
      margin-right: auto;
    }
    pre {
      margin: 8px 0;
      padding: 12px;
      border: 1px solid var(--line);
      background: #fbfcfe;
      white-space: pre-wrap;
      font-size: 11pt;
      line-height: 1.55;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
      font-size: 11pt;
    }
    th, td {
      border: 1px solid var(--line);
      padding: 8px 9px;
      vertical-align: top;
      text-align: left;
    }
    th {
      background: var(--soft-2);
    }
    .divider-wrap {
      margin: 14px 0;
    }
    .divider-label {
      text-align: center;
      font-family: Arial, sans-serif;
      font-size: 9pt;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      color: var(--muted);
      margin-bottom: 6px;
    }
    .divider {
      border: 0;
      border-top: 1px solid var(--line);
      margin: 0;
    }
    .muted {
      color: var(--muted);
      font-style: italic;
    }
    @media screen {
      body {
        background:
          radial-gradient(circle at top, rgba(124, 107, 245, 0.12), transparent 28%),
          linear-gradient(180deg, #121820 0%, #0d1117 100%);
        padding: 8px 4px 16px;
        zoom: var(--preview-screen-scale);
      }
      .page {
        width: min(210mm, calc(100vw - 8px));
        min-height: auto;
        margin: 0 auto 10px;
        padding: 8mm;
        border: 1px solid #cfd6df;
        box-shadow: 0 32px 96px -42px rgba(0, 0, 0, 0.72);
        overflow-wrap: break-word;
        word-break: break-word;
      }
      .page:last-child {
        margin-bottom: 0;
      }
      @media (min-width: 640px) {
        body { padding: 12px 0 20px; }
        .page { padding: 14mm; }
      }
      @media (min-width: 1024px) {
        .page { padding: 16mm; min-height: 297mm; }
      }
    }
    @media print {
      body {
        background: #ffffff;
        padding: 0;
      }
      .page {
        width: auto;
        min-height: auto;
        margin: 0;
        padding: 0;
        border: 0;
        box-shadow: none;
        break-after: page;
        page-break-after: always;
      }
      .page:last-child {
        break-after: auto;
        page-break-after: auto;
      }
    }
  </style>
</head>
<body>
  <main>
    <section class="page" id="page-cover" data-page-number="1">
      <section class="cover">
        <div class="cover-top">
          <div>
            <p class="eyebrow">Manuel de cours</p>
            <h1>${esc(resolvedTitle)}</h1>
            <p class="cover-subtitle">${
              meta.description
                ? esc(meta.description)
                : "Document pedagogique structure pour une lecture claire, progressive et imprimable."
            }</p>
          </div>

          <div class="cover-grid">
            <div class="stat-card"><span>Chapitres</span><strong>${stats.chapterCount}</strong></div>
            <div class="stat-card"><span>Sections</span><strong>${stats.sectionCount}</strong></div>
            <div class="stat-card"><span>Activites</span><strong>${stats.activityCount}</strong></div>
            <div class="stat-card"><span>Figures</span><strong>${stats.figureCount}</strong></div>
          </div>

          <div class="cover-meta">
            <section class="cover-section">
              <p class="meta-label">Domaine</p>
              <p>${esc(text(meta.domain) || "Non renseigne")}</p>
            </section>
            <section class="cover-section">
              <p class="meta-label">Niveau</p>
              <p>${esc(text(meta.level) || "Non renseigne")}</p>
            </section>
            ${objectivesHtml}
          </div>
        </div>

        <div class="cover-footer">
          <p>Edition structuree pour impression et lecture continue</p>
          <p>${esc(generatedAt)}</p>
        </div>
      </section>
    </section>

    <section class="page" id="page-toc" data-page-number="2">
      <section class="toc">
        <h2>Sommaire</h2>
        <ol class="toc-list">
          ${tocHtml || "<li><span>Aucun chapitre.</span></li>"}
        </ol>
      </section>
    </section>

    ${chaptersHtml || `<section class="page"><section class="chapter"><header class="chapter-header"><h2>Aucun contenu</h2></header><p class="muted">Le cours ne contient pas encore de chapitre exploitable.</p></section></section>`}
  </main>
  <script>
    (function() {
      var pages = document.querySelectorAll('.page');
      var total = pages.length;
      for (var i = 0; i < total; i++) {
        var footer = document.createElement('div');
        footer.className = 'page-footer';
        footer.innerHTML = '<span>${esc(resolvedTitle)}</span><span>' + (i + 1) + '/' + total + '</span>';
        pages[i].appendChild(footer);
        pages[i].setAttribute('data-page-number', String(i + 1));
      }
    })();
  </script>
</body>
</html>`;
}
