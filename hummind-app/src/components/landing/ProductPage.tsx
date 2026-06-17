"use client";

import {
  MessageCircle,
  RefreshCw,
  Wrench,
  CheckCircle2,
} from "lucide-react";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { FAQAccordion, type FAQItem } from "./FAQAccordion";
import { CtaSection } from "./CtaSection";

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "En quoi HummindOS est-il différent d'un simple chatbot ?",
    answer:
      "Hummind est un tuteur cognitif qui suit la progression de chaque apprenant, identifie ses points faibles et adapte sa pédagogie tour après tour.",
  },
  {
    question: "Les enseignants gardent-ils la main sur les contenus ?",
    answer:
      "Oui. Les enseignants créent et structurent les cours, définissent les objectifs et valident la progression.",
  },
  {
    question: "Peut-on importer des cours existants ?",
    answer:
      "Oui. PDF, DOCX, Markdown ou texte brut. Hummind extrait la structure et propose une organisation pédagogique en modules.",
  },
  {
    question: "Est-ce adapté à différents âges et niveaux ?",
    answer:
      "De l'école au supérieur en passant par la formation professionnelle. Hummind ajuste le ton, la difficulté et le rythme.",
  },
  {
    question: "L'IA va-t-elle rendre les élèves paresseux ?",
    answer:
      "Au contraire. Hummind pose des questions, ne donne pas les réponses, exige la reformulation et célèbre l'effort.",
  },
];

const ORG_LEVELS = [
  "Mon organisation",
  "Mes départements",
  "Mes salles de classe",
  "Mes cours",
];

