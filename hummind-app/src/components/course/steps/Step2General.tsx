"use client";

import { useEffect, useState } from "react";
import { Input } from "../../ui/input";
import { Textarea } from "../../ui/textarea";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { updateCourseSetup } from "../../../store/slices/courseSetupSlice";
import { Select } from "../ui/select";
import { Field } from "../ui/field";
import { useExtractFile } from "../../../hooks/useExtractFile";
import { DocumentUploader } from "../../common/DocumentUploader";

export function Step2General({
  onValidChange,
}: {
  onValidChange: (ok: boolean) => void;
}) {
  const draft = useAppSelector((state) => state.courseSetup);
  const dispatch = useAppDispatch();
  const [objectivesText, setObjectivesText] = useState("");
  const [isEditingObjectives, setIsEditingObjectives] = useState(false);

  // Upload + extraction réutilisables (même hook utilisé en Step3)
  const { loading, progress, error, extract } = useExtractFile({
    onSuccess: (content) => {
      dispatch(updateCourseSetup({ extractedData: content }));
    },
  });

  // Précharger des valeurs par défaut cohérentes
  // useEffect(() => {
  //   if (!draft.title)
  //     dispatch(updateDraft({ title: "Introduction à la cybersécurité" }));
  //   if (!draft.domain) dispatch(updateDraft({ domain: "Informatique" }));
  //   if (!draft.level) dispatch(updateDraft({ level: "Débutant" }));
  //   if (!draft.description)
  //     dispatch(
  //       updateDraft({
  //         description:
  //           "Ce cours présente les bases de la cybersécurité, les menaces courantes et les bonnes pratiques pour protéger ses données.",
  //       }),
  //     );
  //   if (!draft.objectives)
  //     dispatch(
  //       updateDraft({
  //         objectives:
  //           "Comprendre les concepts fondamentaux de la cybersécurité.\nIdentifier les menaces numériques.\nAppliquer des mesures de protection simples.",
  //       }),
  //     );
  //   if (!draft.style && draft.mode === "AI_ONLY")
  //     dispatch(updateDraft({ style: "Accessible" }));
  // }, [dispatch, draft]);

  // Validation stricte selon le mode
  const ok =
    draft.mode === "STEP_BY_STEP"
      ? !!draft.title.trim() &&
        !!draft.domain.trim() &&
        !!draft.level.trim() &&
        !!draft.description.trim() &&
        draft.objectives.length > 0
      : draft.mode === "AI_ONLY"
        ? !!draft.title.trim() &&
          !!draft.domain.trim() &&
          !!draft.level.trim() &&
          !!draft.description.trim() &&
          draft.objectives.length > 0
        : !!draft.title.trim(); // HYBRID -> minimum titre (comme ton code actuel)

  useEffect(() => onValidChange(ok), [ok, onValidChange]);

  return (
    <div className="mx-auto mt-10 w-full max-w-2xl rounded-2xl border-2 border-white/20 p-6">
      <h2 className="text-center text-2xl font-semibold text-white">
        Informations générales
      </h2>
      <p className="mt-2 text-center text-sm text-[#9b9b9b]">
        Renseignez les informations de base afin de créer et structurer votre
        cours.
      </p>

      <div className="mt-10 space-y-6">
        {/* Titre */}
        <Field label="Titre du cours" hint="Obligatoire">
          <Input
            value={draft.title}
            onChange={(e) =>
              dispatch(updateCourseSetup({ title: e.target.value }))
            }
            placeholder="Ex: Introduction à la cybersécurité"
            className="h-11 rounded-2xl border-[#3a3a3a] bg-transparent text-white placeholder:text-[#777] focus-visible:border-[#7C6BF5]"
          />
        </Field>

        {/* Domaine */}
        <Field label="Domaine de formation">
          <Select
            value={draft.domain}
            onChange={(value) => dispatch(updateCourseSetup({ domain: value }))}
            options={["Informatique", "Finance", "Marketing", "Santé", "Autre"]}
            placeholder="Choisissez un domaine"
          />
        </Field>

        {/* Niveau */}
        <Field label="Niveau de la cible">
          <Select
            value={draft.level}
            onChange={(value) => dispatch(updateCourseSetup({ level: value }))}
            options={["Débutant", "Intermédiaire", "Avancé"]}
            placeholder="Sélectionnez un niveau"
          />
        </Field>

        {/* Style pédagogique si IA */}
        {draft.mode === "AI_ONLY" && (
          <Field label="Ton et style pédagogique">
            <Select
              value={draft.style}
              onChange={(value) => dispatch(updateCourseSetup({ style: value }))}
              options={["Formel", "Accessible", "Interactif", "Narratif"]}
              placeholder="Choisissez un style"
            />
          </Field>
        )}

        {/* Description */}
        <Field label="Description du cours">
          <Textarea
            value={draft.description}
            onChange={(e) =>
              dispatch(updateCourseSetup({ description: e.target.value }))
            }
            placeholder="Décrivez brièvement ce que l’apprenant va obtenir..."
            className="min-h-[120px] resize-none rounded-2xl border-[#3a3a3a] bg-transparent text-white placeholder:text-[#777] focus-visible:border-[#7C6BF5]"
          />
        </Field>

        {/* Objectifs */}
        <Field label="Les objectifs du cours">
          <Textarea
            value={
              isEditingObjectives ? objectivesText : draft.objectives.join("\n")
            }
            onFocus={() => {
              setObjectivesText(draft.objectives.join("\n"));
              setIsEditingObjectives(true);
            }}
            onBlur={() => setIsEditingObjectives(false)}
            onChange={(e) => {
              const nextText = e.target.value;
              setObjectivesText(nextText);
              dispatch(
                updateCourseSetup({
                  objectives: nextText
                    .split("\n")
                    .map((line) => line.trim())
                    .filter(Boolean),
                }),
              );
            }}
            placeholder="Listez les objectifs pédagogiques..."
            className="min-h-[120px] resize-none rounded-2xl border-[#3a3a3a] bg-transparent text-white placeholder:text-[#777] focus-visible:border-[#7C6BF5]"
          />
        </Field>

        {/* Document si HYBRID */}
        {draft.mode === "HYBRID" && (
          <Field label="Ajouter un document">
            <DocumentUploader
              disabled={loading}
              onFileSelected={(file) => extract(file)}
              accept=".pdf,.docx,.txt,.md"
            />

            {/* Loader progress bar */}
            {loading && (
              <div className="mt-6">
                <div className="h-4 w-full overflow-hidden rounded-full bg-[#2a2a2a]">
                  <div
                    className="h-4 bg-linear-to-r from-[#7077DA] to-[#E84747] transition-all duration-200 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="mt-2 text-center text-sm text-[#9b9b9b]">
                  Extraction du document... {progress}%
                </p>
              </div>
            )}

            {/* Error */}
            {error && (
              <p className="mt-3 text-sm text-red-400">
                Erreur d’extraction : {error}
              </p>
            )}

            {/* Info si déjà extrait */}
            {!!draft.extractedData && !loading && !error && (
              <p className="mt-3 text-sm text-emerald-400">
                Document extrait ✅ (contenu prêt pour l’IA)
              </p>
            )}
          </Field>
        )}
      </div>
    </div>
  );
}
