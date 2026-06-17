"use client";

import { useEffect, useMemo, useState } from "react";
import { Step4Settings } from "../course/steps/Step4Settings";
import { useAppSelector } from "../../store/hooks";
import { getModulesStructureReport } from "../../lib/course/moduleStructure";

export default function Step3Setting({
  onValidChange,
}: {
  onValidChange: (ok: boolean) => void;
}) {
  const setup = useAppSelector((state) => state.courseSetup);
  const modules = useAppSelector((state) => state.course.builder.modules);
  const [settingsOk, setSettingsOk] = useState(false);
  const structure = useMemo(() => getModulesStructureReport(modules), [modules]);

  const checks = [
    {
      label: "Description du cours renseignee",
      ok: !!setup.description.trim(),
    },
    {
      label: "Au moins un objectif pedagogique",
      ok: setup.objectives.length > 0,
    },
    {
      label: "Au moins un module dans la table des matieres",
      ok: modules.length > 0,
    },
    {
      label: "Chaque module contient titre, contenu et quiz ou exercice",
      ok: structure.ok,
    },
  ];

  const ready = checks.every((check) => check.ok) && settingsOk;

  useEffect(() => {
    onValidChange(ready);
  }, [onValidChange, ready]);

  return (
    <div className="mx-auto w-full max-w-4xl px-2">
      <Step4Settings onValidChange={setSettingsOk} />
    </div>
  );
}
