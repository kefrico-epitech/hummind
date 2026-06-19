import { Header } from '@/components/Header';
import { PageLayout } from '@/components/PageLayout';
import { Footer } from '@/components/Footer';

const ITEMS = [
  {
    q: 'En quoi HummindOS est-il différent d'un simple chatbot ?',
    a: 'Hummind structure les cours, suit la progression et s'appuie sur un vrai modèle pédagogique, pas seulement sur une conversation.',
  },
  {
    q: 'Les enseignants gardent-ils la main sur les contenus ?',
    a: 'Oui. L'IA assiste la création, mais l'enseignant reste responsable du cours et peut tout ajuster avant publication.',
  },
  {
    q: 'Peut-on importer des cours existants ?',
    a: 'Oui, la plateforme est pensée pour intégrer des documents et les convertir en contenus exploitables.',
  },
  {
    q: 'Est-ce adapté à différents âges et niveaux ?',
    a: 'Oui. Le parcours s'ajuste selon le niveau, les objectifs et le contexte d'apprentissage.',
  },
  {
    q: 'L'IA va-t-elle rendre les élèves paresseux ?',
    a: 'Non. L'IA est conçue pour faire réfléchir, questionner et guider, pas pour faire à la place de l'apprenant.',
  },
] as const;

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-[#f5f1ef] text-[#141426]">
      <div className="sticky top-0 z-50 flex justify-center px-4 py-4 sm:px-6 lg:px-10">
        <Header />
      </div>

      <PageLayout title="Les réponses aux questions les plus fréquentes.">
        <div className="mx-auto max-w-4xl space-y-2 xs:space-y-3">
          {ITEMS.map((item) => (
            <details
              key={item.q}
              className="group rounded-[16px] xs:rounded-[20px] sm:rounded-2xl border border-black/8 bg-white px-4 xs:px-5 sm:px-6 py-3 xs:py-4"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 xs:gap-4 text-xs xs:text-sm font-semibold text-[#17172A] transition hover:text-[#6d72d8] focus:outline-none focus:ring-2 focus:ring-[#6d72d8] rounded px-1">
                <span className="text-left">{item.q}</span>
                <span className="flex-shrink-0 text-black/35 transition group-open:rotate-180">⌄</span>
              </summary>
              <p className="mt-3 xs:mt-4 text-xs xs:text-sm leading-6 xs:leading-7 text-black/55">{item.a}</p>
            </details>
          ))}
        </div>
      </PageLayout>

      <Footer />
    </main>
  );
}
