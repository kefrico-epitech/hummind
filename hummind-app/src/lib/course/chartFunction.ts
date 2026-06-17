import type { ChartFunctionSpec } from "../../components/course/types";

export type FunctionChartSeries = {
  label: string;
  data: number[];
};

export type FunctionChartResult = {
  labels: string[];
  xValues: number[];
  datasets: FunctionChartSeries[];
  yMin: number;
  yMax: number;
  warning?: string;
};

const MAX_POINTS = 600;
const MIN_STEP = 0.0001;
const MAX_ABS_RANGE = 1_000_000;

const ALLOWED_IDENTIFIERS = new Set([
  "x",
  "sin",
  "cos",
  "tan",
  "asin",
  "acos",
  "atan",
  "sqrt",
  "abs",
  "log",
  "ln",
  "exp",
  "floor",
  "ceil",
  "round",
  "min",
  "max",
  "pow",
  "sign",
  "pi",
  "e",
]);

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function roundValue(value: number, digits = 6): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function normalizeFiniteNumber(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeList(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  const uniques = new Set<number>();
  for (const item of value) {
    const n = Number(item);
    if (!Number.isFinite(n)) continue;
    uniques.add(roundValue(n));
  }
  return Array.from(uniques).sort((a, b) => a - b);
}

function ensureSafeExpression(expr: string): boolean {
  if (!expr.trim()) return false;
  if (!/^[0-9a-zA-Z_+\-*/^().,\s]+$/.test(expr)) return false;

  const ids = expr.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) ?? [];
  return ids.every((id) => ALLOWED_IDENTIFIERS.has(id.toLowerCase()));
}

function compileExpression(expr: string): ((x: number) => number) | null {
  const normalizedExpr = expr.replace(/\^/g, "**");
  if (!ensureSafeExpression(normalizedExpr)) return null;

  const body = normalizedExpr.replace(/\bln\s*\(/gi, "log(");

  try {
    const fn = new Function(
      "x",
      `"use strict";
const { sin, cos, tan, asin, acos, atan, sqrt, abs, log, exp, floor, ceil, round, min, max, pow, sign, PI, E } = Math;
const pi = PI;
const e = E;
return (${body});`,
    ) as (x: number) => number;

    return (x: number) => {
      const y = fn(x);
      return Number.isFinite(y) ? y : Number.NaN;
    };
  } catch {
    return null;
  }
}

function sanitizeDomain(input: ChartFunctionSpec): ChartFunctionSpec {
  const expr = input.expr?.trim() || "x";
  let xMin = normalizeFiniteNumber(input.xMin, -10);
  let xMax = normalizeFiniteNumber(input.xMax, 10);
  let step = Math.abs(normalizeFiniteNumber(input.step, 0.5));

  xMin = clampNumber(xMin, -MAX_ABS_RANGE, MAX_ABS_RANGE);
  xMax = clampNumber(xMax, -MAX_ABS_RANGE, MAX_ABS_RANGE);

  if (xMin === xMax) xMax = xMin + 10;
  if (xMin > xMax) [xMin, xMax] = [xMax, xMin];

  const range = xMax - xMin;
  if (range <= 0) {
    xMin = -10;
    xMax = 10;
  }

  if (!Number.isFinite(step) || step <= 0) step = 0.5;
  step = Math.max(MIN_STEP, step);

  const maxStepForPoints = (xMax - xMin) / MAX_POINTS;
  if (maxStepForPoints > step) step = maxStepForPoints;

  return {
    expr,
    xMin,
    xMax,
    step,
    tangents: normalizeList(input.tangents),
    asymptotesX: normalizeList(input.asymptotesX),
    asymptotesY: normalizeList(input.asymptotesY),
  };
}

function buildDomain(spec: ChartFunctionSpec): number[] {
  const values: number[] = [];
  const total = Math.floor((spec.xMax - spec.xMin) / spec.step) + 1;
  const count = Math.max(2, Math.min(MAX_POINTS, total));

  for (let i = 0; i < count; i += 1) {
    const ratio = i / (count - 1);
    const x = spec.xMin + (spec.xMax - spec.xMin) * ratio;
    values.push(roundValue(x));
  }

  return values;
}

function findFiniteMinMax(values: number[]): { min: number; max: number } {
  const finite = values.filter(Number.isFinite);
  if (!finite.length) return { min: -10, max: 10 };

  const min = Math.min(...finite);
  const max = Math.max(...finite);
  if (min === max) {
    const delta = Math.abs(min || 1) * 0.2;
    return { min: min - delta, max: max + delta };
  }
  const pad = (max - min) * 0.15;
  return { min: min - pad, max: max + pad };
}

function deriveTangentSeries(
  fn: (x: number) => number,
  xValues: number[],
  tangentAt: number,
): FunctionChartSeries | null {
  const h = Math.max(0.0005, Math.abs(xValues[1] - xValues[0]) * 0.5);
  const y0 = fn(tangentAt);
  const yPlus = fn(tangentAt + h);
  const yMinus = fn(tangentAt - h);
  if (!Number.isFinite(y0) || !Number.isFinite(yPlus) || !Number.isFinite(yMinus)) {
    return null;
  }
  const slope = (yPlus - yMinus) / (2 * h);
  if (!Number.isFinite(slope)) return null;

  return {
    label: `Tangente x=${roundValue(tangentAt, 4)}`,
    data: xValues.map((x) => roundValue(slope * (x - tangentAt) + y0)),
  };
}

export function normalizeFunctionSpecInput(raw: unknown): ChartFunctionSpec | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;

  const exprValue = typeof obj.expr === "string" ? obj.expr.trim() : "";
  if (!exprValue) return null;

  return sanitizeDomain({
    expr: exprValue,
    xMin: normalizeFiniteNumber(obj.xMin, -10),
    xMax: normalizeFiniteNumber(obj.xMax, 10),
    step: normalizeFiniteNumber(obj.step, 0.5),
    tangents: normalizeList(obj.tangents),
    asymptotesX: normalizeList(obj.asymptotesX),
    asymptotesY: normalizeList(obj.asymptotesY),
  });
}

