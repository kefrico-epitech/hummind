"use client";

import React, { useMemo, useState } from "react";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { Check, Palette, Plus, Trash2 } from "lucide-react";
import { Bar, Line, Pie } from "react-chartjs-2";
import { Input } from "../../../ui/input";
import type { ChartData, ChartFunctionSpec } from "../../types";
import {
  buildFunctionChartData,
  normalizeFunctionSpecInput,
  parseNumberList,
} from "../../../../lib/course/chartFunction";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
);

type Point = Record<string, number>;
type ChartMode = "data" | "function" | "chronogram";

const SERIES_PALETTE = [
  "#4bc0c0",
  "#7C6BF5",
  "#E84747",
  "#3A8DFF",
  "#22c55e",
  "#f59e0b",
];

type ChartEditorProps = {
  value: Partial<ChartData> | undefined;
  onChange: (data: ChartData) => void;
};

function ensurePoints(value: Partial<ChartData> | undefined): Point[] {
  if (!value || !Array.isArray(value.labels) || !Array.isArray(value.datasets)) {
    return [{ x: 0, y: 0 }];
  }
  return value.labels.map((_, i) => {
    const point: Point = { x: i };
    value.datasets?.forEach((ds, j) => {
      const key = j === 0 ? "y" : `f${j}`;
      point[key] = ds.data?.[i] ?? 0;
    });
    return point;
  });
}

function pointsToChartData(
  points: Point[],
  fields: string[],
  fieldLabels: Record<string, string>,
  chartType: ChartData["chartType"],
  chartTitle: string,
  mode: ChartMode,
  seriesColors?: Record<string, string>,
): ChartData {
  const labels = points.map((p) => String(p.x ?? 0));
  const datasets = fields
    .filter((f) => f !== "x")
    .map((f) => ({
      label: fieldLabels[f] || f,
      data: points.map((p) => (Number.isFinite(p[f]) ? p[f] : 0)),
    }));

  return {
    chartType,
    title: chartTitle,
    labels,
    datasets,
    mode,
    options: {
      ...(chartType === "chronogram" ? { stepped: true } : {}),
      ...(seriesColors ? { seriesColors } : {}),
    },
  };
}

