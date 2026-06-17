"use client";

import { X } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../../../ui/button";

/**
 * RecordCourseModal.tsx
 * - Modal full-screen style (comme ta capture)
 * - Wizard 5 étapes
 * - Chaque étape est un composant séparé
 * - Bouton "Suivant" désactivé tant que l'étape n'est pas valide
 *
 * ✅ Tu peux brancher ensuite tes services/API (création cours, IA, etc.)
 */

/* =========================
   Types
========================= */

type CourseCreationMode = "AI_ONLY" | "HYBRID" | "STEP_BY_STEP";

type WizardStep = 1 | 2 | 3 | 4 | 5;

type CourseDraft = {
  mode: CourseCreationMode | null;
  title: string;
  description: string;
  content: string; // peut devenir structure riche plus tard
  visibility: "PRIVATE" | "ROOM" | "PUBLIC";
  allowComments: boolean;
};


/* =========================
   Props
========================= */

export interface RecordCourseModalProps {
  backTo?: string | null;
  parentId?: string | null; // salleId (optionnel si tu veux rattacher le cours)
}

/* =========================
   Stepper UI
========================= */

const stepLabels = [
  { n: 1 as const, label: "Mode de création de cours" },
  { n: 2 as const, label: "Informations générales" },
  { n: 3 as const, label: "contenus du cours" },
  { n: 4 as const, label: "Paramètre du cours" },
  { n: 5 as const, label: "Finalisation du cours" },
];

