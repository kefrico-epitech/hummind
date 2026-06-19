import Link from 'next/link';
import type { Route } from 'next';
import type { ComponentType } from 'react';
import { ArrowRight, CalendarDays, Mail, Phone } from 'lucide-react';
import { Header } from '@/components/Header';
import { PageLayout } from '@/components/PageLayout';
import { Footer } from '@/components/Footer';

function Info({
  icon: Icon,
  title,
  text,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  text: string;
}) {
  return (
    <article className="rounded-[20px] xs:rounded-[24px] sm:rounded-[28px] border border-black/8 bg-white p-4 xs:p-5 sm:p-6 shadow-[0_20px_50px_rgba(17,17,20,0.08)]">
      <Icon className="h-8 xs:h-9 sm:h-10 w-8 xs:w-9 sm:w-10 text-brand-700" />
      <h2 className="mt-6 xs:mt-7 sm:mt-8 text-lg xs:text-xl sm:text-2xl font-semibold text-[#17172A]">{title}</h2>
      <p className="mt-2 xs:mt-2.5 sm:mt-3 text-xs xs:text-sm leading-5 xs:leading-6 text-black/55">{text}</p>
    </article>
  );
}

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-[#f5f1ef] text-[#141426]">
      <div className="sticky top-0 z-50 flex justify-center px-4 py-4 sm:px-6 lg:px-10">
        <Header />
      </div>

      <PageLayout
        title="Un échange pour voir si Hummind correspond à votre contexte."
        subtitle="Nous pouvons vous montrer le parcours enseignant, l'expérience apprenant et la logique de suivi en quelques minutes."
      >
        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-4 xs:gap-5 sm:gap-6">
          <Info
            icon={CalendarDays}
            title="Un créneau de 30 min"
            text="On fait le tour de votre besoin, sans jargon inutile."
          />
          <Info
            icon={Mail}
            title="Un contact simple"
            text="Vous pouvez aussi nous écrire si vous préférez préparer la démo."
          />
          <Info
            icon={Phone}
            title="Un échange humain"
            text="On reste très concrets: objectifs, contenu, adoption, déploiement."
          />
        </div>
      </PageLayout>

      <section className="px-4 py-8 xs:py-10 sm:py-12 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-[1120px] rounded-[28px] xs:rounded-[32px] sm:rounded-[40px] bg-[#151526] px-4 xs:px-6 sm:px-10 lg:px-16 py-12 xs:py-14 sm:py-16 text-center text-white">
          <h2 className="font-display text-2xl xs:text-3xl sm:text-4xl font-semibold tracking-[-0.03em]">
            Prêt à réserver ?
          </h2>
          <p className="mx-auto mt-4 xs:mt-5 sm:mt-6 max-w-2xl text-xs xs:text-sm leading-6 xs:leading-7 text-white/60">
            Connectez-vous avec un compte de test pour explorer l'outil, ou revenez ici quand vous voulez planifier une démo.
          </p>
          <div className="mt-6 xs:mt-7 sm:mt-8 flex flex-wrap justify-center gap-3 xs:gap-4">
            <Link
              href={'/login' as Route}
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 xs:px-5 sm:px-6 py-2 xs:py-2.5 sm:py-3 text-xs xs:text-sm font-semibold text-[#17172A] transition hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-[#6d72d8] min-h-[44px]"
            >
              Se connecter
            </Link>
            <Link
              href={'/contact' as Route}
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 xs:px-5 sm:px-6 py-2 xs:py-2.5 sm:py-3 text-xs xs:text-sm font-semibold text-white transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-[#6d72d8] min-h-[44px]"
            >
              Nous contacter
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
