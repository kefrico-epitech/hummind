"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { BarChart3, BookOpen, Check, ClipboardCheck, X } from "lucide-react";
import { cn } from "../../../../../../../src/lib/utils";
import {
  type CourseMenuItem,
  type CourseMenuModule,
  type CourseMenuScoreMetric,
  type CourseMenuScorePanel,
  type CourseMenuTab,
} from "./course-live-data";

function MenuTabButton({
  active,
  label,
  icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-2 text-[0.88rem] font-medium transition",
        active
          ? "bg-[#625BCB] text-white shadow-[0_14px_30px_rgba(98,91,203,0.24)]"
          : "text-white/92 hover:bg-white/6",
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function ModuleStepItem({
  item,
  isLast,
}: {
  item: CourseMenuItem;
  isLast: boolean;
}) {
  const lineColor =
    item.state === "done" || item.state === "current"
      ? "bg-[#00A374]"
      : "bg-white/28";

  return (
    <div className="relative flex gap-2 pl-1">
      {!isLast ? (
        <div className={cn("absolute left-3 top-7 h-6 w-px", lineColor)} />
      ) : null}

      <div
        className={cn(
          "relative z-10 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold",
          item.state === "done"
            ? "border-[#00A374] bg-[#00A374] text-white"
            : item.state === "current"
              ? "border-[#00A374] bg-[#08382D] text-[#A7F0DA]"
              : item.kind === "exercise"
                ? "border-[#7876D8] bg-transparent text-[#A4A2FF]"
                : "border-[#7876D8] bg-transparent text-[#A4A2FF]",
        )}
      >
        {item.state === "done" ? (
          <Check className="h-3.5 w-3.5" />
        ) : item.kind === "exercise" ? (
          <ClipboardCheck className="h-3 w-3" />
        ) : (
          item.number
        )}
      </div>

      <div className="min-h-[40px] pt-0.5">
        <p
          className={cn(
            "text-[0.9rem] leading-[1.45]",
            item.state === "done" || item.state === "current"
              ? "text-white/96"
              : "text-white/85",
          )}
        >
          {item.label}
        </p>
      </div>
    </div>
  );
}

function ScoreRings({ metrics }: { metrics: CourseMenuScoreMetric[] }) {
  const size = 220;
  const center = size / 2;
  const rings = [
    { radius: 68, width: 16 },
    { radius: 49, width: 14 },
    { radius: 31, width: 12 },
  ];

  return (
    <div className="relative mx-auto w-full max-w-[220px]">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="h-auto w-full overflow-visible"
        aria-hidden="true"
      >
        {rings.map((ring, index) => {
          const metric = metrics[index];
          const circumference = 2 * Math.PI * ring.radius;
          const dash = circumference * (metric?.ratio ?? 0);

          return (
            <g key={metric?.id ?? `ring-${index}`}>
              <circle
                cx={center}
                cy={center}
                r={ring.radius}
                fill="none"
                stroke="#3B3C3F"
                strokeWidth={ring.width}
              />
              {metric ? (
                <circle
                  cx={center}
                  cy={center}
                  r={ring.radius}
                  fill="none"
                  stroke={metric.color}
                  strokeWidth={ring.width}
                  strokeLinecap="round"
                  strokeDasharray={`${dash} ${Math.max(circumference - dash, 0)}`}
                  transform={`rotate(-90 ${center} ${center})`}
                />
              ) : null}
            </g>
          );
        })}

        <circle cx={center} cy={center} r={18} fill="#2E2F32" />
      </svg>
    </div>
  );
}

function ScoreTabPanel({
  panel,
  onResumeModule,
}: {
  panel: CourseMenuScorePanel;
  onResumeModule: (moduleId: string) => void;
}) {
  return (
    <div className="space-y-3.5">
      <section className="rounded-[16px] bg-[#444446] px-3.5 py-3.5">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-[0.74rem] font-medium text-[#8E8BFF]">
              {panel.eyebrow}
            </p>
            <h2 className="mt-1 text-[0.96rem] font-semibold text-white">
              {panel.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={() => onResumeModule(panel.resumeStepId)}
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-full bg-[#7C7AF6] px-4 text-[0.9rem] font-medium text-white transition hover:bg-[#8B89FA]"
          >
            {panel.actionLabel}
          </button>
        </div>
      </section>

      <section className="rounded-[20px] border border-white/10 bg-[#2F3032] px-4 py-4 shadow-[0_18px_42px_rgba(0,0,0,0.16)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:gap-6">
          <div className="lg:w-[220px] lg:shrink-0">
            <ScoreRings metrics={panel.metrics} />
          </div>

          <div className="min-w-0 flex-1 space-y-4">
            {panel.metrics.map((metric) => (
              <div key={metric.id}>
                <p className="text-[0.88rem] font-medium text-white/42">
                  {metric.label}
                </p>
                <p
                  className="mt-1 text-[1.24rem] font-semibold tracking-[-0.02em]"
                  style={{ color: metric.color }}
                >
                  {metric.value}
                </p>
                <p className="mt-1 text-[0.88rem] leading-5 text-white/88">
                  {metric.helper}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

type CourseMenuOverlayProps = {
  modules: CourseMenuModule[];
  scorePanels: CourseMenuScorePanel[];
  onSelectStep: (stepId: string) => void;
  tab: CourseMenuTab;
  onTabChange: (value: CourseMenuTab) => void;
  onClose: () => void;
};

export function CourseMenuOverlay({
  modules,
  scorePanels,
  onSelectStep,
  tab,
  onTabChange,
  onClose,
}: CourseMenuOverlayProps) {
  return (
    <motion.div
      className="fixed inset-0 z-50 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
    >
      <motion.div
        className="absolute inset-0 bg-black/32 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden="true"
      />

      <motion.aside
        className="absolute right-0 top-0 flex h-full w-full max-w-[500px] flex-col border-l border-white/8 bg-[#2B2B2D] shadow-[-28px_0_90px_rgba(0,0,0,0.38)]"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="shrink-0 border-b border-white/8 bg-[#2B2B2D] px-4 py-3.5 sm:px-5">
          <div className="flex items-center gap-2 sm:gap-3">
            <MenuTabButton
              active={tab === "modules"}
              label="Modules de cours"
              icon={<BookOpen className="h-3.5 w-3.5" />}
              onClick={() => onTabChange("modules")}
            />

            <MenuTabButton
              active={tab === "scores"}
              label="Mes scores"
              icon={<BarChart3 className="h-3.5 w-3.5" />}
              onClick={() => onTabChange("scores")}
            />

            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer le menu"
              className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/88 transition hover:bg-white/14"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="hummind-scrollbar flex-1 overflow-y-auto px-4 pb-4 pt-4 sm:px-5 sm:pb-5">
          {tab === "modules" ? (
            <div className="space-y-4">
              {modules.map((module) => (
                <section key={module.id}>
                  <div className="rounded-[18px] bg-[#444446] px-3 py-2.5">
                    <p className="text-[0.76rem] font-medium text-[#7E7BF4]">
                      {module.eyebrow}
                    </p>
                    <h2 className="mt-1 text-[0.95rem] font-semibold text-white">
                      {module.title}
                    </h2>
                  </div>

                  <div className="mt-3.5 space-y-1">
                    {module.items.map((item, index) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          onSelectStep(item.id);
                          onClose();
                        }}
                        className="block w-full rounded-[14px] text-left transition hover:bg-white/[0.035]"
                      >
                        <ModuleStepItem
                          item={item}
                          isLast={index === module.items.length - 1}
                        />
                      </button>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {scorePanels.map((panel) => (
                <ScoreTabPanel
                  key={panel.moduleId}
                  panel={panel}
                  onResumeModule={(stepId) => {
                    onSelectStep(stepId);
                    onClose();
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </motion.aside>
    </motion.div>
  );
}
