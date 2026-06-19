import Link from 'next/link';
import type { Route } from 'next';
import type { ComponentType } from 'react';
import { ArrowRight, Mail, MapPin, Phone } from 'lucide-react';
import { Header } from '@/components/Header';
import { PageLayout } from '@/components/PageLayout';
import { Footer } from '@/components/Footer';

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
    <article className="rounded-[20px] xs:rounded-[24px] sm:rounded-[28px] border border-black/8 bg-white p-4 xs:p-5 sm:p-6 shadow-[0_20px_50px_rgba(17,17,20,0.08)]">
      <Icon className="h-8 xs:h-9 sm:h-10 w-8 xs:w-9 sm:w-10 text-brand-700" />
      <h2 className="mt-6 xs:mt-7 sm:mt-8 text-lg xs:text-xl sm:text-2xl font-semibold text-[#17172A]">{title}</h2>
      <p className="mt-2 xs:mt-2.5 sm:mt-3 text-xs xs:text-sm leading-5 xs:leading-6 text-black/55">{text}</p>
    </article>
  );
}

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#f5f1ef] text-[#141426]">
      <div className="sticky top-0 z-50 flex justify-center px-4 py-4 sm:px-6 lg:px-10">
        <Header />
      </div>

      <PageLayout
        title="Parlons de votre projet pédagogique."
        subtitle="Pour une école, une formation ou une organisation, on peut cadrer ensemble le besoin et le bon point de départ."
      >
        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-4 xs:gap-5 sm:gap-6">
          <ContactCard icon={Mail} title="Email" text="bonjour@hummind.com" />
          <ContactCard icon={Phone} title="Téléphone" text="+33 1 23 45 67 89" />
          <ContactCard icon={MapPin} title="Présence" text="Remote / Paris" />
        </div>
      </PageLayout>

      <section className="px-4 py-8 xs:py-10 sm:py-12 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-[1120px] rounded-[28px] xs:rounded-[32px] sm:rounded-[40px] bg-[#F4F4F8] px-4 xs:px-6 sm:px-10 lg:px-16 py-12 xs:py-14 sm:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-display text-2xl xs:text-3xl sm:text-4xl font-semibold tracking-[-0.03em] text-[#17172A]">
              Une première prise de contact simple.
            </h2>
            <p className="mt-4 xs:mt-5 sm:mt-6 text-xs xs:text-sm leading-6 xs:leading-7 text-black/50">
              Vous pouvez aussi vous connecter sur la version de test pour voir le produit en direct.
            </p>
            <Link
              href={'/demo' as Route}
              className="mt-6 xs:mt-7 sm:mt-8 inline-flex items-center gap-2 rounded-full bg-[#19192A] px-4 xs:px-5 sm:px-6 py-2 xs:py-2.5 sm:py-3 text-xs xs:text-sm font-semibold text-white transition hover:bg-black focus:outline-none focus:ring-2 focus:ring-[#6d72d8] min-h-[44px]"
            >
              Réserver une démo
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
