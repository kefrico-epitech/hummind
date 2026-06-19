import Link from 'next/link';
import type { Route } from 'next';

export function Footer() {
  return (
    <footer className="bg-[#f5f1ef] px-4 xs:px-6 sm:px-10 lg:px-16 py-12 xs:py-16 sm:py-14 lg:py-16 border-t border-[#e8e4df]">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col xs:gap-8 sm:flex-row sm:items-center sm:gap-6 lg:gap-12">
          <div className="flex items-center justify-center sm:justify-start gap-8 xs:gap-10 sm:gap-14 lg:gap-16 text-[12px] sm:text-[13px] text-[#8a8388]">
            <img src="/home/logo-footer.svg" alt="HummindOS" className="h-5 w-auto flex-shrink-0" />
            <div className="hidden sm:flex items-center gap-8 sm:gap-12 lg:gap-16">
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

          <p className="text-center text-[12px] sm:text-[13px] text-[#8a8388] sm:flex-1 sm:px-4 lg:px-8">© HummindOS 2025. Tous droits reserves.</p>

          <div className="flex items-center justify-center sm:justify-end gap-8 xs:gap-10 sm:gap-12 lg:gap-16 text-[12px] sm:text-[13px] text-[#8a8388]">
            <Link href={'/conditions' as Route} className="transition hover:text-[#1d1a23] focus:outline-none focus:ring-2 focus:ring-[#6d72d8] rounded px-2 py-1 min-h-[44px] inline-flex items-center whitespace-nowrap">
              Conditions
            </Link>
            <Link href={'/confidentialite' as Route} className="transition hover:text-[#1d1a23] focus:outline-none focus:ring-2 focus:ring-[#6d72d8] rounded px-2 py-1 min-h-[44px] inline-flex items-center whitespace-nowrap">
              Confidentialite
            </Link>
            <div className="flex items-center gap-6 xs:gap-7 sm:gap-8 pl-6 xs:pl-7 sm:pl-8 border-l border-[#d8d3cd]">
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
      </div>
    </footer>
  );
}
