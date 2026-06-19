import Link from 'next/link';
import type { Route } from 'next';
import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

type NavLink = {
  label: string;
  href: Route;
};

const NAV_LINKS: NavLink[] = [
  { label: 'Notre produit', href: '/produit' as Route },
  { label: 'Se connecter', href: '/login' as Route },
  { label: 'Réserver une démo', href: '/demo' as Route },
];

export function MarketingShell({
  children,
  footer = true,
  className,
}: {
  children: ReactNode;
  footer?: boolean;
  className?: string;
}) {
  return (
    <main
      className={cn(
        'relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(107,78,230,0.16),_transparent_38%),radial-gradient(circle_at_top_right,_rgba(95,208,166,0.18),_transparent_32%),linear-gradient(180deg,_#f8f7ff_0%,_#ffffff_36%,_#f7f8fb_100%)]',
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 opacity-60 [background-image:linear-gradient(rgba(17,17,20,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(17,17,20,0.045)_1px,transparent_1px)] [background-size:72px_72px]" />
      <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-10">
        <header className="sticky top-4 z-20 mx-auto mb-8 flex max-w-4xl items-center justify-between gap-4 rounded-full border border-white/60 bg-white/80 px-4 py-3 shadow-[0_12px_40px_rgba(17,17,20,0.08)] backdrop-blur">
          <Link href={'/' as Route} className="flex items-center gap-2 text-sm font-semibold text-[#111116]">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-500 text-[11px] font-bold text-white">
              i
            </span>
            HummindOS
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-black/55 md:flex">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="transition hover:text-black/90">
                {link.label}
              </Link>
            ))}
          </nav>
          <Link
            href={'/demo' as Route}
            className="inline-flex items-center justify-center rounded-full bg-[#17172A] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0f0f1e]"
          >
            Réserver une démo
          </Link>
        </header>

        <div className="relative">{children}</div>

        {footer ? (
          <footer className="mt-16 flex flex-col gap-6 border-t border-black/8 py-8 text-sm text-black/45 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">
                i
              </span>
              <span className="font-semibold text-black/70">HummindOS</span>
              <span>© Hummind 2026. Tous droits réservés.</span>
            </div>
            <div className="flex items-center gap-5">
              <Link href={'/produit' as Route} className="transition hover:text-black/80">
                Notre produit
              </Link>
              <Link href={'/contact' as Route} className="transition hover:text-black/80">
                Nous contacter
              </Link>
              <Link href={'/faq' as Route} className="transition hover:text-black/80">
                FAQ
              </Link>
              <Link href={'/conditions' as Route} className="transition hover:text-black/80">
                Conditions
              </Link>
              <Link href={'/confidentialite' as Route} className="transition hover:text-black/80">
                Confidentialité
              </Link>
            </div>
          </footer>
        ) : null}
      </div>
    </main>
  );
}
