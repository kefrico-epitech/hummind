'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Route } from 'next';
import { ArrowRight, ChevronDown, HelpCircle, MoveUp, X } from 'lucide-react';
import { useState } from 'react';

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [chatbotOpen, setChatbotOpen] = useState(false);

  return (
    <main className="min-h-screen bg-[#f5f1ef] text-[#141426]">
      <section className="relative overflow-hidden bg-[linear-gradient(180deg,#d8d9fb_0%,#f7ece7_54%,#f5f1ef_100%)] px-5 pb-24 pt-8 sm:px-8 sm:pb-28 lg:px-10">
        <div className="absolute left-[-10%] top-[20%] h-80 w-80 rounded-full bg-[#f4cabc]/70 blur-[120px]" />
        <div className="absolute right-[-8%] top-[-2%] h-96 w-96 rounded-full bg-[#cfd1ff]/80 blur-[140px]" />

        <div className="relative mx-auto max-w-[1120px]">
          <header className="mx-auto flex w-fit items-center gap-2 rounded-full border border-white/85 bg-white/90 px-3 py-2 shadow-[0_16px_40px_rgba(28,22,54,0.12)] backdrop-blur">
            <Link
              href={'/' as Route}
              className="flex items-center rounded-full px-4 py-2 text-[12px] font-semibold text-[#151526]"
            >
              <Image src="/home/logo.png" alt="HummindOS" width={92} height={22} className="h-5 w-auto" />
            </Link>
            <nav className="hidden items-center gap-1 sm:flex">
              <TopNavLink href={'/produit' as Route}>Notre produit</TopNavLink>
              <TopNavLink href={'/login' as Route}>Se connecter</TopNavLink>
            </nav>
            <Link
              href={'/demo' as Route}
              className="inline-flex items-center justify-center rounded-full bg-[#171729] px-5 py-3 text-[12px] font-semibold text-white transition hover:bg-[#0f1020]"
            >
              Reserver une demo
            </Link>
          </header>

          <div className="mx-auto max-w-[920px] px-2 pb-28 pt-24 text-center sm:pb-36 sm:pt-28 lg:pb-40 lg:pt-32">
            <h1 className="text-balance font-display text-[46px] font-semibold leading-[0.98] tracking-[-0.05em] text-[#171728] sm:text-[68px] lg:text-[78px]">
              Transformer vos cours en une{' '}
              <span className="bg-[linear-gradient(90deg,#6d72d8_0%,#9a70d8_34%,#cd7dad_66%,#ee9c76_100%)] bg-clip-text text-transparent">
                experience d&apos;apprentissage guidee
              </span>{' '}
              interactive et mesurable.
            </h1>

            <Link
              href={'/demo' as Route}
              className="mt-12 inline-flex min-w-[196px] items-center justify-center rounded-full bg-[#e5d3cd]/90 px-8 py-4 text-[14px] font-semibold text-[#201b24] transition hover:bg-[#dfc9c1]"
            >
              Reserver une demo
            </Link>

            <p className="mx-auto mt-8 max-w-[440px] text-[13px] font-medium leading-6 text-[#807779] sm:text-[14px]">
              Utilise par enseignants, ecoles et formations professionnelles
            </p>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden rounded-t-[40px] bg-[#141426] px-5 pt-20 text-white sm:px-8 sm:pt-24 lg:px-10">
        <div className="mx-auto max-w-[1120px]">
          <div className="mx-auto max-w-[860px] text-center">
            <h2 className="text-balance font-display text-[42px] font-semibold leading-[1.02] tracking-[-0.05em] sm:text-[58px] lg:text-[64px]">
              Enseigner aujourd&apos;hui n&apos;a jamais ete aussi exigeant.
            </h2>
            <p className="mx-auto mt-10 max-w-[760px] text-[15px] leading-8 text-white/48 sm:text-[16px]">
              Les classes aux profils varies d&apos;apprenants et des programmes souvent trop
              charges rendent l&apos;apprentissage complexe.
            </p>
            <p className="mx-auto mt-3 max-w-[760px] text-[15px] leading-8 text-white/48 sm:text-[16px]">
              Si l&apos;IA transforme aujourd&apos;hui les choses, elle le fait malheureusement
              souvent dans un sens qui ne repond pas entierement aux besoins reels du systeme
              educatif.
            </p>
          </div>

          <div className="relative mt-20 h-[380px] sm:h-[500px] lg:h-[560px]">
            <Image
              src="/home/bot 2.png"
              alt="Illustration Hummind"
              fill
              className="object-contain object-bottom"
              priority
            />
          </div>
        </div>
      </section>

      <section className="bg-[linear-gradient(180deg,#d4d5fb_0%,#f5f1ef_24%,#f5f1ef_100%)] px-5 py-24 sm:px-8 sm:py-28 lg:px-10">
        <div className="mx-auto max-w-[1120px]">
          <div className="mx-auto max-w-[820px] text-center">
            <h2 className="text-balance font-display text-[42px] font-semibold leading-[1.02] tracking-[-0.05em] text-[#171728] sm:text-[58px] lg:text-[64px]">
              Un apprentissage orchestre, de l&apos;objectif a la maitrise.
            </h2>
            <p className="mx-auto mt-8 max-w-[760px] text-[15px] leading-8 text-[#726b73] sm:text-[16px]">
              HummindOS structure, accompagne et mesure l&apos;apprentissage du premier objectif
              jusqu&apos;a la maitrise reelle. Nous ne vous offrons pas un gadget, mais un
              veritable outil qui englobe toutes les etapes de la pedagogie.
            </p>
          </div>

          <div className="mx-auto mt-18 grid max-w-[980px] gap-6 md:grid-cols-3">
            {CARDS.map((card) => (
              <article
                key={card.title}
                className={`flex min-h-[320px] flex-col rounded-[20px] px-7 pb-6 pt-7 shadow-[0_18px_40px_rgba(20,20,38,0.08)] ${card.tone}`}
              >
                <div className="relative h-24 w-24">
                  <Image src={card.image} alt={card.title} fill className="object-contain" />
                </div>
                <h3 className={`mt-8 text-[21px] font-semibold leading-7 ${card.titleColor}`}>
                  {card.title}
                </h3>
                <p className={`mt-4 text-[14px] leading-6 ${card.descColor}`}>{card.desc}</p>
                <div className="mt-auto flex justify-end pt-8">
                  <ArrowRight className={`h-5 w-5 ${card.arrowColor}`} />
                </div>
              </article>
            ))}
          </div>

          <div className="mx-auto mt-24 max-w-[820px] text-center">
            <h2 className="text-balance font-display text-[40px] font-semibold leading-[1.04] tracking-[-0.05em] text-[#171728] sm:text-[54px]">
              Pret a construire la meilleure experience d&apos;apprentissage assistee par l&apos;IA ?
            </h2>
            <Link
              href={'/demo' as Route}
              className="mt-10 inline-flex min-w-[196px] items-center justify-center rounded-full bg-[#e2dfe4] px-8 py-4 text-[14px] font-semibold text-[#1c1721] transition hover:bg-[#d9d4da]"
            >
              Reserver une demo
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-t-[40px] bg-[#141426] px-5 pb-16 pt-24 text-white sm:px-8 sm:pb-20 sm:pt-32 lg:px-10">
        <div className="mx-auto max-w-[1120px]">
          <div className="text-center">
            <h2 className="font-display text-[56px] font-semibold tracking-[-0.05em] sm:text-[72px] lg:text-[80px]">
              FAQ
            </h2>
            <p className="mt-6 text-[16px] sm:text-[18px] text-white/50">Vous aviez des questions ?</p>
          </div>

          <div className="mx-auto mt-20 max-w-[820px] space-y-5">
            {FAQ_ITEMS.map((item, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={item.q}
                  className="overflow-hidden rounded-[16px] border border-white/8 bg-[#2a293d]/80 transition hover:border-white/15 hover:bg-[#2a293d]"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="flex w-full items-center justify-between gap-4 px-8 py-6 text-left text-[16px] sm:text-[17px] font-semibold text-white/92 transition hover:text-white"
                  >
                    <span className="leading-7">{item.q}</span>
                    <ChevronDown
                      className={`h-5 w-5 flex-shrink-0 text-white/45 transition ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {isOpen ? (
                    <div className="border-t border-white/8 px-8 py-6 text-[15px] sm:text-[16px] leading-8 text-white/60">
                      {item.a}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="mx-auto mt-28 max-w-[820px] text-center">
            <h3 className="text-balance font-display text-[46px] font-semibold leading-[1.08] tracking-[-0.05em] sm:text-[62px] lg:text-[72px]">
              Parlons de votre projet pedagogique
            </h3>
            <Link
              href={'/contact' as Route}
              className="mt-12 inline-flex min-w-[196px] items-center justify-center rounded-full bg-[#2f2e43] px-8 py-4 text-[15px] sm:text-[16px] font-semibold text-white transition hover:bg-[#3a3952]"
            >
              Reserver une demo
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-[#f5f1ef] px-5 py-8 sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-[1120px] flex-col gap-6 text-[11px] text-[#8a8388] md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center justify-center gap-4 md:justify-start">
            <Image src="/home/logo-footer.svg" alt="HummindOS" width={86} height={16} className="h-4 w-auto" />
            <Link href={'/produit' as Route} className="transition hover:text-[#1d1a23]">
              Notre produit
            </Link>
            <Link href={'/contact' as Route} className="transition hover:text-[#1d1a23]">
              Nous contacter
            </Link>
            <Link href={'/faq' as Route} className="transition hover:text-[#1d1a23]">
              FAQ
            </Link>
          </div>

          <p className="text-center md:text-left">© HummindOS 2025. Tous droits reserves.</p>

          <div className="flex flex-wrap items-center justify-center gap-4 md:justify-end">
            <Link href={'/conditions' as Route} className="transition hover:text-[#1d1a23]">
              Conditions
            </Link>
            <Link href={'/confidentialite' as Route} className="transition hover:text-[#1d1a23]">
              Confidentialite
            </Link>
            <span className="text-[#6f6970]">in</span>
            <span className="text-[#6f6970]">X</span>
            <span className="text-[#6f6970]">ig</span>
          </div>
        </div>
      </footer>

      <button
        type="button"
        onClick={() => setChatbotOpen(true)}
        aria-label="Ouvrir le chatbot"
        className="fixed bottom-6 right-6 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#18172a] text-white shadow-[0_18px_40px_rgba(16,15,31,0.32)] transition hover:scale-[1.03] hover:bg-black"
      >
        <HelpCircle className="h-5 w-5" />
      </button>

      {chatbotOpen ? (
        <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-[2px] flex items-end justify-end p-4 sm:p-5">
          <div className="h-auto w-full max-w-[420px] rounded-[28px] bg-[#f7f7f8] shadow-[0_28px_80px_rgba(0,0,0,0.32)] flex flex-col">
            {/* Header with gradient */}
            <div className="bg-[linear-gradient(135deg,#5d62b8_0%,#8d92d4_50%,#9fa3d9_100%)] px-6 pt-5 pb-6 text-white rounded-t-[28px]">
              <div className="flex items-start justify-between gap-3">
                <div className="text-lg font-semibold tracking-tight">
                  <span className="font-display">Hummind</span><span className="font-light">OS</span>
                </div>
                <button
                  type="button"
                  onClick={() => setChatbotOpen(false)}
                  className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
                  aria-label="Fermer le chatbot"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <h3 className="mt-4 text-[20px] font-semibold leading-[1.2] tracking-[-0.02em]">
                Comment pouvons-nous vous aider ?
              </h3>
            </div>

            {/* Content */}
            <div className="px-5 py-5 space-y-4">
              <p className="text-center text-[13px] leading-6 text-[#878894]">
                Posez vos questions ou parlez-nous de vos commentaires. Nous sommes là pour vous aider.
              </p>

              {/* Form */}
              <div className="space-y-3">
                <input
                  type="email"
                  placeholder="votre@email.com"
                  className="w-full rounded-[16px] border border-[#e0e0e2] bg-white px-4 py-2.5 text-[13px] placeholder-[#b0b0b5] text-[#1a1a1e] outline-none transition focus:border-[#d0d0d5]"
                />

                <textarea
                  placeholder="Votre message..."
                  rows={3}
                  className="w-full resize-none rounded-[16px] border border-[#e0e0e2] bg-white px-4 py-2.5 text-[13px] placeholder-[#b0b0b5] text-[#1a1a1e] outline-none transition focus:border-[#d0d0d5]"
                />

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    className="flex-1 rounded-full bg-[#f0f0f1] text-[13px] font-medium text-[#888891] px-4 py-2 transition hover:bg-[#e6e6e8]"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center h-10 w-10 flex-shrink-0 rounded-full bg-[#18172a] text-white transition hover:bg-black"
                    aria-label="Envoyer"
                  >
                    <MoveUp className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function TopNavLink({ href, children }: { href: Route; children: string }) {
  return (
    <Link
      href={href}
      className="rounded-full px-4 py-2 text-[12px] font-medium text-[#706a71] transition hover:text-[#151526]"
    >
      {children}
    </Link>
  );
}

const CARDS = [
  {
    title: 'Des cours structures en quelques minutes',
    desc: 'Definissez vos objectifs et creez des modules clairs.',
    image: '/home/icon1.png',
    tone: 'bg-[#9d9ede]',
    titleColor: 'text-[#1a1730]',
    descColor: 'text-[#4b4660]',
    arrowColor: 'text-[#1a1730]',
  },
  {
    title: 'Un tuteur IA qui fait reflechir',
    desc: 'Il pose des questions, corrige en douceur chaque eleve.',
    image: '/home/icon2.png',
    tone: 'bg-[#17172a]',
    titleColor: 'text-white',
    descColor: 'text-white/58',
    arrowColor: 'text-white',
  },
  {
    title: 'Un suivi de maitrise reel',
    desc: 'Visualiser le niveau atteint sur chaque competence.',
    image: '/home/icon3.png',
    tone: 'bg-[#cae8df]',
    titleColor: 'text-[#1a1730]',
    descColor: 'text-[#4b5058]',
    arrowColor: 'text-[#1a1730]',
  },
] as const;

const FAQ_ITEMS = [
  {
    q: "En quoi HummindOS est-il different d'un simple chatbot ?",
    a: 'Hummind structure les cours, suit la progression et s appuie sur un vrai modele pedagogique, pas seulement sur une conversation.',
  },
  {
    q: 'Les enseignants gardent-ils la main sur les contenus ?',
    a: 'Oui. L IA assiste la creation, mais l enseignant reste responsable du cours et peut tout ajuster avant publication.',
  },
  {
    q: 'Peut-on importer des cours existants ?',
    a: 'Oui, la plateforme est pensee pour integrer des documents et les convertir en contenus exploitables.',
  },
  {
    q: 'Est-ce adapte a differents ages et niveaux ?',
    a: 'Oui. Le parcours s ajuste selon le niveau, les objectifs et le contexte d apprentissage.',
  },
  {
    q: 'L IA va-t-elle rendre les eleves paresseux ?',
    a: 'Non. L IA est concue pour faire reflechir, questionner et guider, pas pour faire a la place de l apprenant.',
  },
] as const;
