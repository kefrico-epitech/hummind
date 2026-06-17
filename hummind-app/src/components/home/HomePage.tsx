"use client";

import Link from "next/link";
import {
  BrainCircuit,
  FileText,
  Gauge,
} from "lucide-react";
import { SiteHeader } from "../landing/SiteHeader";
import { SiteFooter } from "../landing/SiteFooter";
import { FAQAccordion, type FAQItem } from "../landing/FAQAccordion";
import { FeatureCard } from "../landing/FeatureCard";
import { CtaSection } from "../landing/CtaSection";

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "En quoi HummindOS est-il différent d'un simple chatbot ?",
    answer:
      "Hummind est un tuteur cognitif qui suit la progression de chaque apprenant, identifie ses points faibles et adapte sa pédagogie tour après tour. Un chatbot répond ; Hummind enseigne, vérifie la compréhension et fait progresser.",
  },
  {
    question: "Les enseignants gardent-ils la main sur les contenus ?",
    answer:
      "Oui. Les enseignants créent et structurent les cours, définissent les objectifs et valident la progression. Hummind n'invente jamais le contenu — il s'appuie sur la matière fournie.",
  },
  {
    question: "Peut-on importer des cours existants ?",
    answer:
      "Oui. PDF, DOCX, Markdown ou texte brut. Hummind extrait la structure, propose une organisation pédagogique en modules et reste fidèle à votre matière.",
  },
  {
    question: "Est-ce adapté à différents âges et niveaux ?",
    answer:
      "De l'école au supérieur en passant par la formation professionnelle. Hummind ajuste le ton, la difficulté et le rythme au profil de chaque apprenant.",
  },
  {
    question: "L'IA va-t-elle rendre les élèves paresseux ?",
    answer:
      "Au contraire. Hummind pose des questions, ne donne pas les réponses, exige la reformulation et célèbre l'effort. C'est un compagnon qui pousse à réfléchir, pas un raccourci.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-hm-ink-900 antialiased">
      <SiteHeader />

      {/* ============================================ */}
      {/* HERO                                          */}
      {/* ============================================ */}
      <section className="relative overflow-hidden pt-32 pb-32">
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background:
              "linear-gradient(160deg, #edebfa 0%, #f5eef0 40%, #ffe9de 100%)",
          }}
        />
        <div className="mx-auto max-w-[920px] px-6 text-center">
          <h1 className="font-sans text-[clamp(32px,5vw,56px)] font-bold leading-[1.08] tracking-[-0.03em] text-hm-ink-900">
            Transformer vos{" "}
            <span className="text-hm-coral-400">cours</span> en une{" "}
            <span className="text-hm-purple-500">
              expérience d'apprentissage
            </span>{" "}
            guidée interactive et mesurable.
          </h1>

          <div className="mt-10 flex flex-col items-center gap-3">
            <Link
              href="/demo"
              className="inline-flex items-center justify-center rounded-full bg-hm-peach-100 px-8 py-3.5 text-[14px] font-semibold text-hm-ink-900 transition-colors hover:bg-hm-peach-100/80"
            >
              Réserver une démo
            </Link>
            <p className="text-[12px] text-hm-ink-500">
              Utilisé par enseignants, écoles et formations professionnelles
            </p>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* SECTION "Enseigner aujourd'hui..."           */}
      {/* ============================================ */}
      <section className="bg-hm-ink-950 px-6 py-24 text-white">
        <div className="mx-auto max-w-[820px] text-center">
          <h2 className="text-[clamp(24px,3.5vw,38px)] font-semibold leading-[1.2] tracking-tight">
            Enseigner aujourd'hui n'a jamais
            <br className="hidden sm:block" /> été aussi exigeant.
          </h2>
          <p className="mx-auto mt-6 max-w-[640px] text-[14px] leading-relaxed text-white/60">
            Les classes aux profils variés d'apprenants et des programmes
            souvent trop chargés rendent l'apprentissage complexe.
            <br className="hidden sm:block" />
            Si l'IA transforme aujourd'hui les choses, elle le fait
            malheureusement souvent dans un sens qui ne répond pas entièrement
            aux besoins réels du système éducatif.
          </p>
        </div>

        {/* Placeholder for the illustration (avatar) */}
        <div className="mx-auto mt-16 flex h-48 w-48 items-center justify-center rounded-full bg-hm-purple-500/20">
          <div className="h-32 w-32 rounded-full bg-hm-purple-500/40" />
        </div>
      </section>

      {/* ============================================ */}
      {/* SECTION "Un apprentissage orchestré"         */}
      {/* ============================================ */}
      <section className="bg-hm-purple-100 px-6 py-24">
        <div className="mx-auto max-w-[920px] text-center">
          <h2 className="text-[clamp(24px,3.5vw,38px)] font-semibold leading-[1.2] tracking-tight text-hm-ink-900">
            Un apprentissage orchestré, de
            <br className="hidden sm:block" /> l'objectif à la maîtrise.
          </h2>
          <p className="mx-auto mt-6 max-w-[680px] text-[14px] leading-relaxed text-hm-ink-500">
            HummindOS structure, accompagne et mesure l'apprentissage du
            premier objectif jusqu'à la maîtrise réelle. Nous ne vous offrons
            pas un gadget, mais un véritable outil qui englobe toutes les
            étapes de la pédagogie.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-[920px] grid-cols-1 gap-5 md:grid-cols-3">
          <FeatureCard
            variant="purple"
            icon={<FileText className="h-7 w-7 text-hm-purple-500" />}
            title="Des cours structurés en quelques minutes"
            description="Définissez vos objectifs et créez des modules clairs."
            href="/product"
          />
          <FeatureCard
            variant="dark"
            icon={<BrainCircuit className="h-7 w-7 text-hm-purple-300" />}
            title="Un tuteur IA qui fait réfléchir"
            description="Il pose des questions, corrige en douceur chaque élève."
            href="/product"
          />
          <FeatureCard
            variant="mint"
            icon={<Gauge className="h-7 w-7 text-emerald-700" />}
            title="Un suivi de maîtrise réelle"
            description="Visualiser le niveau atteint sur chaque compétence."
            href="/product"
          />
        </div>
      </section>

      <CtaSection title="Prêt à construire la meilleure expérience d'apprentissage assistée par l'IA ?" />

      {/* ============================================ */}
      {/* SECTION FAQ                                  */}
      {/* ============================================ */}
      <section id="faq" className="bg-hm-ink-950 px-6 py-24 text-white">
        <div className="mx-auto max-w-[820px]">
          <div className="text-center">
            <h2 className="text-[clamp(24px,3.5vw,38px)] font-semibold leading-tight tracking-tight">
              FAQ
            </h2>
            <p className="mt-3 text-[13px] text-white/60">
              Vous aviez des questions ?
            </p>
          </div>
          <div className="mt-10">
            <FAQAccordion items={FAQ_ITEMS} />
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <CtaSection
        title="Parlons de votre projet pédagogique"
        variant="white"
      />

      <SiteFooter />
    </main>
  );
}
