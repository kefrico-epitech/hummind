import { MarketingShell } from '@/features/marketing/components/marketing-shell';

const ITEMS = [
  {
    q: 'En quoi HummindOS est-il différent d’un simple chatbot ?',
    a: 'Hummind structure les cours, suit la progression et s’appuie sur un vrai modèle pédagogique, pas seulement sur une conversation.',
  },
  {
    q: 'Les enseignants gardent-ils la main sur les contenus ?',
    a: 'Oui. L’IA assiste la création, mais l’enseignant reste responsable du cours et peut tout ajuster avant publication.',
  },
  {
    q: 'Peut-on importer des cours existants ?',
    a: 'Oui, la plateforme est pensée pour intégrer des documents et les convertir en contenus exploitables.',
  },
  {
    q: 'Est-ce adapté à différents âges et niveaux ?',
    a: 'Oui. Le parcours s’ajuste selon le niveau, les objectifs et le contexte d’apprentissage.',
  },
  {
    q: 'L’IA va-t-elle rendre les élèves paresseux ?',
    a: 'Non. L’IA est conçue pour faire réfléchir, questionner et guider, pas pour faire à la place de l’apprenant.',
  },
] as const;

export default function FAQPage() {
  return (
    <MarketingShell>
      <section className="py-10">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-600">FAQ</p>
          <h1 className="mt-4 text-balance font-display text-5xl font-semibold tracking-[-0.045em] text-[#17172A] sm:text-6xl">
            Les réponses aux questions les plus fréquentes.
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-4xl space-y-3 py-8">
        {ITEMS.map((item) => (
          <details key={item.q} className="group rounded-2xl border border-black/8 bg-white px-5 py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-[#17172A]">
              <span>{item.q}</span>
              <span className="text-black/35 transition group-open:rotate-180">⌄</span>
            </summary>
            <p className="mt-3 text-sm leading-7 text-black/55">{item.a}</p>
          </details>
        ))}
      </section>
    </MarketingShell>
  );
}
