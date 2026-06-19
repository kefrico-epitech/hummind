'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useEffect, useState } from 'react';

export function Footer() {
  const [year, setYear] = useState(2025);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="bg-[#e8e6e1] px-4 xs:px-6 sm:px-10 lg:px-12 py-5 xs:py-6 border-t border-[#d8d3cd]">
      <div className="mx-auto max-w-full">
        <div className="flex flex-col xs:flex-row xs:items-center xs:justify-center gap-3 xs:gap-4 sm:gap-6 text-[11px] xs:text-[12px] sm:text-[13px] text-[#8a8388]">
          {/* Logo */}
          <img src="/home/logo-footer.svg" alt="HummindOS" className="h-4 xs:h-5 w-auto shrink-0" />

          {/* Nav Links */}
          <div className="hidden xs:flex items-center gap-4 sm:gap-6">
            <Link href={'/produit' as Route} className="transition hover:text-[#1d1a23] focus:outline-none focus:ring-1 focus:ring-[#6d72d8] rounded px-1 py-0.5 min-h-9 inline-flex items-center">
              Notre produit
            </Link>
            <Link href={'/contact' as Route} className="transition hover:text-[#1d1a23] focus:outline-none focus:ring-1 focus:ring-[#6d72d8] rounded px-1 py-0.5 min-h-9 inline-flex items-center">
              Nous contacter
            </Link>
            <Link href={'/faq' as Route} className="transition hover:text-[#1d1a23] focus:outline-none focus:ring-1 focus:ring-[#6d72d8] rounded px-1 py-0.5 min-h-9 inline-flex items-center">
              FAQ
            </Link>
          </div>

          {/* Copyright - Two lines */}
          <p className="text-center xs:flex-1 xs:px-3 sm:px-4">
            <span className="block xs:inline">© HummindOS {year}.</span>
            <span className="block xs:inline"> Tous droits<br className="xs:hidden" /> reserves.</span>
          </p>

          {/* Legal + Social */}
          <div className="flex items-center justify-center gap-4 sm:gap-5">
            <Link href={'/conditions' as Route} className="transition hover:text-[#1d1a23] focus:outline-none focus:ring-1 focus:ring-[#6d72d8] rounded px-1 py-0.5 min-h-9 inline-flex items-center whitespace-nowrap">
              Conditions
            </Link>
            <Link href={'/confidentialite' as Route} className="transition hover:text-[#1d1a23] focus:outline-none focus:ring-1 focus:ring-[#6d72d8] rounded px-1 py-0.5 min-h-9 inline-flex items-center whitespace-nowrap">
              Confidentialite
            </Link>
            <div className="flex items-center gap-3 xs:gap-4 pl-4 xs:pl-5 border-l border-[#d8d3cd]">
              <a href="#" className="text-[#8a8388] hover:text-[#1d1a23] transition focus:outline-none focus:ring-1 focus:ring-[#6d72d8] rounded p-1 min-h-10 inline-flex items-center" aria-label="LinkedIn">
                <svg className="h-4 xs:h-5 w-4 xs:w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
                </svg>
              </a>
              <a href="#" className="text-[#8a8388] hover:text-[#1d1a23] transition focus:outline-none focus:ring-1 focus:ring-[#6d72d8] rounded p-1 min-h-10 inline-flex items-center" aria-label="X (Twitter)">
                <svg className="h-4 xs:h-5 w-4 xs:w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.657l-5.207-6.807-5.974 6.807H2.882l7.73-8.835L1.24 2.25h6.837l4.713 6.231 5.422-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117Z" />
                </svg>
              </a>
              <a href="#" className="text-[#8a8388] hover:text-[#1d1a23] transition focus:outline-none focus:ring-1 focus:ring-[#6d72d8] rounded p-1 min-h-10 inline-flex items-center" aria-label="YouTube">
                <svg className="h-4 xs:h-5 w-4 xs:w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
