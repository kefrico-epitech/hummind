import { MarketingShell } from '@/features/marketing/components/marketing-shell';

export default function ConfidentialitePage() {
  return (
    <MarketingShell>
      <section className="mx-auto max-w-4xl py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-600">
          Confidentialité
        </p>
        <h1 className="mt-4 font-display text-5xl font-semibold tracking-[-0.045em] text-[#17172A]">
          Données et confidentialité.
        </h1>
        <div className="mt-8 space-y-5 text-sm leading-7 text-black/55">
          <p>Les cookies de session servent à l&apos;authentification et sont utilisés pour les pages protégées.</p>
          <p>Les données pédagogiques servent à structurer les cours et à accompagner l&apos;apprenant.</p>
          <p>En production, les politiques de conservation et de consentement devront être précisées selon le déploiement.</p>
        </div>
      </section>
    </MarketingShell>
  );
}
