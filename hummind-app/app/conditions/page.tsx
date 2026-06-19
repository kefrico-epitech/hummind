import { MarketingShell } from '@/features/marketing/components/marketing-shell';

export default function ConditionsPage() {
  return (
    <MarketingShell>
      <section className="mx-auto max-w-4xl py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-600">
          Conditions
        </p>
        <h1 className="mt-4 font-display text-5xl font-semibold tracking-[-0.045em] text-[#17172A]">
          Conditions d&apos;utilisation.
        </h1>
        <div className="mt-8 space-y-5 text-sm leading-7 text-black/55">
          <p>Hummind est en reconstruction v1. Les contenus, parcours et fonctionnalités peuvent évoluer.</p>
          <p>Les comptes de test sont fournis pour la validation produit uniquement.</p>
          <p>L&apos;utilisation de l&apos;outil doit rester conforme aux règles de votre établissement et de votre organisation.</p>
        </div>
      </section>
    </MarketingShell>
  );
}
