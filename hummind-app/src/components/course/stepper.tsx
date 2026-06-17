"use client";

import { Check } from "lucide-react";
import { stepLabels, WizardStep } from "./types";

export function Stepper({
  current,
  onJump,
}: {
  current: WizardStep;
  onJump: (s: WizardStep) => void;
}) {
  const currentIndex = Math.max(
    0,
    stepLabels.findIndex((s) => s.n === current),
  );

  const progressPct =
    stepLabels.length <= 1 ? 0 : (currentIndex / (stepLabels.length - 1)) * 100;

  return (
    <div className="w-full py-6">
      <div className="mx-auto w-full px-10">
        {/* Track + Progress */}
        <div className="relative">
          <div className="absolute left-0 right-0 top-4 h-0.5 bg-[#4b4b4b]/70" />
          <div
            className="absolute left-0 top-4 h-0.5 bg-[#7C6BF5]"
            style={{ width: `${progressPct}%` }}
          />

          {/* Steps */}
          <div className="relative flex w-full items-start justify-between">
            {stepLabels.map((s, idx) => {
              const isCompleted = idx < currentIndex;
              const isActive = idx === currentIndex;

              const circleClass = isCompleted
                ? "bg-[#7C6BF5] border-[#7C6BF5] text-white"
                : isActive
                  ? "bg-[#7C6BF5] border-[#7C6BF5] text-white"
                  : "bg-background border-[#8a8a8a] text-[#bdbdbd]";

              const labelClass = isActive ? "text-[#7C6BF5]" : "text-[#cfcfcf]";

              return (
                <div key={s.n} className="flex w-40 flex-col items-center">
                  <button
                    type="button"
                    onClick={() => onJump(s.n)}
                    className={[
                      "z-10 flex h-8 w-8 items-center justify-center rounded-full border-2",
                      "text-xs font-semibold transition",
                      "focus:outline-none focus:ring-2 focus:ring-[#7C6BF5]/40",
                      circleClass,
                    ].join(" ")}
                    aria-label={s.label}
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4" strokeWidth={3} />
                    ) : (
                      s.n
                    )}
                  </button>

                  <div
                    className={[
                      "mt-3 max-w-[170px] text-center text-xs font-medium",
                      labelClass,
                    ].join(" ")}
                  >
                    {s.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
