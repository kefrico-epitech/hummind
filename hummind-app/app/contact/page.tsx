import Link from 'next/link';
import type { Route } from 'next';
import type { ComponentType } from 'react';
import { ArrowRight, Mail, MapPin, Phone } from 'lucide-react';
import { MarketingShell } from '@/features/marketing/components/marketing-shell';

export default function ContactPage() {
  return (
    <MarketingShell>
      <section className="py-10">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-600">
            Nous contacter
          </p>
          <h1 className="mt-4 text-balance font-display text-5xl font-semibold tracking-[-0.045em] text-[#17172A] sm:text-6xl">
            Parlons de votre projet pédagogique.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-black/45">
            Pour une école, une formation ou une organisation, on peut cadrer ensemble le besoin
            et le bon point de départ.
          </p>
        </div>
      </section>

      <section className="grid gap-6 py-8 md:grid-cols-3">
        <ContactCard icon={Mail} title="Email" text="bonjour@hummind.com" />
        <ContactCard icon={Phone} title="Téléphone" text="+33 1 23 45 67 89" />
        <ContactCard icon={MapPin} title="Présence" text="Remote / Paris" />
      </section>

      <section className="rounded-[40px] bg-[#F4F4F8] px-6 py-16 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl font-semibold tracking-[-0.03em] text-[#17172A]">
            Une première prise de contact simple.
          </h2>
          <p className="mt-4 text-sm leading-7 text-black/50">
            Vous pouvez aussi vous connecter sur la version de test pour voir le produit en
            direct.
          </p>
          <Link
            href={'/demo' as Route}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#19192A] px-6 py-3 text-sm font-semibold text-white transition hover:bg-black"
          >
            Réserver une démo
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}

function ContactCard({
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
