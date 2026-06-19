import Link from 'next/link';
import type { Route } from 'next';
import { ArrowRight, Brain, FileText, Sparkles } from 'lucide-react';
import { Header } from '@/components/Header';
import { PageLayout } from '@/components/PageLayout';
import { Footer } from '@/components/Footer';
import { cn } from '@/shared/lib/cn';

export default function ProduitPage() {
  return (
    <main className="min-h-screen bg-[#f5f1ef] text-[#141426]">
      <div className="sticky top-0 z-50 flex justify-center px-4 py-4 sm:px-6 lg:px-10">
        <Header />
      </div>

      <PageLayout
        title="Une plateforme pensée pour construire, guider et mesurer l'apprentissage."
        subtitle="HummindOS combine authoring pédagogique, tutorat IA et suivi de maîtrise dans une expérience unifiée conçue pour les équipes enseignantes."
      >
        <div className="flex flex-wrap justify-center gap-3 xs:gap-3 sm:gap-4">
          <Link
            href={'/demo' as Route}
            className="inline-flex items-center gap-2 rounded-full bg-[#19192A] px-4 xs:px-5 sm:px-6 py-2 xs:py-2.5 sm:py-3 text-xs xs:text-sm font-semibold text-white transition hover:bg-black focus:outline-none focus:ring-2 focus:ring-[#6d72d8] min-h-[44px]"
          >
            Réserver une démo
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href={'/login' as Route}
            className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-4 xs:px-5 sm:px-6 py-2 xs:py-2.5 sm:py-3 text-xs xs:text-sm font-semibold text-black/70 transition hover:border-black/20 hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#6d72d8] min-h-[44px]"
          >
            Se connecter
          </Link>
        </div>
      </PageLayout>

      <section className="px-4 py-8 xs:py-10 sm:py-12 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-[1120px]">
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-4 xs:gap-5 sm:gap-6">
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
                desc: "Le tuteur IA pose des questions, corrige et s'adapte aux élèves.",
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
                className={cn(
                  'rounded-[20px] xs:rounded-[24px] sm:rounded-[28px] p-4 xs:p-5 sm:p-6 shadow-[0_20px_50px_rgba(17,17,20,0.08)]',
                  item.tone
                )}
              >
                <item.icon className="h-8 xs:h-9 sm:h-10 w-8 xs:w-9 sm:w-10" />
                <h2 className="mt-6 xs:mt-7 sm:mt-8 text-lg xs:text-xl sm:text-2xl font-semibold">{item.title}</h2>
                <p className="mt-2 xs:mt-2.5 sm:mt-3 text-xs xs:text-sm leading-5 xs:leading-6 opacity-75">{item.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-8 xs:py-10 sm:py-12 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-[1120px] rounded-[28px] xs:rounded-[32px] sm:rounded-[40px] bg-[#151526] px-4 xs:px-6 sm:px-10 lg:px-16 py-12 xs:py-14 sm:py-16 text-white">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-display text-2xl xs:text-3xl sm:text-4xl font-semibold tracking-[-0.03em]">
              Un flux simple pour l'enseignant.
            </h2>
            <div className="mt-8 xs:mt-9 sm:mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3 xs:gap-4">
              {[
                'Décrire le contexte du cours',
                'Générer ou structurer les modules',
                'Publier quand le contenu est prêt',
              ].map((step, index) => (
                <div
                  key={step}
                  className="rounded-[16px] xs:rounded-[20px] sm:rounded-[24px] border border-white/10 bg-white/5 p-4 xs:p-5 text-left"
                >
                  <span className="inline-flex h-8 xs:h-9 w-8 xs:w-9 items-center justify-center rounded-full bg-white/10 text-xs xs:text-sm font-semibold">
                    0{index + 1}
                  </span>
                  <p className="mt-3 xs:mt-4 text-xs xs:text-sm leading-5 xs:leading-6 text-white/70">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
