"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, HelpCircle } from "lucide-react";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { SuccessModal } from "./SuccessModal";
import {
  ContactService,
  type LearnerVolume,
  type OrganizationType,
  type ProjectHorizon,
} from "../../services/contact.service";
import { toast } from "../../lib/notify";

const ROLES = [
  "Enseignant",
  "Directeur d'établissement",
  "Responsable de formation",
  "Responsable pédagogique",
  "Responsable RH / L&D",
  "Élève / apprenant",
  "Autre",
];

const ORGANIZATION_TYPES: Array<{ value: OrganizationType; label: string }> = [
  { value: "SCHOOL_PRIMARY", label: "École primaire" },
  { value: "SCHOOL_SECONDARY", label: "Collège / Lycée" },
  { value: "UNIVERSITY", label: "Université / Enseignement supérieur" },
  { value: "VOCATIONAL_CENTER", label: "Centre de formation professionnelle" },
  { value: "TRAINING_ORG", label: "Organisme de formation" },
  { value: "CORPORATE", label: "Entreprise (formation interne)" },
  { value: "INDEPENDENT", label: "Enseignant / formateur indépendant" },
  { value: "OTHER", label: "Autre" },
];

const LEARNER_VOLUMES: Array<{ value: LearnerVolume; label: string }> = [
  { value: "UNDER_50", label: "Moins de 50" },
  { value: "BETWEEN_50_200", label: "50 à 200" },
  { value: "BETWEEN_200_1000", label: "200 à 1 000" },
  { value: "OVER_1000", label: "Plus de 1 000" },
];

const HORIZONS: Array<{ value: ProjectHorizon; label: string }> = [
  { value: "IMMEDIATE", label: "Immédiatement" },
  { value: "WITHIN_1_MONTH", label: "Sous 1 mois" },
  { value: "WITHIN_3_MONTHS", label: "Sous 3 mois" },
  { value: "EXPLORING", label: "Pas encore décidé / en exploration" },
];

