"use client";

import { useEffect } from "react";
import { CourseCreationMode } from "../types";
import { Card } from "../../../ui/card";
import { RadioGroup, RadioGroupItem } from "../../../ui/radio-group";
import { Label } from "../../../ui/label";
import { useAppSelector, useAppDispatch } from "../../../../store/hooks";
import { updateDraft } from "../../../../store/slices/courseSlice";

export function Step1Mode({
  onValidChange,
}: {
  onValidChange: (ok: boolean) => void;
}) {
  const course = useAppSelector((state) => state.course);
  const dispatch = useAppDispatch();

  useEffect(() => {
    onValidChange(!!course.mode);
  }, [course.mode, onValidChange]);

  const items: { id: CourseCreationMode; title: string; desc: string }[] = [
    {
      id: "AI_ONLY",
      title: "Mode IA Uniquement",
      desc: "Avec le mode IA, décrivez votre idée et obtenez instantanément un cours structuré et personnalisé.",
    },
    {
      id: "HYBRID",
      title: "Mode Hybride",
      desc: "Avec le mode hybride, l’IA vous propose une base structurée que vous personnalisez selon vos besoins.",
    },
    {
      id: "STEP_BY_STEP",
      title: "Mode Step by Step",
      desc: "Avec le mode Step by Step, créez votre cours progressivement grâce à un guidage clair et intuitif.",
    },
  ];

  return (
    <div className="mx-auto mt-10 w-full max-w-6xl px-6">
      <h1 className="text-center text-3xl font-semibold text-white">
        Mode de création de cours
      </h1>
      <p className="mt-3 text-center text-sm text-white/40">
        Choisissez la manière qui vous convient le mieux pour créer et
        structurer vos cours.
      </p>

      <RadioGroup
        value={course.mode ?? ""}
        onValueChange={(v) =>
          dispatch(updateDraft({ mode: v as CourseCreationMode }))
        }
        className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-3"
      >
        {items.map((m) => {
          const active = course.mode === m.id;

          return (
            <Label key={m.id} className="cursor-pointer">
              <RadioGroupItem value={m.id} id={m.id} className="sr-only" />

              <Card
                className={[
                  "relative h-[220px] rounded-3xl border p-8",
                  "bg-white/5 hover:bg-white/7 transition",
                  "flex flex-col justify-between",
                  active ? "border-[#7C6BF5]" : "border-white/10",
                ].join(" ")}
              >
                {active && (
                  <div className="pointer-events-none absolute inset-0 rounded-3xl bg-[#7C6BF5]/10" />
                )}

                <div className="relative">
                  <div className="text-xl font-semibold text-white">
                    {m.title}
                  </div>
                </div>

                <div className="relative text-sm leading-relaxed text-white/55">
                  {m.desc}
                </div>
              </Card>
            </Label>
          );
        })}
      </RadioGroup>
    </div>
  );
}
