"use client";

import { useEffect, useRef, useState } from "react";
import { Eye, Paperclip, Trash2 } from "lucide-react";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Select } from "../course/ui/select";
import { Field } from "../course/ui/field";
import { ExtractPreviewDialog } from "../course/modal/ExtractPreviewDialog";
import { useExtractFile } from "../../hooks/useExtractFile";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { updateCourseSetup } from "../../store/slices/courseSetupSlice";
import { updateDraft } from "../../store/slices/courseSlice";

export default function Step1General({
  onValidChange,
}: {
  onValidChange: (ok: boolean) => void;
}) {
  const draft = useAppSelector((state) => state.courseSetup);
  const dispatch = useAppDispatch();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [objectivesText, setObjectivesText] = useState("");
  const [isEditingObjectives, setIsEditingObjectives] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const {
    loading: extractLoading,
    progress: extractProgress,
    error: extractError,
    extract,
  } = useExtractFile({
    onSuccess: (content) => {
      dispatch(updateCourseSetup({ extractedData: content }));
      dispatch(updateDraft({ extractedData: content }));
    },
  });

  const patchSetupAndDraft = (patch: {
    title?: string;
    domain?: string;
    level?: string;
    description?: string;
    objectives?: string[];
  }) => {
    dispatch(updateCourseSetup(patch));
    dispatch(
      updateDraft({
        ...(patch.title !== undefined ? { title: patch.title } : {}),
        ...(patch.domain !== undefined ? { domain: patch.domain } : {}),
        ...(patch.level !== undefined ? { level: patch.level } : {}),
        ...(patch.description !== undefined
          ? { description: patch.description }
          : {}),
        ...(patch.objectives !== undefined
          ? { objectives: patch.objectives.join("\n") }
          : {}),
      }),
    );
  };

  const ok =
    !!draft.title.trim() &&
    !!draft.domain.trim() &&
    !!draft.level.trim() &&
    !!draft.description.trim() &&
    draft.objectives.length > 0;

  const hasExtract = !!draft.extractedData?.trim();

  useEffect(() => onValidChange(ok), [ok, onValidChange]);

  return (
    <div className="mx-auto mt-4 w-full max-w-3xl text-white/60">
      <div className="overflow-hidden rounded-3xl border border-white/10">
        <div className="border-b border-white/10 px-6 py-5 sm:px-8">
          <p className="text-xs uppercase tracking-[0.14em] text-white/60">
            Etape 1
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-white/60 sm:text-[28px]">
            Informations generales
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-white/60">
            Renseignez les informations essentielles pour construire un cours
            clair et coherent.
          </p>
        </div>

        <div className="space-y-6 px-6 py-6 sm:px-8 sm:py-8">
          <Field label="Titre du cours">
            <Input
              value={draft.title}
              onChange={(e) => patchSetupAndDraft({ title: e.target.value })}
              placeholder="Ex: Introduction à la cybersécurité"
              className="h-12 rounded-xl border-white/10 bg-white/4 text-white/60 placeholder:text-white/20 placeholder:italic focus-visible:border-[#7C6BF5]/70"
            />
          </Field>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Field label="Domaine de formation">
              <Select
                value={draft.domain}
                onChange={(value) => patchSetupAndDraft({ domain: value })}
                options={[
                  "Mathematiques",
                  "Physique",
                  "Chimie",
                  "Sciences",
                  "Informatique",
                  "Langues",
                  "Histoire-Geographie",
                  "Finance",
                  "Marketing",
                  "Sante",
                  "Autre",
                ]}
                placeholder="Choisissez un domaine"
                className="h-12 rounded-xl border border-white/10 bg-white/4 p-2 text-white/60"
              />
            </Field>

            <Field label="Niveau des apprenants">
              <Select
                value={draft.level}
                onChange={(value) => patchSetupAndDraft({ level: value })}
                options={[
                  "6eme",
                  "5eme",
                  "4eme",
                  "3eme",
                  "Seconde",
                  "Premiere",
                  "Terminale",
                  "Debutant",
                  "Intermediaire",
                  "Avance",
                ]}
                placeholder="Selectionnez un niveau"
                className="h-12 rounded-xl border border-white/10 bg-white/4 p-2 text-white/60"
              />
            </Field>
          </div>

          <Field label="Description du cours">
            <Textarea
              value={draft.description}
              onChange={(e) =>
                patchSetupAndDraft({ description: e.target.value })
              }
              placeholder="Ce cours permettra à l'apprenant de comprendre les fondamentaux du sujet, depuis les bases théoriques jusqu'à la mise en pratique concrète."
              className="min-h-[130px] resize-none rounded-xl border-white/10 bg-white/4 text-white/60 placeholder:text-white/20 placeholder:italic focus-visible:border-[#7C6BF5]/70"
            />
            {!draft.description.trim() && (
              <button
                type="button"
                onClick={() =>
                  patchSetupAndDraft({
                    description:
                      "Ce cours permettra à l'apprenant de comprendre les fondamentaux du sujet, depuis les bases théoriques jusqu'à la mise en pratique. À la fin du cours, l'apprenant sera capable d'appliquer les notions clés dans des situations concrètes.",
                  })
                }
                className="mt-1.5 text-xs text-[#7C6BF5]/80 transition hover:text-[#7C6BF5]"
              >
                Voir un exemple →
              </button>
            )}
          </Field>

          <Field label="Objectifs du cours">
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
                patchSetupAndDraft({
                  objectives: nextText
                    .split("\n")
                    .map((line) => line.trim())
                    .filter(Boolean),
                });
              }}
              placeholder={"Comprendre le rôle et les principes fondamentaux\nIdentifier les concepts clés du domaine\nAppliquer les notions dans un cas concret\nÉvaluer sa compréhension par un quiz"}
              className="min-h-[130px] resize-none rounded-xl border-white/10 bg-white/4 text-white/60 placeholder:text-white/20 placeholder:italic focus-visible:border-[#7C6BF5]/70"
            />
            {draft.objectives.length === 0 && (
              <button
                type="button"
                onClick={() => {
                  const example = [
                    "Comprendre le rôle et les principes fondamentaux",
                    "Identifier les concepts clés du domaine",
                    "Appliquer les notions dans un cas concret",
                    "Évaluer sa compréhension par un quiz",
                  ];
                  setObjectivesText(example.join("\n"));
                  patchSetupAndDraft({ objectives: example });
                }}
                className="mt-1.5 text-xs text-[#7C6BF5]/80 transition hover:text-[#7C6BF5]"
              >
                Voir un exemple →
              </button>
            )}
          </Field>

          <Field
            label="Document source (optionnel)"
            hint="Ajoutez un document pour guider la generation IA a l'etape suivante."
            hintClassName="text-white/45"
          >
            <div className="rounded-xl border border-white/10 bg-white/4 p-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt,.md"
                className="hidden"
                disabled={extractLoading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setFileName(file.name);
                  void extract(file);
                  e.currentTarget.value = "";
                }}
              />

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={extractLoading}
                  className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 text-xs font-semibold text-white/70 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Paperclip className="h-3.5 w-3.5" />
                  {hasExtract ? "Remplacer document" : "Ajouter document"}
                </button>

                {hasExtract && (
                  <button
                    type="button"
                    onClick={() => setPreviewOpen(true)}
                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 text-xs font-semibold text-white/70 transition hover:bg-white/10"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Apercu
                  </button>
                )}

                {hasExtract && (
                  <button
                    type="button"
                    onClick={() => {
                      setFileName(null);
                      dispatch(updateCourseSetup({ extractedData: undefined }));
                      dispatch(updateDraft({ extractedData: undefined }));
                    }}
                    disabled={extractLoading}
                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 text-xs font-semibold text-white/70 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Retirer
                  </button>
                )}
              </div>

              <p className="mt-2 text-xs text-white/50">
                {extractLoading
                  ? `Extraction en cours... ${extractProgress}%`
                  : hasExtract
                    ? fileName
                      ? `Source liee: ${fileName}`
                      : "Source liee au cours"
                    : "Aucun document ajoute"}
              </p>

              {extractLoading && (
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full bg-[#7C6BF5] transition-all duration-200 ease-out"
                    style={{ width: `${extractProgress}%` }}
                  />
                </div>
              )}

              {extractError && (
                <p className="mt-2 text-xs text-red-300">
                  Erreur d&apos;extraction: {extractError}
                </p>
              )}
            </div>
          </Field>
        </div>
      </div>

      <ExtractPreviewDialog open={previewOpen} onOpenChange={setPreviewOpen} />
    </div>
  );
}
