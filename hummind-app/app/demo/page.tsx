import Link from 'next/link';
import type { Route } from 'next';
import type { ComponentType } from 'react';
import { ArrowRight, CalendarDays, Mail, Phone } from 'lucide-react';
import { MarketingShell } from '@/features/marketing/components/marketing-shell';

export default function DemoPage() {
  return (
    <MarketingShell>
      <section className="py-10">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-600">
            Réserver une démo
          </p>
          <h1 className="mt-4 text-balance font-display text-5xl font-semibold tracking-[-0.045em] text-[#17172A] sm:text-6xl">
            Un échange pour voir si Hummind correspond à votre contexte.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-black/45">
            Nous pouvons vous montrer le parcours enseignant, l&apos;expérience apprenant et la
            logique de suivi en quelques minutes.
          </p>
        </div>
      </section>

      <section className="grid gap-6 py-8 md:grid-cols-3">
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
      </section>

      <section className="rounded-[40px] bg-[#151526] px-6 py-16 text-center text-white sm:px-10 lg:px-16">
        <h2 className="font-display text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
          Prêt à réserver ?
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/60">
          Connectez-vous avec un compte de test pour explorer l&apos;outil, ou revenez ici quand
          vous voulez planifier une démo.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href={'/login' as Route}
            className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#17172A] transition hover:bg-white/90"
          >
            Se connecter
          </Link>
          <Link
            href={'/contact' as Route}
            className="inline-flex items-center gap-2 rounded-full bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
          >
            Nous contacter
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}

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
    <article className="rounded-[28px] border border-black/8 bg-white p-6 shadow-[0_20px_50px_rgba(17,17,20,0.08)]">
      <Icon className="h-10 w-10 text-brand-700" />
      <h2 className="mt-8 text-2xl font-semibold text-[#17172A]">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-black/55">{text}</p>
    </article>
  );
}