function Stepper({
  current,
  onJump,
}: {
  current: WizardStep;
  onJump: (s: WizardStep) => void;
}) {
  return (
    <div className="px-6 pt-4">
      <div className="flex items-center justify-between gap-3">
        {stepLabels.map((s, idx) => {
          const isActive = s.n === current;
          const isDone = s.n < current;

          return (
            <div key={s.n} className="flex-1">
              <div className="flex items-center">
                {/* Dot */}
                <button
                  type="button"
                  onClick={() => onJump(s.n)}
                  className={[
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold",
                    isActive
                      ? "bg-[#7C6BF5] text-white"
                      : isDone
                      ? "bg-white/3 text-white"
                      : "bg-transparent text-[#8b8b8b] border border-[#3a3a3a]",
                  ].join(" ")}
                  title={s.label}
                >
                  {s.n}
                </button>

                {/* Line */}
                {idx !== stepLabels.length - 1 && (
                  <div
                    className={[
                      "mx-3 h-0.5 flex-1 rounded-full",
                      isDone ? "bg-white/4" : "bg-white/3",
                    ].join(" ")}
                  />
                )}
              </div>

              {/* Label */}
              <div
                className={[
                  "mt-2 text-center text-xs",
                  isActive ? "text-[#7C6BF5]" : "text-[#9b9b9b]",
                ].join(" ")}
              >
                {s.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* =========================
   Step 1: Mode
========================= */

function ModeCard({
  title,
  desc,
  active,
  onClick,
}: {
  title: string;
  desc: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full rounded-3xl border p-6 text-left transition",
        "bg-white/2/60 hover:bg-white/2",
        active ? "border-[#7C6BF5]" : "border-[#3a3a3a]",
      ].join(" ")}
    >
      <div className="text-lg font-semibold text-white">{title}</div>
      <div className="mt-3 text-sm leading-relaxed text-[#b9b9b9]">{desc}</div>
    </button>
  );
}

function Step1Mode({
  value,
  onChange,
  onValidChange,
}: {
  value: CourseCreationMode | null;
  onChange: (v: CourseCreationMode) => void;
  onValidChange: (ok: boolean) => void;
}) {
  // valid = mode non null
  useMemo(() => {
    onValidChange(!!value);
  }, [value, onValidChange]);

  return (
    <div className="mx-auto mt-10 w-full max-w-5xl px-6">
      <h1 className="text-center text-3xl font-semibold text-white">
        Mode de création de cours
      </h1>
      <p className="mt-3 text-center text-sm text-[#9b9b9b]">
        Choisissez la manière qui vous convient le mieux pour créer et structurer
        vos cours.
      </p>

      <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
        <ModeCard
          title="Mode IA Uniquement"
          desc="Avec le mode IA, décrivez votre idée et obtenez instantanément un cours structuré et personnalisé."
          active={value === "AI_ONLY"}
          onClick={() => onChange("AI_ONLY")}
        />
        <ModeCard
          title="Mode Hybride"
          desc="Avec le mode hybride, l’IA vous propose une base structurée que vous personnalisez selon vos besoins."
          active={value === "HYBRID"}
          onClick={() => onChange("HYBRID")}
        />
        <ModeCard
          title="Mode Step by Step"
          desc="Avec le mode Step by Step, créez votre cours progressivement grâce à un guidage clair et intuitif."
          active={value === "STEP_BY_STEP"}
          onClick={() => onChange("STEP_BY_STEP")}
        />
      </div>
    </div>
  );
}

/* =========================
   Step 2: Infos générales
========================= */

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-white">{label}</div>
      {children}
      {hint && <div className="text-xs text-[#9b9b9b]">{hint}</div>}
    </div>
  );
}

function Step2General({
  draft,
  onChange,
  onValidChange,
}: {
  draft: CourseDraft;
  onChange: (patch: Partial<CourseDraft>) => void;
  onValidChange: (ok: boolean) => void;
}) {
  const ok = !!draft.title.trim();

  useMemo(() => onValidChange(ok), [ok, onValidChange]);

  return (
    <div className="mx-auto mt-10 w-full max-w-2xl px-6">
      <h2 className="text-center text-2xl font-semibold text-white">
        Informations générales
      </h2>
      <p className="mt-2 text-center text-sm text-[#9b9b9b]">
        Donnez un titre clair et une courte description.
      </p>

      <div className="mt-10 space-y-6">
        <Field label="Titre du cours" hint="Obligatoire">
          <input
            value={draft.title}
            onChange={(e) => onChange({ title: e.target.value })}
            className="h-11 w-full rounded-2xl border border-[#3a3a3a] bg-transparent px-4 text-sm text-white outline-none focus:border-[#7C6BF5]"
            placeholder="Ex: Introduction à la cybersécurité"
          />
        </Field>

        <Field label="Description">
          <textarea
            value={draft.description}
            onChange={(e) => onChange({ description: e.target.value })}
            className="min-h-[110px] w-full resize-none rounded-2xl border border-[#3a3a3a] bg-transparent px-4 py-3 text-sm text-white outline-none focus:border-[#7C6BF5]"
            placeholder="Décrivez brièvement ce que l’apprenant va obtenir..."
          />
        </Field>
      </div>
    </div>
  );
}

/* =========================
   Step 3: Contenu
========================= */

function Step3Content({
  draft,
  onChange,
  onValidChange,
}: {
  draft: CourseDraft;
  onChange: (patch: Partial<CourseDraft>) => void;
  onValidChange: (ok: boolean) => void;
}) {
  // Pour l’instant : au moins 20 chars si tu veux une règle
  const ok = draft.content.trim().length >= 10;

  useMemo(() => onValidChange(ok), [ok, onValidChange]);

  return (
    <div className="mx-auto mt-10 w-full max-w-3xl px-6">
      <h2 className="text-center text-2xl font-semibold text-white">
        Contenus du cours
      </h2>
      <p className="mt-2 text-center text-sm text-[#9b9b9b]">
        Ajoutez le contenu principal (vous pourrez le structurer ensuite).
      </p>

      <div className="mt-10">
        <textarea
          value={draft.content}
          onChange={(e) => onChange({ content: e.target.value })}
          className="min-h-[260px] w-full resize-none rounded-3xl border border-[#3a3a3a] bg-transparent px-5 py-4 text-sm text-white outline-none focus:border-[#7C6BF5]"
          placeholder="Saisissez ici le contenu du cours..."
        />
        <div className="mt-2 text-xs text-[#9b9b9b]">
          Minimum recommandé : 10 caractères.
        </div>
      </div>
    </div>
  );
}

/* =========================
   Step 4: Paramètres
========================= */

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between rounded-2xl border border-[#3a3a3a] bg-transparent px-4 py-3 text-left"
    >
      <span className="text-sm text-white">{label}</span>
      <span
        className={[
          "h-6 w-11 rounded-full p-1 transition",
          checked ? "bg-[#7C6BF5]" : "bg-white/3",
        ].join(" ")}
      >
        <span
          className={[
            "block h-4 w-4 rounded-full bg-white transition",
            checked ? "translate-x-5" : "translate-x-0",
          ].join(" ")}
        />
      </span>
    </button>
  );
}

function Step4Settings({
  draft,
  onChange,
  onValidChange,
}: {
  draft: CourseDraft;
  onChange: (patch: Partial<CourseDraft>) => void;
  onValidChange: (ok: boolean) => void;
}) {
  // Pas de contrainte -> toujours OK
  useMemo(() => onValidChange(true), [onValidChange]);

  return (
    <div className="mx-auto mt-10 w-full max-w-2xl px-6">
      <h2 className="text-center text-2xl font-semibold text-white">
        Paramètre du cours
      </h2>
      <p className="mt-2 text-center text-sm text-[#9b9b9b]">
        Configurez la visibilité et les options.
      </p>

      <div className="mt-10 space-y-6">
        <div className="space-y-2">
          <div className="text-sm font-medium text-white">Visibilité</div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {(["PRIVATE", "ROOM", "PUBLIC"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => onChange({ visibility: v })}
                className={[
                  "rounded-2xl border px-4 py-3 text-sm transition",
                  draft.visibility === v
                    ? "border-[#7C6BF5] bg-[#7C6BF5]/10 text-white"
                    : "border-[#3a3a3a] bg-transparent text-[#b9b9b9] hover:bg-white/3",
                ].join(" ")}
              >
                {v === "PRIVATE"
                  ? "Privé"
                  : v === "ROOM"
                  ? "Salle"
                  : "Public"}
              </button>
            ))}
          </div>
        </div>

        <Toggle
          label="Autoriser les commentaires"
          checked={draft.allowComments}
          onChange={(v) => onChange({ allowComments: v })}
        />
      </div>
    </div>
  );
}

/* =========================
   Step 5: Finalisation
========================= */

function Step5Finish({
  draft,
  onValidChange,
}: {
  draft: CourseDraft;
  onValidChange: (ok: boolean) => void;
}) {
  useMemo(() => onValidChange(true), [onValidChange]);

  return (
    <div className="mx-auto mt-10 w-full max-w-2xl px-6">
      <h2 className="text-center text-2xl font-semibold text-white">
        Finalisation du cours
      </h2>
      <p className="mt-2 text-center text-sm text-[#9b9b9b]">
        Vérifiez votre résumé avant de publier.
      </p>

      <div className="mt-10 space-y-4 rounded-3xl border border-[#3a3a3a] bg-white/2/40 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs text-[#9b9b9b]">Mode</div>
            <div className="text-sm text-white">
              {draft.mode === "AI_ONLY"
                ? "IA uniquement"
                : draft.mode === "HYBRID"
                ? "Hybride"
                : "Step by Step"}
            </div>
          </div>

          <div>
            <div className="text-xs text-[#9b9b9b]">Visibilité</div>
            <div className="text-sm text-white">
              {draft.visibility === "PRIVATE"
                ? "Privé"
                : draft.visibility === "ROOM"
                ? "Salle"
                : "Public"}
            </div>
          </div>
        </div>

        <div>
          <div className="text-xs text-[#9b9b9b]">Titre</div>
          <div className="text-sm text-white">{draft.title || "—"}</div>
        </div>

        <div>
          <div className="text-xs text-[#9b9b9b]">Description</div>
          <div className="text-sm text-white">
            {draft.description?.trim() ? draft.description : "—"}
          </div>
        </div>

        <div>
          <div className="text-xs text-[#9b9b9b]">Contenu</div>
          <div className="text-sm text-white line-clamp-4">
            {draft.content?.trim() ? draft.content : "—"}
          </div>
        </div>

        <div className="text-xs text-[#9b9b9b]">
          Commentaires : {draft.allowComments ? "Activés" : "Désactivés"}
        </div>
      </div>
    </div>
  );
}

/* =========================
   Main Modal
========================= */

export default function RecordCourseModal({
  backTo = null,
  parentId = null,
}: RecordCourseModalProps) {
  const router = useRouter();
  const close = () => (backTo ? router.replace(backTo) : router.back());

  const [step, setStep] = useState<WizardStep>(1);

  const [draft, setDraft] = useState<CourseDraft>({
    mode: null,
    title: "",
    description: "",
    content: "",
    visibility: "ROOM",
    allowComments: true,
  });

  const [canNext, setCanNext] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const goPrev = () => setStep((s) => (s > 1 ? ((s - 1) as WizardStep) : s));
  const goNext = () => setStep((s) => (s < 5 ? ((s + 1) as WizardStep) : s));

  const jumpTo = (s: WizardStep) => {
    // Option simple : autoriser les jumps seulement vers les étapes déjà passées
    if (s <= step) setStep(s);
  };

  const onPatch = (patch: Partial<CourseDraft>) =>
    setDraft((d) => ({ ...d, ...patch }));

  const handlePrimary = async () => {
    if (step < 5) return goNext();

    // Step 5 : submit final
    setSubmitting(true);
    try {
      /**
       * TODO: brancher ton service:
       * await CourseService.create({ ...draft, entityId })
       */
      console.log("SUBMIT COURSE", { parentId, ...draft });
      close();
    } finally {
      setSubmitting(false);
    }
  };

  const primaryLabel = step < 5 ? "Suivant" : "Créer le cours";

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm">
      <div className="absolute inset-0 flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={close}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#222]"
              aria-label="Fermer"
            >
              <X className="h-4 w-4 text-white" />
            </button>
            <div className="text-sm font-medium text-white">Créer un cours</div>
          </div>

          <Button
            type="button"
            disabled={submitting || !canNext}
            onClick={handlePrimary}
            className="h-10 rounded-full bg-[#6b6b6b]/30 px-6 text-sm font-medium text-white hover:bg-[#6b6b6b]/40 disabled:opacity-60"
          >
            {submitting ? "..." : primaryLabel}
          </Button>
        </div>

        {/* Stepper */}
        <Stepper current={step} onJump={jumpTo} />

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {step === 1 && (
            <Step1Mode
              value={draft.mode}
              onChange={(mode) => onPatch({ mode })}
              onValidChange={setCanNext}
            />
          )}

          {step === 2 && (
            <Step2General
              draft={draft}
              onChange={onPatch}
              onValidChange={setCanNext}
            />
          )}

          {step === 3 && (
            <Step3Content
              draft={draft}
              onChange={onPatch}
              onValidChange={setCanNext}
            />
          )}

          {step === 4 && (
            <Step4Settings
              draft={draft}
              onChange={onPatch}
              onValidChange={setCanNext}
            />
          )}

          {step === 5 && (
            <Step5Finish draft={draft} onValidChange={setCanNext} />
          )}
        </div>

        {/* Bottom actions (optionnel) */}
        <div className="flex items-center justify-between border-t border-white/10 px-6 py-4">
          <Button
            type="button"
            variant="ghost"
            onClick={goPrev}
            disabled={step === 1 || submitting}
            className="rounded-full text-white/80 hover:text-white"
          >
            Précédent
          </Button>

          {/* petite info optionnelle */}
          <div className="text-xs text-[#9b9b9b]">
            Salle: {parentId ? parentId : "—"}
          </div>
        </div>
      </div>
    </div>
  );
}
