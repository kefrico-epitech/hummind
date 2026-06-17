"use client";

import { useEffect, useMemo } from "react";
import { Input } from "../../ui/input";
import { Select } from "../ui/select";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { updateDraft } from "../../../store/slices/courseSlice";
import { Field } from "../ui/field";
import type { CourseVisibility } from "../types";

function isLimitedVisibility(value: string | undefined): boolean {
  const v = (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
  return v === "LIMITE" || v === "LIMITED";
}

export function Step4Settings({
  onValidChange,
}: {
  onValidChange: (ok: boolean) => void;
}) {
  const draft = useAppSelector((state) => state.course);
  const dispatch = useAppDispatch();

  const isLimited = isLimitedVisibility(draft.visibility as string);
  const hasDates = !!draft.startDate && !!draft.endDate;
  const rangeValid =
    !hasDates || String(draft.startDate) <= String(draft.endDate);

  const ok = useMemo(() => {
    if (!draft.visibility) return false;
    if (!isLimited) return true;
    return hasDates && rangeValid;
  }, [draft.visibility, hasDates, isLimited, rangeValid]);

  useEffect(() => onValidChange(ok), [ok, onValidChange]);

  return (
    <div className="mx-auto mt-2 w-full max-w-3xl rounded-2xl border border-white/20 p-6">
      <h2 className="text-center text-2xl font-semibold text-white">
        Parametres de publication
      </h2>
      <p className="mt-2 text-center text-sm text-[#9b9b9b]">
        Choisissez la disponibilite du cours avant publication.
      </p>

      <div className="mt-8 space-y-6">
        <Field label="Disponibilite du cours">
          <Select
            value={draft.visibility}
            onChange={(value: string) =>
              dispatch(
                updateDraft({
                  visibility:
                    value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase() ===
                    "LIMITE"
                      ? ("Limit\u00e9" as CourseVisibility)
                      : ("Illimit\u00e9" as CourseVisibility),
                }),
              )
            }
            options={["Illimit\u00e9", "Limit\u00e9"]}
            placeholder="Choisissez la disponibilite"
          />
        </Field>

        {isLimited && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Field label="Date de debut">
              <Input
                type="date"
                value={draft.startDate || ""}
                onChange={(e) =>
                  dispatch(updateDraft({ startDate: e.target.value }))
                }
                className="h-11 rounded-2xl border-[#3a3a3a] bg-transparent text-white focus-visible:border-[#7C6BF5]"
              />
            </Field>

            <Field label="Date de fin">
              <Input
                type="date"
                value={draft.endDate || ""}
                onChange={(e) =>
                  dispatch(updateDraft({ endDate: e.target.value }))
                }
                className="h-11 rounded-2xl border-[#3a3a3a] bg-transparent text-white focus-visible:border-[#7C6BF5]"
              />
            </Field>
          </div>
        )}

        {isLimited && hasDates && !rangeValid && (
          <p className="text-sm text-amber-300">
            La date de fin doit etre posterieure ou egale a la date de debut.
          </p>
        )}
      </div>
    </div>
  );
}