export default function ProductPage() {
  return (
    <main className="min-h-screen bg-white text-hm-ink-900 antialiased">
      <SiteHeader />

      {/* ============================================ */}
      {/* HERO + ORG TREE                              */}
      {/* ============================================ */}
      <section
        className="relative overflow-hidden pt-32 pb-20"
        style={{
          background:
            "linear-gradient(160deg, #edebfa 0%, #f5eef0 50%, #ffe9de 100%)",
        }}
      >
        <div className="mx-auto max-w-[920px] px-6 text-center">
          <h1 className="font-sans text-[clamp(28px,4.5vw,48px)] font-bold leading-[1.1] tracking-[-0.03em]">
            Créez, structurez et déployez
            <br className="hidden sm:block" /> vos formations avec{" "}
            <span className="text-hm-coral-400">intelligence</span>
          </h1>
          <p className="mx-auto mt-5 max-w-[640px] text-[14px] leading-relaxed text-hm-ink-500">
            HummindOS n'est pas qu'un outil de création de cours avec l'IA,
            c'est une plateforme qui structure votre organisation éducative.
          </p>
        </div>

        {/* Org tree — visualization */}
        <div className="mx-auto mt-16 flex max-w-[420px] flex-col items-center gap-3 px-6">
          {ORG_LEVELS.map((label, i) => (
            <div key={label} className="flex flex-col items-center">
              <span className="inline-flex items-center justify-center rounded-full bg-hm-ink-950 px-5 py-2 text-[13px] font-medium text-white">
                {label}
              </span>
              {i < ORG_LEVELS.length - 1 && (
                <div className="my-1 h-6 w-px bg-hm-ink-500/30" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ============================================ */}
      {/* SECTION "Un tuteur qui développe..."         */}
      {/* ============================================ */}
      <section className="bg-hm-ink-950 px-6 py-24 text-white">
        <div className="mx-auto max-w-[920px]">
          <div className="text-center">
            <h2 className="text-[clamp(24px,3.5vw,38px)] font-semibold leading-tight tracking-tight">
              Un <span className="text-hm-purple-400">tuteur</span> qui développe la
              <br className="hidden sm:block" /> capacité de réflexion de vos apprenants
            </h2>
            <p className="mx-auto mt-5 max-w-[680px] text-[14px] leading-relaxed text-white/60">
              L'élève ne dialogue pas avec une machine froide, mais avec un
              tuteur cognitif disponible 24/7. HummindOS offre aux apprenants
              une expérience véritablement enrichie basée sur des programmes
              académiques et professionnels.
            </p>
          </div>

          {/* Tutor chat screenshot placeholder */}
          <div className="mx-auto mt-12 aspect-video w-full max-w-[820px] rounded-2xl bg-white/4 ring-1 ring-white/10" />

          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            <Feature
              icon={<MessageCircle className="h-5 w-5 text-hm-purple-300" />}
              title="Dialogue avec le tuteur IA"
              description="L'IA te suit pas les leçons. Elle guide la réflexion avec des questions et des relances adaptées à chaque élève."
              theme="dark"
            />
            <Feature
              icon={<RefreshCw className="h-5 w-5 text-hm-purple-300" />}
              title="Feedback du tuteur"
              description="En cas d'erreur, Hummind identifie précisément le blocage et propose un exercice ciblé pour renforcer la compréhension."
              theme="dark"
            />
            <Feature
              icon={<Wrench className="h-5 w-5 text-hm-purple-300" />}
              title="Outils intégrés"
              description="Un espace complet pour apprendre : importer ses cours, faire les exercices, suivre l'accompagnement de l'IA."
              theme="dark"
            />
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* SECTION "Suivi en temps réel"                */}
      {/* ============================================ */}
      <section className="bg-hm-mint-200 px-6 py-24">
        <div className="mx-auto max-w-[920px]">
          <div className="text-center">
            <h2 className="text-[clamp(24px,3.5vw,38px)] font-semibold leading-tight tracking-tight text-hm-ink-900">
              Suivi en temps
              <br className="hidden sm:block" /> réel de la maîtrise du cours
            </h2>
            <p className="mx-auto mt-5 max-w-[680px] text-[14px] leading-relaxed text-hm-ink-500">
              Chaque apprenant suit sa compréhension module par module,
              identifie ses points faibles et les renforce jusqu'à atteindre un
              niveau solide.
            </p>
          </div>

          {/* Mastery dashboard placeholder */}
          <div className="mx-auto mt-12 aspect-video w-full max-w-[820px] rounded-2xl bg-white shadow-sm ring-1 ring-black/5" />

          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            <Feature
              icon={<span className="text-[28px] font-bold text-hm-ink-900">80%</span>}
              title="Seuil de maîtrise"
              description="Recommandé à l'apprenant pour mesurer sa compréhension."
              theme="light"
            />
            <Feature
              icon={<RefreshCw className="h-5 w-5 text-hm-ink-900" />}
              title="Reprise"
              description="Proposition de reprise du module pour renforcer la compréhension."
              theme="light"
            />
            <Feature
              icon={<CheckCircle2 className="h-5 w-5 text-hm-ink-900" />}
              title="Récapitulatif"
              description="En fin de cours, un bilan met en lumière les faiblesses de l'apprenant."
              theme="light"
            />
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* SECTION "Retours directs des apprenants"     */}
      {/* ============================================ */}
      <section className="bg-hm-bg-soft px-6 py-24">
        <div className="mx-auto grid max-w-[920px] grid-cols-1 items-center gap-10 md:grid-cols-2">
          <div>
            <h2 className="text-[clamp(22px,3vw,32px)] font-semibold leading-tight tracking-tight text-hm-ink-900">
              Des retours directs des
              <br className="hidden sm:block" /> apprenants
            </h2>
            <p className="mt-5 text-[14px] leading-relaxed text-hm-ink-500">
              Les apprenants peuvent laisser des commentaires sur les cours,
              permettant aux enseignants d'identifier rapidement les
              difficultés et d'ajuster leur pédagogie.
            </p>
          </div>
          {/* Comments screenshot placeholder */}
          <div className="aspect-4/3 w-full rounded-2xl bg-hm-ink-950" />
        </div>
      </section>

      {/* ============================================ */}
      {/* SECTION "Vision claire de la pédagogie"      */}
      {/* ============================================ */}
      <section className="bg-hm-bg-soft px-6 pb-24">
        <div className="mx-auto grid max-w-[920px] grid-cols-1 items-center gap-10 md:grid-cols-2">
          {/* Dashboard table placeholder */}
          <div className="aspect-4/3 w-full rounded-2xl bg-white shadow-sm ring-1 ring-black/5" />
          <div>
            <h2 className="text-[clamp(22px,3vw,32px)] font-semibold leading-tight tracking-tight text-hm-ink-900">
              Une vision claire
              <br className="hidden sm:block" /> de votre pédagogie en action
            </h2>
            <p className="mt-5 text-[14px] leading-relaxed text-hm-ink-500">
              Accédez à un tableau de bord complet pour suivre votre
              organisation et visualiser le niveau de vos apprenants à chaque
              étape du parcours.
            </p>
          </div>
        </div>
      </section>

      <CtaSection title="Prêt à construire la meilleure expérience d'apprentissage assistée par l'IA ?" />

      {/* FAQ */}
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

      <SiteFooter />
    </main>
  );
}

function Feature({
  icon,
  title,
  description,
  theme,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  theme: "dark" | "light";
}) {
  const titleColor = theme === "dark" ? "text-white" : "text-hm-ink-900";
  const bodyColor = theme === "dark" ? "text-white/60" : "text-hm-ink-500";
  return (
    <div>
      <div className="mb-3">{icon}</div>
      <h3 className={`text-[15px] font-semibold ${titleColor}`}>{title}</h3>
      <p className={`mt-1.5 text-[13px] leading-relaxed ${bodyColor}`}>
        {description}
      </p>
    </div>
  );
}
