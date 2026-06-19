'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Route } from 'next';
import { ArrowRight, ChevronDown, HelpCircle, MoveUp, X } from 'lucide-react';
import { useState } from 'react';

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [chatbotOpen, setChatbotOpen] = useState(false);

  return (
    <main className="min-h-screen bg-[#f5f1ef] text-[#141426]">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[linear-gradient(180deg,#d8d9fb_0%,#f7ece7_54%,#f5f1ef_100%)] px-5 pb-20 pt-6 sm:px-8 sm:pb-28 sm:pt-8 lg:px-10 lg:pb-32 lg:pt-12">
        <div className="absolute left-[-10%] top-[20%] h-80 w-80 rounded-full bg-[#f4cabc]/70 blur-[120px]" />
        <div className="absolute right-[-8%] top-[-2%] h-96 w-96 rounded-full bg-[#cfd1ff]/80 blur-[140px]" />

        <div className="relative mx-auto max-w-[1120px]">
          <header className="mx-auto flex w-fit items-center gap-2 rounded-full border border-white/85 bg-white/90 px-3 py-2 shadow-[0_16px_40px_rgba(28,22,54,0.12)] backdrop-blur">
            <Link
              href={'/' as Route}
              className="flex items-center rounded-full px-4 py-2 text-[12px] font-semibold text-[#151526] transition hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-[#6d72d8]"
              aria-label="Hummind OS - Accueil"
            >
              <Image src="/home/logo.png" alt="HummindOS" width={92} height={22} className="h-5 w-auto" />
            </Link>
            <nav className="hidden items-center gap-1 sm:flex">
              <TopNavLink href={'/produit' as Route}>Notre produit</TopNavLink>
              <TopNavLink href={'/login' as Route}>Se connecter</TopNavLink>
            </nav>
            <Link
              href={'/demo' as Route}
              className="inline-flex items-center justify-center rounded-full bg-[#171729] px-5 py-3 text-[12px] font-semibold text-white transition hover:bg-[#0f1020] hover:shadow-lg active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#6d72d8] focus:ring-offset-2 min-h-[44px]"
              aria-label="Réserver une démo gratuite"
            >
              Reserver une demo
            </Link>
          </header>

          <div className="mx-auto max-w-[950px] px-3 pb-24 pt-18 text-center sm:pb-32 sm:pt-24 lg:pb-40 lg:pt-32">
            <h1 className="text-balance font-display text-[48px] font-semibold leading-[1.0] tracking-[-0.05em] text-[#171728] sm:text-[64px] lg:text-[80px]">
              Transformer vos cours en une{' '}
              <span className="bg-[linear-gradient(90deg,#5656a2_0%,#e84747_100%)] bg-clip-text text-transparent">
                experience d&apos;apprentissage guidee
              </span>{' '}
              interactive et mesurable.
            </h1>

            <Link
              href={'/demo' as Route}
              className="mt-14 inline-flex min-w-[200px] items-center justify-center rounded-full bg-[#e5d3cd]/90 px-9 py-4 text-[15px] font-semibold text-[#201b24] transition hover:bg-[#dfc9c1] hover:shadow-lg active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#6d72d8] min-h-[48px]"
              aria-label="Réserver une démo gratuitement"
            >
              Reserver une demo
            </Link>

            <p className="mx-auto mt-10 max-w-[480px] text-[13px] font-medium leading-7 text-[#807779] sm:text-[14px]">
              Utilise par enseignants, ecoles et formations professionnelles
            </p>
          </div>
        </div>
      </section>

      {/* Problem Section with Bot */}
      <section className="relative overflow-hidden rounded-t-[40px] bg-[#141426] px-5 pt-24 text-white sm:px-8 sm:pt-32 lg:px-10">
        <div className="mx-auto max-w-[1120px]">
          <div className="mx-auto max-w-[880px] text-center">
            <h2 className="text-balance font-display text-[44px] font-semibold leading-[1.05] tracking-[-0.05em] sm:text-[60px] lg:text-[68px]">
              Enseigner aujourd&apos;hui n&apos;a jamais ete aussi exigeant.
            </h2>
            <p className="mx-auto mt-12 max-w-[780px] text-[16px] leading-8 text-white/70 sm:text-[17px]">
              Les classes aux profils varies d&apos;apprenants et des programmes souvent trop
              charges rendent l&apos;apprentissage complexe.
            </p>
            <p className="mx-auto mt-6 max-w-[780px] text-[16px] leading-8 text-white/70 sm:text-[17px]">
              Si l&apos;IA transforme aujourd&apos;hui les choses, elle le fait malheureusement
              souvent dans un sens qui ne repond pas entierement aux besoins reels du systeme
              educatif.
            </p>
          </div>

          <div className="relative mt-24 h-[340px] sm:h-[480px] lg:h-[540px] max-w-[900px] mx-auto">
            <Image
              src="/home/bot 2.png"
              alt="Illustration Hummind - Tuteur IA conversationnel"
              fill
              className="object-contain object-center lg:object-bottom"
              priority
              quality={90}
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-[linear-gradient(180deg,#d4d5fb_0%,#f5f1ef_24%,#f5f1ef_100%)] px-5 py-24 sm:px-8 sm:py-32 lg:px-10">
        <div className="mx-auto max-w-[1120px]">
          <div className="mx-auto max-w-[840px] text-center">
            <h2 className="text-balance font-display text-[44px] font-semibold leading-[1.05] tracking-[-0.05em] text-[#171728] sm:text-[60px] lg:text-[68px]">
              Un apprentissage orchestre, de l&apos;objectif a la maitrise.
            </h2>
            <p className="mx-auto mt-10 max-w-[780px] text-[16px] leading-8 text-[#726b73] sm:text-[17px]">
              HummindOS structure, accompagne et mesure l&apos;apprentissage du premier objectif
              jusqu&apos;a la maitrise reelle. Nous ne vous offrons pas un gadget, mais un
              veritable outil qui englobe toutes les etapes de la pedagogie.
            </p>
          </div>

          <div className="mx-auto mt-18 grid max-w-[980px] gap-6 sm:grid-cols-1 md:grid-cols-3">
            {CARDS.map((card) => (
              <article
                key={card.title}
                className={`group flex min-h-[300px] flex-col rounded-[24px] px-7 pb-8 pt-8 shadow-[0_18px_40px_rgba(20,20,38,0.08)] transition hover:shadow-[0_28px_60px_rgba(20,20,38,0.16)] hover:scale-[1.02] cursor-pointer ${card.tone}`}
              >
                {/* Icon container with better proportions */}
                <div className="flex items-center justify-start">
                  <div className="relative h-32 w-32 flex-shrink-0 transition group-hover:scale-110 duration-300">
                    <Image src={card.image} alt="" fill className="object-contain object-left-top" />
                  </div>
                </div>

                {/* Text content with better spacing */}
                <div className="mt-10 flex flex-col flex-1">
                  <h3 className={`text-[22px] font-semibold leading-[1.3] ${card.titleColor}`}>
                    {card.title}
                  </h3>
                  <p className={`mt-5 text-[15px] leading-[1.6] ${card.descColor}`}>{card.desc}</p>
                </div>

                {/* Arrow indicator */}
                <div className="mt-8 flex justify-start transition group-hover:translate-x-1 duration-300">
                  <ArrowRight className={`h-6 w-6 ${card.arrowColor}`} />
                </div>
              </article>
            ))}
          </div>

          <div className="mx-auto mt-28 max-w-[840px] text-center">
            <h2 className="text-balance font-display text-[42px] font-semibold leading-[1.06] tracking-[-0.05em] text-[#171728] sm:text-[56px] lg:text-[64px]">
              Demarrer gratuitement des maintenant
            </h2>
            <Link
              href={'/demo' as Route}
              className="mt-12 inline-flex min-w-[200px] items-center justify-center rounded-full bg-[#e2dfe4] px-9 py-4 text-[15px] font-semibold text-[#1c1721] transition hover:bg-[#d9d4da] hover:shadow-lg active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#6d72d8] min-h-[48px]"
              aria-label="Démarrer gratuitement"
            >
              Demarrer gratuitement
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="rounded-t-[40px] bg-[#141426] px-5 pb-20 pt-28 text-white sm:px-8 sm:pb-24 sm:pt-36 lg:px-10">
        <div className="mx-auto max-w-[1120px]">
          <div className="text-center">
            <h2 className="font-display text-[56px] font-semibold tracking-[-0.05em] sm:text-[72px] lg:text-[80px]">
              FAQ
            </h2>
            <p className="mt-6 text-[16px] sm:text-[18px] text-white/65">Vous aviez des questions ?</p>
          </div>

          <div className="mx-auto mt-24 max-w-[840px] space-y-5">
            {FAQ_ITEMS.map((item, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={item.q}
                  className="overflow-hidden rounded-[16px] border border-white/8 bg-[#2a293d]/80 transition hover:border-white/15 hover:bg-[#2a293d] focus-within:ring-2 focus-within:ring-[#6d72d8]"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="flex w-full items-center justify-between gap-4 px-8 py-6 text-left text-[16px] sm:text-[17px] font-semibold text-white/92 transition hover:text-white hover:bg-white/[0.03] active:bg-white/[0.05] focus:outline-none min-h-[44px]"
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${index}`}
                  >
                    <span className="leading-7">{item.q}</span>
                    <ChevronDown
                      className={`h-5 w-5 flex-shrink-0 text-white/45 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      aria-hidden="true"
                    />
                  </button>
                  {isOpen ? (
                    <div
                      id={`faq-answer-${index}`}
                      className="border-t border-white/8 px-8 py-6 text-[15px] sm:text-[16px] leading-8 text-white/70 animate-in fade-in"
                    >
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
              className="mt-12 inline-flex min-w-[196px] items-center justify-center rounded-full bg-[#2f2e43] px-8 py-4 text-[15px] sm:text-[16px] font-semibold text-white transition hover:bg-[#3a3952] hover:shadow-lg active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#6d72d8] min-h-[44px]"
              aria-label="Prendre rendez-vous"
            >
              Reserver une demo
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#f5f1ef] px-5 py-14 sm:px-8 sm:py-18 lg:px-10 border-t border-[#e8e4df]">
        <div className="mx-auto max-w-[1120px]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-8 sm:gap-6">
            {/* Left: Logo + Main Links */}
            <div className="flex items-center justify-center sm:justify-start gap-8 text-[12px] sm:text-[13px] text-[#8a8388]">
              <img src="/home/logo-footer.svg" alt="HummindOS" className="h-5 w-auto flex-shrink-0" />
              <div className="hidden sm:flex items-center gap-8">
                <Link href={'/produit' as Route} className="transition hover:text-[#1d1a23] focus:outline-none focus:ring-2 focus:ring-[#6d72d8] rounded px-2 py-1 min-h-[44px] inline-flex items-center">
                  Notre produit
                </Link>
                <Link href={'/contact' as Route} className="transition hover:text-[#1d1a23] focus:outline-none focus:ring-2 focus:ring-[#6d72d8] rounded px-2 py-1 min-h-[44px] inline-flex items-center">
                  Nous contacter
                </Link>
                <Link href={'/faq' as Route} className="transition hover:text-[#1d1a23] focus:outline-none focus:ring-2 focus:ring-[#6d72d8] rounded px-2 py-1 min-h-[44px] inline-flex items-center">
                  FAQ
                </Link>
              </div>
            </div>

            {/* Center: Copyright */}
            <p className="text-center text-[12px] sm:text-[13px] text-[#8a8388] sm:flex-1">© HummindOS 2025. Tous droits reserves.</p>

            {/* Right: Legal + Social */}
            <div className="flex items-center justify-center sm:justify-end gap-8 text-[12px] sm:text-[13px] text-[#8a8388]">
              <Link href={'/conditions' as Route} className="transition hover:text-[#1d1a23] focus:outline-none focus:ring-2 focus:ring-[#6d72d8] rounded px-2 py-1 min-h-[44px] inline-flex items-center">
                Conditions
              </Link>
              <Link href={'/confidentialite' as Route} className="transition hover:text-[#1d1a23] focus:outline-none focus:ring-2 focus:ring-[#6d72d8] rounded px-2 py-1 min-h-[44px] inline-flex items-center">
                Confidentialite
              </Link>
              <div className="flex items-center gap-5 pl-3 border-l border-[#d8d3cd]">
                <a href="#" className="text-[#8a8388] hover:text-[#1d1a23] transition focus:outline-none focus:ring-2 focus:ring-[#6d72d8] rounded p-1.5 min-h-[44px] inline-flex items-center" aria-label="LinkedIn">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
                  </svg>
                </a>
                <a href="#" className="text-[#8a8388] hover:text-[#1d1a23] transition focus:outline-none focus:ring-2 focus:ring-[#6d72d8] rounded p-1.5 min-h-[44px] inline-flex items-center" aria-label="X (Twitter)">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.657l-5.207-6.807-5.974 6.807H2.882l7.73-8.835L1.24 2.25h6.837l4.713 6.231 5.422-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117Z" />
                  </svg>
                </a>
                <a href="#" className="text-[#8a8388] hover:text-[#1d1a23] transition focus:outline-none focus:ring-2 focus:ring-[#6d72d8] rounded p-1.5 min-h-[44px] inline-flex items-center" aria-label="Instagram">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0m5.521 17.5h-11.042V6.5h11.042v11z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Mobile menu for links */}
          <div className="sm:hidden flex items-center justify-center gap-6 mt-8 text-[12px] text-[#8a8388] border-t border-[#e8e4df] pt-8">
            <Link href={'/produit' as Route} className="transition hover:text-[#1d1a23] focus:outline-none focus:ring-2 focus:ring-[#6d72d8] rounded px-2 py-1 min-h-[44px] inline-flex items-center">
              Notre produit
            </Link>
            <Link href={'/contact' as Route} className="transition hover:text-[#1d1a23] focus:outline-none focus:ring-2 focus:ring-[#6d72d8] rounded px-2 py-1 min-h-[44px] inline-flex items-center">
              Nous contacter
            </Link>
            <Link href={'/faq' as Route} className="transition hover:text-[#1d1a23] focus:outline-none focus:ring-2 focus:ring-[#6d72d8] rounded px-2 py-1 min-h-[44px] inline-flex items-center">
              FAQ
            </Link>
          </div>
        </div>
      </footer>

      {/* Chatbot FAB */}
      <button
        type="button"
        onClick={() => setChatbotOpen(true)}
        aria-label="Ouvrir le chat d'assistance"
        className="fixed bottom-6 right-6 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#18172a] text-white shadow-[0_18px_40px_rgba(16,15,31,0.32)] transition hover:scale-[1.08] hover:bg-black active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#6d72d8] min-h-[44px]"
      >
        <HelpCircle className="h-5 w-5" />
      </button>

      {/* Chatbot Modal */}
      {chatbotOpen ? (
        <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-[2px] flex items-end justify-end p-4 sm:p-5 animate-in fade-in">
          <div className="h-auto w-full max-w-[420px] rounded-[28px] bg-[#f7f7f8] shadow-[0_28px_80px_rgba(0,0,0,0.32)] flex flex-col animate-in slide-in-from-bottom-4">
            {/* Header with gradient */}
            <div className="bg-[linear-gradient(135deg,#5d62b8_0%,#8d92d4_50%,#9fa3d9_100%)] px-6 pt-5 pb-6 text-white rounded-t-[28px]">
              <div className="flex items-start justify-between gap-3">
                <div className="text-lg font-semibold tracking-tight">
                  <span className="font-display">Hummind</span><span className="font-light">OS</span>
                </div>
                <button
                  type="button"
                  onClick={() => setChatbotOpen(false)}
                  className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white min-h-[44px]"
                  aria-label="Fermer le chat"
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
                  className="w-full rounded-[16px] border border-[#e0e0e2] bg-white px-4 py-2.5 text-[13px] placeholder-[#b0b0b5] text-[#1a1a1e] outline-none transition focus:border-[#6d72d8] focus:ring-2 focus:ring-[#6d72d8]/20 min-h-[44px]"
                  aria-label="Votre adresse email"
                />

                <textarea
                  placeholder="Votre message..."
                  rows={3}
                  className="w-full resize-none rounded-[16px] border border-[#e0e0e2] bg-white px-4 py-2.5 text-[13px] placeholder-[#b0b0b5] text-[#1a1a1e] outline-none transition focus:border-[#6d72d8] focus:ring-2 focus:ring-[#6d72d8]/20"
                  aria-label="Votre message"
                />

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setChatbotOpen(false)}
                    className="flex-1 rounded-full bg-[#f0f0f1] text-[13px] font-medium text-[#888891] px-4 py-2 transition hover:bg-[#e6e6e8] active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#6d72d8] min-h-[44px]"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center h-10 w-10 flex-shrink-0 rounded-full bg-[#18172a] text-white transition hover:bg-black active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#6d72d8] min-h-[44px]"
                    aria-label="Envoyer le message"
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
      className="rounded-full px-4 py-2 text-[12px] font-medium text-[#706a71] transition hover:text-[#151526] focus:outline-none focus:ring-2 focus:ring-[#6d72d8] min-h-[44px] inline-flex items-center"
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
    descColor: 'text-white/70',
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
