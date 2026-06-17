"use client";

import { useEffect } from "react";
import { copyTextToClipboard } from "../../../../lib/clipboard";
import { toast } from "../../../../lib/notify";
import { Input } from "../../../ui/input";
import { useAppDispatch, useAppSelector } from "../../../../store/hooks";
import { updateDraft } from "../../../../store/slices/courseSlice";
import { Field } from "../ui/field";
import { Select } from "../ui/select";
import type { CourseVisibility } from "../types";

const UNLIMITED_VISIBILITY = "Illimit\u00e9" as const;
const LIMITED_VISIBILITY = "Limit\u00e9" as const;

function normalizeVisibility(value: string): CourseVisibility {
  return value === "Limite" ? LIMITED_VISIBILITY : UNLIMITED_VISIBILITY;
}

export function Step4Settings({
  onValidChange,
}: {
  onValidChange: (ok: boolean) => void;
}) {
  const draft = useAppSelector((state) => state.course);
  const dispatch = useAppDispatch();

  const ok =
    draft.visibility === UNLIMITED_VISIBILITY
      ? !!draft.visibility
      : !!draft.visibility && !!draft.startDate && !!draft.endDate;

  useEffect(() => {
    onValidChange(ok);
  }, [ok, onValidChange]);

  return (
    <div className="mx-auto mt-10 w-full max-w-3xl rounded-2xl border-2 border-white/30 p-6 px-6">
      <h2 className="text-center text-2xl font-semibold text-white">
        Parametres du cours
      </h2>
      <p className="mt-2 text-center text-sm text-[#9b9b9b]">
        Votre formation est prete a etre publiee. Configurez la disponibilite et
        partagez le lien avec vos participants.
      </p>

      <div className="mt-10 space-y-6">
        <Field label="Disponibilite du cours">
          <Select
            value={draft.visibility}
            onChange={(value: string) =>
              dispatch(updateDraft({ visibility: normalizeVisibility(value) }))
            }
            options={[UNLIMITED_VISIBILITY, LIMITED_VISIBILITY]}
            placeholder="Choisissez la disponibilite"
          />
        </Field>

        {draft.visibility === LIMITED_VISIBILITY && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Field label="Date de debut">
              <Input
                type="date"
                value={draft.startDate || ""}
                onChange={(event) =>
                  dispatch(updateDraft({ startDate: event.target.value }))
                }
                className="h-11 rounded-2xl border-[#3a3a3a] bg-transparent text-white focus-visible:border-[#7C6BF5]"
              />
            </Field>

            <Field label="Date de fin">
              <Input
                type="date"
                value={draft.endDate || ""}
                onChange={(event) =>
                  dispatch(updateDraft({ endDate: event.target.value }))
                }
                className="h-11 rounded-2xl border-[#3a3a3a] bg-transparent text-white focus-visible:border-[#7C6BF5]"
              />
            </Field>
          </div>
        )}

        <Field label="Lien du cours">
          <div className="flex items-center gap-2">
            <Input
              value={draft.link || ""}
              onChange={(event) =>
                dispatch(updateDraft({ link: event.target.value }))
              }
              placeholder="https://..."
              className="h-11 flex-1 rounded-2xl border-[#3a3a3a] bg-transparent text-white placeholder:text-[#777] focus-visible:border-[#7C6BF5]"
            />
            <button
              type="button"
              onClick={async () => {
                if (!draft.link) return;
                const copied = await copyTextToClipboard(draft.link);
                if (!copied) {
                  toast.error("Impossible de copier le lien.");
                  return;
                }

                toast.success("Lien copie dans le presse-papier.");
              }}
              className="rounded-xl border border-[#7C6BF5] px-4 py-2 text-sm font-semibold text-[#7C6BF5] hover:bg-[#7C6BF5]/10"
            >
              Copier
            </button>
          </div>
        </Field>
      </div>
    </div>
  );
}
