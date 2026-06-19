import Link from 'next/link';
import type { Route } from 'next';
import { ArrowRight, Brain, FileText, Sparkles } from 'lucide-react';
import { MarketingShell } from '@/features/marketing/components/marketing-shell';
import { cn } from '@/shared/lib/cn';

export default function ProduitPage() {
  return (
    <MarketingShell>
      <section className="py-10">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-600">
            Notre produit
          </p>
          <h1 className="mt-4 text-balance font-display text-5xl font-semibold tracking-[-0.045em] text-[#17172A] sm:text-6xl">
            Une plateforme pensée pour construire, guider et mesurer l&apos;apprentissage.
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-base leading-7 text-black/45 sm:text-lg">
            HummindOS combine authoring pédagogique, tutorat IA et suivi de maîtrise dans une
            expérience unifiée conçue pour les équipes enseignantes.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href={'/demo' as Route}
              className="inline-flex items-center gap-2 rounded-full bg-[#19192A] px-6 py-3 text-sm font-semibold text-white transition hover:bg-black"
            >
              Réserver une démo
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={'/login' as Route}
              className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-6 py-3 text-sm font-semibold text-black/70 transition hover:border-black/20 hover:bg-white"
            >
              Se connecter
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-6 py-10 md:grid-cols-3">
        {[
          {
            icon: FileText,
            title: 'Authoring guidé',
            desc: 'Créez des cours structurés sans perdre la main sur la pédagogie.',
            tone: 'bg-[#A9A6E8]',
          },
          {
            icon: Brain,
            title: 'IA accompagnante',
            desc: 'Le tuteur IA pose des questions, corrige et s’adapte aux élèves.',
            tone: 'bg-[#161629] text-white',
          },
          {
            icon: Sparkles,
            title: 'Mesure de maîtrise',
            desc: 'Suivez la progression, les badges et les compétences acquises.',
            tone: 'bg-[#C8EBDD]',
          },
        ].map((item) => (
          <article
            key={item.title}
            className={cn('rounded-[28px] p-6 shadow-[0_20px_50px_rgba(17,17,20,0.08)]', item.tone)}
          >
            <item.icon className="h-10 w-10" />
            <h2 className="mt-8 text-2xl font-semibold">{item.title}</h2>
            <p className="mt-3 text-sm leading-6 opacity-75">{item.desc}</p>
          </article>
        ))}
      </section>

      <section className="rounded-[40px] bg-[#151526] px-6 py-16 text-white sm:px-10 lg:px-16">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-display text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
            Un flux simple pour l&apos;enseignant.
          </h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              'Décrire le contexte du cours',
              'Générer ou structurer les modules',
              'Publier quand le contenu est prêt',
            ].map((step, index) => (
              <div
                key={step}
                className="rounded-[24px] border border-white/10 bg-white/5 p-5 text-left"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-sm font-semibold">
                  0{index + 1}
                </span>
                <p className="mt-4 text-sm leading-6 text-white/70">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
