import { Header } from '@/components/Header';
import { PageLayout } from '@/components/PageLayout';
import { Footer } from '@/components/Footer';
import { SectionTitle } from '@/components/Typography';

export default function ConfidentialitePage() {
  return (
    <main className="min-h-screen bg-[#f5f1ef] text-[#141426]">
      <div className="sticky top-0 z-50 flex justify-center px-4 py-4 sm:px-6 lg:px-10">
        <Header />
      </div>

      <section className="px-4 py-8 xs:py-10 sm:py-12 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-[950px]">
          <div className="text-center mb-8 xs:mb-10 sm:mb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-600">Confidentialité</p>
            <SectionTitle className="mt-4">
              Données et confidentialité.
            </SectionTitle>
          </div>
          <div className="space-y-4 xs:space-y-5 sm:space-y-6 text-xs xs:text-sm leading-6 xs:leading-7 text-black/55">
            <p>Les cookies de session servent à l'authentification et sont utilisés pour les pages protégées.</p>
            <p>Les données pédagogiques servent à structurer les cours et à accompagner l'apprenant.</p>
            <p>En production, les politiques de conservation et de consentement devront être précisées selon le déploiement.</p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