function withAlpha(hex: string, alpha: number) {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return `rgba(75, 192, 192, ${alpha})`;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function inferInitialMode(value: Partial<ChartData> | undefined): ChartMode {
  if (value?.mode === "function" || value?.functionSpec) return "function";
  if (value?.mode === "chronogram" || value?.chartType === "chronogram") {
    return "chronogram";
  }
  return "data";
}

export function ChartBlockEditor({ value, onChange }: ChartEditorProps) {
  const initialMode = inferInitialMode(value);
  const initialDatasetCount = Math.max(1, value?.datasets?.length ?? 1);
  const initialFields = [
    "x",
    ...Array.from(
      { length: initialDatasetCount },
      (_, i) => (i === 0 ? "y" : `f${i}`),
    ),
  ];
  const initialFunctionSpec =
    normalizeFunctionSpecInput(value?.functionSpec) ??
    normalizeFunctionSpecInput({
      expr: "x",
      xMin: -10,
      xMax: 10,
      step: 0.5,
    }) ?? {
      expr: "x",
      xMin: -10,
      xMax: 10,
      step: 0.5,
      tangents: [],
      asymptotesX: [],
      asymptotesY: [],
    };
  const initialOptionColors =
    ((value?.options as { seriesColors?: Record<string, string> } | undefined)
      ?.seriesColors ?? {}) as Record<string, string>;

  const [mode, setMode] = useState<ChartMode>(initialMode);
  const [chartType, setChartType] = useState<ChartData["chartType"]>(
    value?.chartType ?? "line",
  );
  const [chartTitle, setChartTitle] = useState(
    value?.title ?? "Graphique pedagogique",
  );
  const [color, setColor] = useState("#4bc0c0");
  const [fields, setFields] = useState<string[]>(initialFields);
  const [fieldLabels, setFieldLabels] = useState<Record<string, string>>(() => {
    const labels: Record<string, string> = { x: "X" };
    initialFields
      .filter((f) => f !== "x")
      .forEach((f, idx) => {
        labels[f] = value?.datasets?.[idx]?.label || `Serie ${idx + 1}`;
      });
    return labels;
  });
  const [points, setPoints] = useState<Point[]>(() => ensurePoints(value));
  const [seriesColors, setSeriesColors] = useState<Record<string, string>>(() => {
    const next: Record<string, string> = {};
    initialFields
      .filter((f) => f !== "x")
      .forEach((f, idx) => {
        next[f] = initialOptionColors[f] || SERIES_PALETTE[idx % SERIES_PALETTE.length];
      });
    return next;
  });
  const [selectedField, setSelectedField] = useState<string>(() => {
    return initialFields.find((f) => f !== "x") ?? "y";
  });

  const [expr, setExpr] = useState(initialFunctionSpec.expr);
  const [xMinInput, setXMinInput] = useState(String(initialFunctionSpec.xMin));
  const [xMaxInput, setXMaxInput] = useState(String(initialFunctionSpec.xMax));
  const [stepInput, setStepInput] = useState(String(initialFunctionSpec.step));
  const [tangentsInput, setTangentsInput] = useState(
    (initialFunctionSpec.tangents ?? []).join(", "),
  );
  const [asymptotesXInput, setAsymptotesXInput] = useState(
    (initialFunctionSpec.asymptotesX ?? []).join(", "),
  );
  const [asymptotesYInput, setAsymptotesYInput] = useState(
    (initialFunctionSpec.asymptotesY ?? []).join(", "),
  );
  const [functionWarning, setFunctionWarning] = useState<string | null>(null);

  const emitData = (
    nextPoints: Point[],
    nextFields: string[],
    nextFieldLabels: Record<string, string>,
    nextMode: ChartMode = mode,
    nextType: ChartData["chartType"] = chartType,
    nextTitle: string = chartTitle,
    nextSeriesColors: Record<string, string> = seriesColors,
  ) => {
    onChange(
      pointsToChartData(
        nextPoints,
        nextFields,
        nextFieldLabels,
        nextType,
        nextTitle,
        nextMode,
        nextSeriesColors,
      ),
    );
  };

  const buildFunctionSpecFromInputs = (): ChartFunctionSpec => {
    const spec =
      normalizeFunctionSpecInput({
        expr: expr.trim() || "x",
        xMin: Number(xMinInput),
        xMax: Number(xMaxInput),
        step: Number(stepInput),
        tangents: parseNumberList(tangentsInput),
        asymptotesX: parseNumberList(asymptotesXInput),
        asymptotesY: parseNumberList(asymptotesYInput),
      }) ??
      normalizeFunctionSpecInput({
        expr: "x",
        xMin: -10,
        xMax: 10,
        step: 0.5,
      });

    return (
      spec ?? {
        expr: "x",
        xMin: -10,
        xMax: 10,
        step: 0.5,
        tangents: [],
        asymptotesX: [],
        asymptotesY: [],
      }
    );
  };

  const emitFunction = (
    nextSpec: ChartFunctionSpec,
    nextTitle: string = chartTitle,
  ) => {
    const generated = buildFunctionChartData(nextSpec);
    setFunctionWarning(generated.warning ?? null);

    onChange({
      chartType: "line",
      title: nextTitle,
      mode: "function",
      functionSpec: nextSpec,
      labels: generated.labels,
      datasets: generated.datasets,
      options: {
        ...(value?.options ?? {}),
        asymptotesX: nextSpec.asymptotesX ?? [],
      },
    });
  };

  const functionPreview = buildFunctionChartData(buildFunctionSpecFromInputs());

  const asymptotePlugin = useMemo(
    () => ({
      id: "function-asymptotes",
      afterDraw: (chart: ChartJS) => {
        if (mode !== "function") return;

        const xScale = chart.scales.x;
        const yScale = chart.scales.y;
        if (!xScale || !yScale) return;

        const ctx = chart.ctx;
        const lines = parseNumberList(asymptotesXInput);
        if (!lines.length) return;

        ctx.save();
        ctx.strokeStyle = "rgba(255, 99, 132, 0.85)";
        ctx.setLineDash([6, 6]);
        ctx.lineWidth = 1.2;

        for (const x of lines) {
          let nearestIndex = 0;
          let minDist = Number.POSITIVE_INFINITY;
          functionPreview.xValues.forEach((valueX, idx) => {
            const d = Math.abs(valueX - x);
            if (d < minDist) {
              minDist = d;
              nearestIndex = idx;
            }
          });

          const xPixel = xScale.getPixelForValue(nearestIndex);
          ctx.beginPath();
          ctx.moveTo(xPixel, yScale.top);
          ctx.lineTo(xPixel, yScale.bottom);
          ctx.stroke();
        }

        ctx.restore();
      },
    }),
    [mode, asymptotesXInput, functionPreview.xValues],
  );

  const handlePointChange = (rowIndex: number, field: string, raw: string) => {
    const normalizedRaw = raw.replace(",", ".");
    const parsed = Number(normalizedRaw);
    const val = Number.isFinite(parsed) ? parsed : 0;
    const nextPoints = [...points];
    nextPoints[rowIndex] = { ...nextPoints[rowIndex], [field]: val };

    const last = nextPoints[nextPoints.length - 1];
    const filled = fields.some((f) => (last[f] ?? 0) !== 0);
    if (rowIndex === nextPoints.length - 1 && filled) {
      const emptyRow: Point = {};
      fields.forEach((f) => {
        emptyRow[f] = 0;
      });
      emptyRow.x = nextPoints.length;
      nextPoints.push(emptyRow);
    }

    setPoints(nextPoints);
    emitData(nextPoints, fields, fieldLabels);
  };

  const addPoint = () => {
    const nextPoints = [...points];
    const emptyRow: Point = {};
    fields.forEach((f) => {
      emptyRow[f] = 0;
    });
    emptyRow.x = nextPoints.length;
    nextPoints.push(emptyRow);
    setPoints(nextPoints);
    emitData(nextPoints, fields, fieldLabels);
  };

  const addField = () => {
    const newField = `f${fields.length - 1}`;
    const nextFields = [...fields, newField];
    const nextFieldLabels = {
      ...fieldLabels,
      [newField]: `Serie ${nextFields.length - 1}`,
    };
    const nextSeriesColors = {
      ...seriesColors,
      [newField]: SERIES_PALETTE[(nextFields.length - 2) % SERIES_PALETTE.length],
    };
    const nextPoints = points.map((p) => ({ ...p, [newField]: 0 }));
    setFields(nextFields);
    setFieldLabels(nextFieldLabels);
    setSeriesColors(nextSeriesColors);
    setSelectedField(newField);
    setPoints(nextPoints);
    emitData(nextPoints, nextFields, nextFieldLabels, "data", chartType, chartTitle, nextSeriesColors);
  };

  const renameField = (field: string, newName: string) => {
    const nextFieldLabels = { ...fieldLabels, [field]: newName };
    setFieldLabels(nextFieldLabels);
    emitData(points, fields, nextFieldLabels);
  };

  const removePoint = (rowIndex: number) => {
    const nextPoints = points.filter((_, idx) => idx !== rowIndex);
    if (!nextPoints.length) {
      const fallback: Point = {};
      fields.forEach((f) => {
        fallback[f] = 0;
      });
      fallback.x = 0;
      nextPoints.push(fallback);
    }
    setPoints(nextPoints);
    emitData(nextPoints, fields, fieldLabels);
  };

  const removeField = (field: string) => {
    if (field === "x") return;
    const nonXFields = fields.filter((f) => f !== "x");
    if (nonXFields.length <= 1) return;

    const nextFields = fields.filter((f) => f !== field);
    const nextFieldLabels = { ...fieldLabels };
    delete nextFieldLabels[field];
    const nextSeriesColors = { ...seriesColors };
    delete nextSeriesColors[field];
    const nextPoints = points.map((p) => {
      const nextPoint = { ...p };
      delete nextPoint[field];
      return nextPoint;
    });
    const nextSelectableField = nextFields.find((f) => f !== "x") ?? "y";

    setFields(nextFields);
    setFieldLabels(nextFieldLabels);
    setSeriesColors(nextSeriesColors);
    if (selectedField === field) setSelectedField(nextSelectableField);
    setPoints(nextPoints);
    emitData(nextPoints, nextFields, nextFieldLabels, "data", chartType, chartTitle, nextSeriesColors);
  };

  const setChartMode = (nextMode: ChartMode) => {
    if (nextMode === "function") {
      setMode("function");
      emitFunction(buildFunctionSpecFromInputs(), chartTitle);
      return;
    }

    if (nextMode === "chronogram") {
      setMode("chronogram");
      setChartType("chronogram");
      emitData(points, fields, fieldLabels, "chronogram", "chronogram");
      return;
    }

    setMode("data");
    const nextType = chartType === "chronogram" ? "line" : chartType;
    setChartType(nextType);
    emitData(points, fields, fieldLabels, "data", nextType);
  };

  const setDataChartType = (nextType: ChartData["chartType"]) => {
    setChartType(nextType);
    emitData(points, fields, fieldLabels, "data", nextType);
  };

  const updateSeriesColor = (field: string, nextColor: string) => {
    const nextSeriesColors = {
      ...seriesColors,
      [field]: nextColor,
    };
    setSeriesColors(nextSeriesColors);
    emitData(points, fields, fieldLabels, mode, chartType, chartTitle, nextSeriesColors);
  };

  const chartData =
    mode === "function"
      ? {
          labels: functionPreview.labels,
          datasets: functionPreview.datasets.map((dataset) => {
            const isGuide =
              dataset.label.startsWith("Tangente") ||
              dataset.label.startsWith("Asymptote");
            return {
              label: dataset.label,
              data: dataset.data,
              borderColor: isGuide
                ? "rgba(255,99,132,0.85)"
                : withAlpha(color, 1),
              backgroundColor: withAlpha(color, 0.15),
              borderWidth: isGuide ? 1.5 : 2.2,
              borderDash: isGuide ? [6, 4] : undefined,
              pointRadius: isGuide ? 0 : 1.5,
              spanGaps: false,
              tension: 0,
            };
          }),
        }
      : {
          labels: points.map((p) => String(p.x ?? 0)),
          datasets: fields
            .filter((f) => f !== "x")
            .map((f, idx) => {
              const seriesColor = seriesColors[f] ?? SERIES_PALETTE[idx % SERIES_PALETTE.length];
              return {
                label: fieldLabels[f] || f,
                data: points.map((p) => p[f] ?? 0),
                borderColor: withAlpha(seriesColor, 1),
                backgroundColor: withAlpha(seriesColor, chartType === "pie" ? 0.65 : 0.35),
                borderWidth: 2,
                tension: chartType === "line" ? 0.35 : 0,
                stepped: chartType === "chronogram",
              };
            }),
        };

  const datasetFields = fields.filter((f) => f !== "x");
  const activeField = datasetFields.includes(selectedField)
    ? selectedField
    : datasetFields[0] ?? "";

  const previewType =
    mode === "function" ? "line" : mode === "chronogram" ? "chronogram" : chartType;
  const modeLabel =
    mode === "function" ? "Fonction" : mode === "chronogram" ? "Chronogramme" : "Donnees";
  const previewLabel =
    previewType === "pie"
      ? "Secteurs"
      : previewType === "bar"
        ? "Barres"
        : previewType === "chronogram"
          ? "Chronogramme"
          : "Courbe";

  return (
    <div className="space-y-3 rounded-2xl border border-white/10 bg-[#101623] p-3 text-white sm:p-4">
      <section className="rounded-xl border border-white/10 bg-black/25 p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-white/50">
              Apercu
            </p>
            <p className="truncate text-sm font-semibold text-white">
              {chartTitle?.trim() || "Graphique sans titre"}
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-white/60">
            <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5">
              {modeLabel}
            </span>
            <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5">
              {previewLabel}
            </span>
          </div>
        </div>

        <div className="h-[360px] rounded-lg border border-white/10 bg-[#0b1020] p-3">
          {mode === "function" && (
            <Line
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                spanGaps: false,
              }}
              plugins={[asymptotePlugin]}
            />
          )}

          {mode !== "function" && previewType === "bar" && (
            <Bar
              data={chartData}
              options={{ responsive: true, maintainAspectRatio: false }}
            />
          )}
          {mode !== "function" && previewType === "line" && (
            <Line
              data={chartData}
              options={{ responsive: true, maintainAspectRatio: false }}
            />
          )}
          {mode !== "function" && previewType === "chronogram" && (
            <Line
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                elements: { line: { stepped: true } },
              }}
            />
          )}
          {mode !== "function" && previewType === "pie" && (
            <Pie
              data={chartData}
              options={{ responsive: true, maintainAspectRatio: false }}
            />
          )}
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <div className="space-y-2">
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-white/55">
              Titre
            </label>
            <Input
              value={chartTitle}
              onChange={(e) => {
                const nextTitle = e.target.value;
                setChartTitle(nextTitle);
                if (mode === "function") {
                  emitFunction(buildFunctionSpecFromInputs(), nextTitle);
                } else {
                  emitData(points, fields, fieldLabels, mode, chartType, nextTitle);
                }
              }}
              className="h-9 w-full border-white/10 bg-black/25 px-2.5 text-white placeholder:text-white/40"
            />
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-[170px_170px_90px_auto] md:items-end">
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-white/55">
                Mode
              </label>
              <select
                value={mode}
                onChange={(e) => setChartMode(e.target.value as ChartMode)}
                className="h-9 w-full rounded-md border border-white/10 bg-black/25 px-2.5 text-sm text-white outline-none"
              >
                <option value="data" className="bg-[#101623]">
                  Donnees
                </option>
                <option value="function" className="bg-[#101623]">
                  Fonction f(x)
                </option>
                <option value="chronogram" className="bg-[#101623]">
                  Chronogramme
                </option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-white/55">
                Type
              </label>
              <select
                value={previewType}
                onChange={(e) => setDataChartType(e.target.value as ChartData["chartType"])}
                disabled={mode !== "data"}
                className="h-9 w-full rounded-md border border-white/10 bg-black/25 px-2.5 text-sm text-white outline-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="line" className="bg-[#101623]">
                  Courbe
                </option>
                <option value="bar" className="bg-[#101623]">
                  Barres
                </option>
                <option value="pie" className="bg-[#101623]">
                  Secteurs
                </option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-white/55">
                Couleur
              </label>
              <input
                type="color"
                value={mode === "function" ? color : seriesColors[activeField] || SERIES_PALETTE[0]}
                onChange={(e) => {
                  const next = e.target.value;
                  if (mode === "function") {
                    setColor(next);
                    return;
                  }
                  if (activeField) {
                    updateSeriesColor(activeField, next);
                  }
                }}
                disabled={mode !== "function" && !activeField}
                className="h-9 w-full cursor-pointer rounded-md border border-white/10 bg-transparent p-1 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="flex flex-wrap items-center justify-start gap-2">
              {mode !== "function" && (
                <button
                  type="button"
                  onClick={addPoint}
                  title="Ajouter un point"
                  aria-label="Ajouter un point"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white/80 hover:bg-white/10"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              )}
              {mode === "data" && (
                <button
                  type="button"
                  onClick={addField}
                  title="Ajouter une serie"
                  aria-label="Ajouter une serie"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white/80 hover:bg-white/10"
                >
                  <Palette className="h-3.5 w-3.5" />
                </button>
              )}
              {mode === "function" && (
                <button
                  type="button"
                  onClick={() => emitFunction(buildFunctionSpecFromInputs(), chartTitle)}
                  title="Appliquer"
                  aria-label="Appliquer"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-linear-to-r from-[#7C6BF5] to-[#E84747] text-white hover:opacity-90"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {mode !== "function" && datasetFields.length > 0 && (
          <div className="mt-2 flex items-center gap-1.5 overflow-x-auto pb-1">
            {datasetFields.map((field, idx) => {
              const isActive = field === activeField;
              const swatch = seriesColors[field] ?? SERIES_PALETTE[idx % SERIES_PALETTE.length];
              return (
                <button
                  key={`series-pill-${field}`}
                  type="button"
                  onClick={() => setSelectedField(field)}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] ${
                    isActive
                      ? "border-white/40 bg-white/12 text-white"
                      : "border-white/15 bg-white/5 text-white/70 hover:bg-white/10"
                  }`}
                  title={`Selectionner ${fieldLabels[field] || field}`}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: swatch }}
                  />
                  <span className="max-w-[110px] truncate">
                    {fieldLabels[field] || field}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {mode === "function" ? (
          <details open className="mt-3 rounded-lg border border-white/10 bg-black/20 p-3">
            <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-white/60">
              Parametres fonction
            </summary>
            <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-[11px] text-white/55">Expression</label>
                <Input
                  value={expr}
                  onChange={(e) => setExpr(e.target.value)}
                  placeholder="Ex: (x^2-1)/(x-1)"
                  className="h-8 border-white/10 bg-black/30 text-white placeholder:text-white/45"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-white/55">X min</label>
                <Input
                  value={xMinInput}
                  onChange={(e) => setXMinInput(e.target.value)}
                  className="h-8 border-white/10 bg-black/30 text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-white/55">X max</label>
                <Input
                  value={xMaxInput}
                  onChange={(e) => setXMaxInput(e.target.value)}
                  className="h-8 border-white/10 bg-black/30 text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-white/55">Pas</label>
                <Input
                  value={stepInput}
                  onChange={(e) => setStepInput(e.target.value)}
                  className="h-8 border-white/10 bg-black/30 text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-white/55">Tangentes (x0)</label>
                <Input
                  value={tangentsInput}
                  onChange={(e) => setTangentsInput(e.target.value)}
                  placeholder="-1, 0, 2"
                  className="h-8 border-white/10 bg-black/30 text-white placeholder:text-white/45"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-white/55">Asymptotes x=a</label>
                <Input
                  value={asymptotesXInput}
                  onChange={(e) => setAsymptotesXInput(e.target.value)}
                  placeholder="1, -2"
                  className="h-8 border-white/10 bg-black/30 text-white placeholder:text-white/45"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-white/55">Asymptotes y=b</label>
                <Input
                  value={asymptotesYInput}
                  onChange={(e) => setAsymptotesYInput(e.target.value)}
                  placeholder="0, 2"
                  className="h-8 border-white/10 bg-black/30 text-white placeholder:text-white/45"
                />
              </div>
            </div>
            {functionWarning ? (
              <p className="mt-2 text-xs text-amber-300">{functionWarning}</p>
            ) : null}
          </details>
        ) : (
          <>
            <details open className="mt-3 rounded-lg border border-white/10 bg-black/20 p-3">
              <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-white/60">
                Valeurs
              </summary>
              <div className="mt-3 max-h-56 overflow-auto rounded-md border border-white/10">
                <table className="min-w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-white/5">
                      <th className="px-2 py-1.5 text-left text-white/55">#</th>
                      {fields.map((field) => (
                        <th key={`head-${field}`} className="px-2 py-1.5 text-left text-white/55">
                          {fieldLabels[field] || field}
                        </th>
                      ))}
                      <th className="px-2 py-1.5 text-left text-white/55">⨯</th>
                    </tr>
                  </thead>
                  <tbody>
                    {points.map((point, rowIndex) => (
                      <tr key={rowIndex} className="border-t border-white/10">
                        <td className="px-2 py-1.5 text-white/45">{rowIndex + 1}</td>
                        {fields.map((field) => (
                          <td key={`${rowIndex}-${field}`} className="px-1.5 py-1.5">
                            <Input
                              type="number"
                              value={point[field] ?? 0}
                              onChange={(e) => handlePointChange(rowIndex, field, e.target.value)}
                              className="h-7 min-w-[76px] border-white/10 bg-black/30 px-2 text-white text-xs"
                            />
                          </td>
                        ))}
                        <td className="px-2 py-1.5">
                          <button
                            type="button"
                            onClick={() => removePoint(rowIndex)}
                            title="Supprimer la ligne"
                            aria-label="Supprimer la ligne"
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/15 bg-white/5 text-white/75 hover:bg-white/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>

            {datasetFields.length > 0 && (
              <details className="mt-2 rounded-lg border border-white/10 bg-black/20 p-3">
                <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-white/60">
                  Noms des series
                </summary>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {datasetFields.map((field) => (
                    <div key={field}>
                      <label className="mb-1 block text-[11px] text-white/55">{field}</label>
                      <div className="flex items-center gap-2">
                        <Input
                          value={fieldLabels[field] || field}
                          onChange={(e) => renameField(field, e.target.value)}
                          className="h-8 border-white/10 bg-black/30 text-white text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => removeField(field)}
                          disabled={datasetFields.length <= 1}
                          title="Supprimer la serie"
                          aria-label="Supprimer la serie"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/15 bg-white/5 text-white/75 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </>
        )}
      </section>
    </div>
  );
}