export default function DemoPage() {
  // Contact
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");

  // Organisation
  const [organizationName, setOrganizationName] = useState("");
  const [organizationType, setOrganizationType] = useState<OrganizationType | "">("");
  const [learnerVolume, setLearnerVolume] = useState<LearnerVolume | "">("");
  const [website, setWebsite] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");

  // Projet
  const [message, setMessage] = useState("");
  const [horizon, setHorizon] = useState<ProjectHorizon | "">("");

  // UI
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const canSubmit =
    name.trim().length > 1 && /.+@.+\..+/.test(email) && message.trim().length > 5;

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setRole("");
    setOrganizationName("");
    setOrganizationType("");
    setLearnerVolume("");
    setWebsite("");
    setCountry("");
    setCity("");
    setMessage("");
    setHorizon("");
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const res = await ContactService.send({
        kind: "demo",
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        role: role || null,
        organizationName: organizationName.trim() || null,
        organizationType: organizationType || null,
        learnerVolume: learnerVolume || null,
        website: website.trim() || null,
        country: country.trim() || null,
        city: city.trim() || null,
        message: message.trim(),
        horizon: horizon || null,
        source: typeof window !== "undefined" ? window.location.pathname : "/demo",
      });
      if (res.error) throw new Error(res.error);
      setShowSuccess(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur d'envoi");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-white text-hm-ink-900 antialiased">
      <SiteHeader />

      <section
        className="relative overflow-hidden pt-32 pb-20"
        style={{
          background:
            "linear-gradient(160deg, #edebfa 0%, #f5eef0 50%, #ffe9de 100%)",
        }}
      >
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-12 px-6 md:grid-cols-2 md:gap-16">
          {/* LEFT */}
          <div>
            <h1 className="font-sans text-[clamp(32px,5vw,56px)] font-bold leading-[1.05] tracking-[-0.03em] text-hm-ink-900">
              Parlons de votre projet{" "}
              <span className="text-hm-purple-500">pédagogique</span>
            </h1>
            <p className="mt-6 max-w-[420px] text-[14px] leading-relaxed text-hm-ink-500">
              Que vous représentiez une école, une université, un centre de
              formation ou une entreprise, notre équipe vous répond sous 24h.
            </p>

            <ul className="mt-10 flex flex-col gap-4 text-[14px] text-hm-ink-900">
              {[
                "Demander une démonstration de HummindOS",
                "Trouvez le meilleur forfait pour votre équipe",
                "Obtenez de l'aide pour votre intégration",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-hm-purple-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <p className="mt-10 text-[13px] text-hm-ink-500">
              Des problèmes techniques ou des questions sur le produit ?
            </p>
            <Link
              href="mailto:support@hummind.os"
              className="mt-1 inline-flex items-center gap-1 text-[13px] font-semibold text-hm-purple-500 hover:text-hm-purple-400"
            >
              Contactez l'assistance <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* RIGHT — FORM */}
          <form
            onSubmit={onSubmit}
            className="flex flex-col gap-8 rounded-2xl bg-white/60 p-6 ring-1 ring-black/5 md:bg-white md:p-8 md:shadow-sm"
          >
            {/* Section 1 — Vous */}
            <FormSection
              step={1}
              title="Vous"
              description="Comment vous joindre."
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Nom et prénom" required>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label="Courriel professionnel" required>
                  <input
                    type="email"
                    placeholder="vous@organisation.fr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label="Téléphone (optionnel)">
                  <input
                    type="tel"
                    placeholder="+33 6 12 34 56 78"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label="Votre rôle">
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className={inputCls}
                  >
                    <option value="">Sélectionner votre rôle</option>
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </FormSection>

            {/* Section 2 — Organisation */}
            <FormSection
              step={2}
              title="Votre organisation"
              description="Quelques détails pour préparer la démo."
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Nom de l'organisation" className="md:col-span-2">
                  <input
                    type="text"
                    placeholder="Ex: Lycée Voltaire, Centre PRO Lyon, Acme Corp..."
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label="Type d'organisation">
                  <select
                    value={organizationType}
                    onChange={(e) =>
                      setOrganizationType(e.target.value as OrganizationType | "")
                    }
                    className={inputCls}
                  >
                    <option value="">Sélectionner...</option>
                    {ORGANIZATION_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Nombre d'apprenants">
                  <select
                    value={learnerVolume}
                    onChange={(e) =>
                      setLearnerVolume(e.target.value as LearnerVolume | "")
                    }
                    className={inputCls}
                  >
                    <option value="">Estimation...</option>
                    {LEARNER_VOLUMES.map((v) => (
                      <option key={v.value} value={v.value}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Pays">
                  <input
                    type="text"
                    placeholder="France"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label="Ville (optionnel)">
                  <input
                    type="text"
                    placeholder="Paris"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label="Site web (optionnel)" className="md:col-span-2">
                  <input
                    type="url"
                    placeholder="https://votre-site.fr"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className={inputCls}
                  />
                </Field>
              </div>
            </FormSection>

            {/* Section 3 — Projet */}
            <FormSection
              step={3}
              title="Votre projet"
              description="On adapte la démo à vos besoins."
            >
              <div className="flex flex-col gap-4">
                <Field label="Quand souhaitez-vous démarrer ?">
                  <select
                    value={horizon}
                    onChange={(e) =>
                      setHorizon(e.target.value as ProjectHorizon | "")
                    }
                    className={inputCls}
                  >
                    <option value="">Sélectionner...</option>
                    {HORIZONS.map((h) => (
                      <option key={h.value} value={h.value}>
                        {h.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Votre message" required>
                  <textarea
                    rows={5}
                    placeholder="Parlez-nous de votre contexte, vos besoins, vos objectifs pédagogiques..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className={`${inputCls} resize-none`}
                  />
                </Field>
              </div>
            </FormSection>

            <button
              type="submit"
              disabled={!canSubmit || submitting}
              className="mt-2 inline-flex items-center justify-center rounded-full bg-hm-purple-400 px-7 py-3.5 text-[14px] font-semibold text-white transition-colors hover:bg-hm-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Envoi en cours..." : "Envoyer ma demande"}
            </button>
          </form>
        </div>

        {/* Help floating button */}
        <button
          type="button"
          aria-label="Aide"
          className="fixed bottom-6 right-6 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full bg-hm-ink-950 text-white shadow-lg transition-transform hover:scale-105"
        >
          <HelpCircle className="h-5 w-5" />
        </button>
      </section>

      <SiteFooter />

      <SuccessModal
        open={showSuccess}
        onClose={() => {
          setShowSuccess(false);
          resetForm();
        }}
        contactName={name}
        contactEmail={email}
      />
    </main>
  );
}

const inputCls =
  "w-full rounded-xl bg-white px-4 py-3 text-[14px] text-hm-ink-900 ring-1 ring-black/5 outline-none transition-shadow placeholder:text-hm-ink-400 focus:ring-2 focus:ring-hm-purple-300";

function FormSection({
  step,
  title,
  description,
  children,
}: {
  step: number;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-hm-purple-500 text-[12px] font-bold text-white">
          {step}
        </span>
        <div>
          <h3 className="text-[14px] font-semibold text-hm-ink-900">{title}</h3>
          <p className="text-[12px] text-hm-ink-500">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  required,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-2 ${className ?? ""}`}>
      <span className="text-[13px] font-semibold text-hm-ink-900">
        {label}
        {required ? <span className="ml-0.5 text-hm-coral-400">*</span> : null}
      </span>
      {children}
    </label>
  );
}
