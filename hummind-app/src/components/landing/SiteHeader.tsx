"use client";

import Image from "next/image";
import Link from "next/link";

export function SiteHeader() {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <nav
        className="pointer-events-auto flex w-full max-w-[760px] items-center justify-between gap-6 rounded-full bg-white/90 px-3 py-2 shadow-[0_8px_24px_-12px_rgba(20,20,26,0.18)] ring-1 ring-black/5 backdrop-blur-md"
        aria-label="Navigation principale"
      >
        <Link href="/" className="flex items-center gap-2 pl-3">
          <span className="relative block h-5 w-5">
            <Image
              src="/logo.svg"
              alt=""
              fill
              sizes="20px"
              className="object-contain"
            />
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-hm-ink-900">
            Hummind
            <span className="text-hm-ink-500">OS</span>
          </span>
        </Link>

        <div className="hidden items-center gap-8 text-[14px] font-medium text-hm-ink-500 md:flex">
          <Link href="/product" className="transition-colors hover:text-hm-ink-900">
            Notre produit
          </Link>
          <Link href="/login" className="transition-colors hover:text-hm-ink-900">
            Se connecter
          </Link>
        </div>

        <Link
          href="/demo"
          className="inline-flex items-center justify-center rounded-full bg-hm-ink-950 px-5 py-2.5 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-hm-ink-900"
        >
          Réserver une démo
        </Link>
      </nav>
    </div>
  );
}
