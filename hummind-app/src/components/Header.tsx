'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Route } from 'next';
import { X, Menu } from 'lucide-react';
import { useState } from 'react';

function TopNavLink({ href, children }: { href: Route; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-3 py-2 text-[11px] sm:text-[12px] font-medium text-[#151526] rounded-lg hover:bg-white/40 transition focus:outline-none focus:ring-2 focus:ring-[#6d72d8]"
    >
      {children}
    </Link>
  );
}

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="relative mx-auto flex w-full items-center justify-between gap-1 xs:gap-1.5 sm:gap-2 rounded-xl sm:rounded-full border border-white/85 bg-white/90 px-2.5 xs:px-3 sm:px-6 py-2 xs:py-2.5 sm:py-3 shadow-[0_16px_40px_rgba(28,22,54,0.12)] backdrop-blur sm:w-fit">
      <Link
        href={'/' as Route}
        className="flex items-center rounded-full px-1.5 xs:px-2 sm:px-4 py-1 xs:py-1.5 sm:py-2 text-[10px] xs:text-[11px] sm:text-[12px] font-semibold text-[#151526] transition hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-[#6d72d8]"
        aria-label="Hummind OS - Accueil"
      >
        <Image src="/home/logo.png" alt="HummindOS" width={92} height={22} className="h-4 xs:h-4 sm:h-5 w-auto" />
      </Link>

      <nav className="hidden items-center gap-0.5 xs:gap-1 sm:gap-1 sm:flex">
        <TopNavLink href={'/produit' as Route}>Notre produit</TopNavLink>
        <TopNavLink href={'/login' as Route}>Se connecter</TopNavLink>
      </nav>

      <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2">
        <Link
          href={'/demo' as Route}
          className="hidden items-center justify-center rounded-full bg-[#171729] px-2.5 xs:px-3 sm:px-5 py-1 xs:py-1.5 sm:py-3 text-[10px] xs:text-[11px] sm:text-[12px] font-semibold text-white transition hover:bg-[#0f1020] hover:shadow-lg active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#6d72d8] focus:ring-offset-2 min-h-[44px] sm:inline-flex"
          aria-label="Réserver une démo gratuite"
        >
          Reserver une demo
        </Link>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="sm:hidden inline-flex items-center justify-center p-2 text-[#151526] hover:opacity-80 transition focus:outline-none focus:ring-2 focus:ring-[#6d72d8]"
          aria-label="Menu"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 sm:hidden rounded-xl border border-white/85 bg-white/90 shadow-[0_16px_40px_rgba(28,22,54,0.12)] backdrop-blur z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col">
            <Link
              href={'/produit' as Route}
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-3 text-[13px] font-medium text-[#151526] border-b border-white/40 hover:bg-white/60 transition"
            >
              Notre produit
            </Link>
            <Link
              href={'/login' as Route}
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-3 text-[13px] font-medium text-[#151526] border-b border-white/40 hover:bg-white/60 transition"
            >
              Se connecter
            </Link>
          </nav>
          <Link
            href={'/demo' as Route}
            onClick={() => setMobileMenuOpen(false)}
            className="block w-full px-4 py-3 text-[13px] font-semibold text-white bg-[#171729] hover:bg-[#0f1020] transition text-center"
          >
            Reserver una demo
          </Link>
        </div>
      )}
    </header>
  );
}
