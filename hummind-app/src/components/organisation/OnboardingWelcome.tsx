"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Loader2, Sparkles } from "lucide-react";
import { EntityService } from "../../services/entity.service";
import { toast } from "../../lib/notify";
import { useAppSelector } from "../../store/hooks";

type Step = 1 | 2 | 3;

interface OnboardingWelcomeProps {
  /** Called once the org is created, before redirection. */
  onCreated?: (entityId: string) => void;
}

export default function OnboardingWelcome({ onCreated }: OnboardingWelcomeProps) {
  const router = useRouter();
  const user = useAppSelector((state) => state.user.user);

  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const trimmedName = name.trim();
  const trimmedDescription = description.trim();
  const canSubmit = trimmedName.length >= 3;

  const goNext = () => {
    if (step === 1 && !canSubmit) {
      toast.error("Le nom doit comporter au moins 3 caractères.");
      return;
    }
    setStep((s) => (Math.min(3, s + 1) as Step));
  };

  const goBack = () => setStep((s) => (Math.max(1, s - 1) as Step));

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const res = await EntityService.create({
        name: trimmedName,
        description: trimmedDescription || undefined,
        type: "ORGANISATION",
      });
      if (res.error || !res.data) {
        throw new Error(res.error || "Création impossible");
      }
      const entityId = res.data.id;
      toast.success("Organisation créée !");
      if (onCreated) onCreated(entityId);
      router.replace(`/organisation/${entityId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSubmitting(false);
    }
  };

  const firstname = user?.firstname ?? "";

  return (
    <main
      className="min-h-svh"
      style={{
        background:
          "linear-gradient(160deg, #edebfa 0%, #f5eef0 50%, #ffe9de 100%)",
      }}
    >
      <div className="mx-auto flex min-h-svh max-w-[640px] flex-col items-stretch justify-center px-6 py-10">
        <div className="overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-black/5">
          {/* Header */}
          <div className="border-b border-black/5 px-8 pt-8 pb-6">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-hm-purple-100 text-hm-purple-500">
              <Sparkles className="h-5 w-5" />
            </div>
            <h1 className="mt-4 text-[24px] font-bold leading-tight text-hm-ink-900">
              Bienvenue sur Hummind{firstname ? `, ${firstname}` : ""} !
            </h1>
            <p className="mt-2 text-[13px] leading-relaxed text-hm-ink-500">
              Créez votre première organisation pour structurer vos
              formations.
            </p>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-2 px-8 pt-6">
            {[1, 2, 3].map((s) => (
              <span
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  s <= step ? "bg-hm-purple-500" : "bg-hm-bg-soft"
                }`}
              />
            ))}
          </div>
          <p className="px-8 pt-3 text-[11px] font-semibold uppercase tracking-wide text-hm-ink-500">
            Étape {step}/3
          </p>

          {/* Body */}
          <div className="px-8 pt-4 pb-8">
            {step === 1 && (
              <div>
                <h2 className="text-[18px] font-semibold text-hm-ink-900">
                  Nom de votre organisation
                </h2>
                <p className="mt-1 text-[13px] text-hm-ink-500">
                  Ex : « École Excellence Abidjan », « Centre PRO Lyon ».
                </p>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Le nom de votre établissement"
                  autoFocus
                  className="mt-4 w-full rounded-xl bg-white px-4 py-3 text-[14px] text-hm-ink-900 ring-1 ring-black/10 outline-none transition-shadow placeholder:text-hm-ink-400 focus:ring-2 focus:ring-hm-purple-300"
                />
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="text-[18px] font-semibold text-hm-ink-900">
                  Description courte
                </h2>
                <p className="mt-1 text-[13px] text-hm-ink-500">
                  Optionnel. Une phrase qui décrit votre établissement.
                </p>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex : Formation professionnelle et scolaire"
                  className="mt-4 w-full resize-none rounded-xl bg-white px-4 py-3 text-[14px] text-hm-ink-900 ring-1 ring-black/10 outline-none transition-shadow placeholder:text-hm-ink-400 focus:ring-2 focus:ring-hm-purple-300"
                />
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 className="text-[18px] font-semibold text-hm-ink-900">
                  Confirmation
                </h2>
                <p className="mt-1 text-[13px] text-hm-ink-500">
                  Vérifiez vos informations avant la création.
                </p>
                <dl className="mt-5 grid grid-cols-1 gap-3 rounded-2xl bg-hm-bg-soft p-5 text-[13px]">
                  <div className="grid grid-cols-[120px_1fr] gap-2">
                    <dt className="text-hm-ink-500">Nom</dt>
                    <dd className="font-medium text-hm-ink-900">
                      {trimmedName || "—"}
                    </dd>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] gap-2">
                    <dt className="text-hm-ink-500">Description</dt>
                    <dd className="text-hm-ink-900">
                      {trimmedDescription || (
                        <span className="text-hm-ink-400">(aucune)</span>
                      )}
                    </dd>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] gap-2">
                    <dt className="text-hm-ink-500">Votre rôle</dt>
                    <dd className="inline-flex w-fit items-center gap-1 rounded-full bg-hm-purple-100 px-3 py-1 text-[11px] font-semibold text-hm-purple-500">
                      OWNER
                    </dd>
                  </div>
                </dl>
                <p className="mt-4 text-[12px] text-hm-ink-500">
                  Vous pourrez ensuite ajouter des départements, salles,
                  cours et apprenants à cette organisation.
                </p>
              </div>
            )}

            {/* Footer actions */}
            <div className="mt-8 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={goBack}
                disabled={step === 1 || submitting}
                className="inline-flex items-center gap-1.5 rounded-full bg-transparent px-4 py-2 text-[13px] font-medium text-hm-ink-500 transition-colors hover:text-hm-ink-900 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowLeft className="h-4 w-4" /> Retour
              </button>

              {step < 3 ? (
                <button
                  type="button"
                  onClick={goNext}
                  disabled={step === 1 && !canSubmit}
                  className="inline-flex items-center gap-2 rounded-full bg-hm-ink-950 px-6 py-3 text-[13px] font-semibold text-white transition-colors hover:bg-hm-ink-900 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Suivant <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={submit}
                  disabled={!canSubmit || submitting}
                  className="inline-flex items-center gap-2 rounded-full bg-hm-purple-500 px-6 py-3 text-[13px] font-semibold text-white transition-colors hover:bg-hm-purple-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Création...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Créer mon organisation
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