export function parseNumberList(input: string): number[] {
  return input
    .split(",")
    .map((value) => Number(value.trim().replace(",", ".")))
    .filter(Number.isFinite)
    .map((value) => roundValue(value))
    .filter((value, idx, arr) => arr.indexOf(value) === idx)
    .sort((a, b) => a - b);
}

export function buildFunctionChartData(rawSpec: ChartFunctionSpec): FunctionChartResult {
  const spec = sanitizeDomain(rawSpec);
  const fn = compileExpression(spec.expr);
  if (!fn) {
    return {
      labels: ["-1", "0", "1"],
      xValues: [-1, 0, 1],
      datasets: [{ label: "f(x)", data: [Number.NaN, Number.NaN, Number.NaN] }],
      yMin: -10,
      yMax: 10,
      warning:
        "Expression invalide. Utilise des fonctions standard: sin, cos, tan, exp, log, sqrt...",
    };
  }

  const xValues = buildDomain(spec);
  const mainValues = xValues.map((x) => fn(x));
  const yRange = findFiniteMinMax(mainValues);

  const datasets: FunctionChartSeries[] = [
    {
      label: `f(x) = ${spec.expr}`,
      data: mainValues.map((y) => (Number.isFinite(y) ? roundValue(y) : Number.NaN)),
    },
  ];

  for (const tangentAt of spec.tangents ?? []) {
    const tangent = deriveTangentSeries(fn, xValues, tangentAt);
    if (tangent) datasets.push(tangent);
  }

  for (const y of spec.asymptotesY ?? []) {
    datasets.push({
      label: `Asymptote y=${roundValue(y, 4)}`,
      data: xValues.map(() => roundValue(y)),
    });
  }

  return {
    labels: xValues.map((x) => String(roundValue(x, 4))),
    xValues,
    datasets,
    yMin: yRange.min,
    yMax: yRange.max,
  };
}
