"use client";

import { useEffect } from "react";
import { Field } from "../ui/field";
import { Input } from "../../../ui/input";
import { Textarea } from "../../../ui/textarea";
import { useAppDispatch, useAppSelector } from "../../../../store/hooks";
import { updateDraft } from "../../../../store/slices/courseSlice";
import { Select } from "../ui/select";

export function Step2General({
  onValidChange,
}: {
  onValidChange: (ok: boolean) => void;
}) {
  const draft = useAppSelector((state) => state.course);
  const dispatch = useAppDispatch();

  // Validation stricte si Step by Step, sinon titre obligatoire
  const ok =
    draft.mode === "STEP_BY_STEP"
      ? !!draft.title.trim() &&
        !!draft.domain.trim() &&
        !!draft.level.trim() &&
        !!draft.description.trim() &&
        !!draft.objectives.trim()
      : draft.mode === "AI_ONLY"
        ? !!draft.title.trim() &&
          !!draft.domain.trim() &&
          !!draft.level.trim() &&
          !!draft.description.trim() &&
          !!draft.objectives.trim()
        : !!draft.title.trim();

  useEffect(() => onValidChange(ok), [ok, onValidChange, draft]);

  console.log("draft in step 2 :", draft);

  return (
    <div className="mx-auto mt-10 w-full max-w-2xl px-6 border-2 border-white rounded-2xl p-6">
      <h2 className="text-center text-2xl font-semibold text-white">
        Informations générales
      </h2>
      <p className="mt-2 text-center text-sm text-[#9b9b9b]">
        Choisissez la manière qui vous convient le mieux pour créer et
        structurer vos cours.
      </p>

      {/* Champs affichés selon le mode */}
      <div className="mt-10 space-y-6">
        {/* Titre toujours présent */}
        <Field label="Titre du cours" hint="Obligatoire">
          <Input
            value={draft.title}
            onChange={(e) => dispatch(updateDraft({ title: e.target.value }))}
            placeholder="Ex: Introduction à la cybersécurité"
            className="h-11 rounded-2xl border-[#3a3a3a] bg-transparent text-white placeholder:text-[#777] focus-visible:border-[#7C6BF5]"
          />
        </Field>

        {/* Domaine toujours présent */}
        <Field label="Domaine de formation">
          <Select
            value={draft.domain}
            onChange={(value) => dispatch(updateDraft({ domain: value }))}
            options={["Informatique", "Finance", "Marketing", "Santé"]}
            placeholder="Choisissez un domaine"
          />
        </Field>

        {/* Niveau toujours présent */}
        <Field label="Niveau de la cible">
          <Select
            value={draft.level}
            onChange={(value) => dispatch(updateDraft({ level: value }))}
            options={["Débutant", "Intermédiaire", "Avancé"]}
            placeholder="Sélectionnez un niveau"
          />
        </Field>

        {/* Ton et style pédagogique UNIQUEMENT en mode IA */}
        {draft.mode === "AI_ONLY" && (
          <Field label="Ton et style pédagogique">
            <Select
              value={draft.style}
              onChange={(value) => dispatch(updateDraft({ style: value }))}
              options={["Formel", "Accessible", "Interactif", "Narratif"]}
              placeholder="Choisissez un style"
            />
          </Field>
        )}

        {/* Description toujours présente */}
        <Field label="Description du cours">
          <Textarea
            value={draft.description}
            onChange={(e) =>
              dispatch(updateDraft({ description: e.target.value }))
            }
            placeholder="Décrivez brièvement ce que l’apprenant va obtenir..."
            className="min-h-[120px] resize-none rounded-2xl border-[#3a3a3a] bg-transparent text-white placeholder:text-[#777] focus-visible:border-[#7C6BF5]"
          />
        </Field>

        {/* Objectifs toujours présents */}
        <Field label="Les objectifs du cours">
          <Textarea
            value={draft.objectives}
            onChange={(e) =>
              dispatch(updateDraft({ objectives: e.target.value }))
            }
            placeholder="Listez les objectifs pédagogiques..."
            className="min-h-[120px] resize-none rounded-2xl border-[#3a3a3a] bg-transparent text-white placeholder:text-[#777] focus-visible:border-[#7C6BF5]"
          />
        </Field>

        {/* Ajouter un document UNIQUEMENT en mode HYBRID */}
        {draft.mode === "HYBRID" && (
          <Field label="Ajouter un document">
            <Input
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  dispatch(updateDraft({ document: file })); // <-- ajout au redux
                }
              }}
              className="h-11 rounded-2xl border-[#3a3a3a] bg-transparent text-white focus-visible:border-[#7C6BF5]"
            />
          </Field>
        )}
      </div>
    </div>
  );
}
