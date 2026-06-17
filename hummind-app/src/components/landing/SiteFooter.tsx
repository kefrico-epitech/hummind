"use client";

import Image from "next/image";
import Link from "next/link";
import { Linkedin, Twitter, Youtube } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="bg-hm-bg-soft pt-12 pb-8">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="h-px w-full bg-black/10" />

        <div className="mt-8 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="flex flex-col items-start gap-6 md:flex-row md:items-center">
            <Link href="/" className="flex items-center gap-2">
              <span className="relative block h-5 w-5">
                <Image
                  src="/logo.svg"
                  alt=""
                  fill
                  sizes="20px"
                  className="object-contain"
                />
              </span>
              <span className="text-[14px] font-semibold tracking-tight text-hm-ink-900">
                Hummind<span className="text-hm-ink-500">OS</span>
              </span>
            </Link>

            <nav className="flex items-center gap-6 text-[13px] text-hm-ink-500">
              <Link href="/product" className="hover:text-hm-ink-900">
                Notre produit
              </Link>
              <Link href="/demo" className="hover:text-hm-ink-900">
                Nous contacter
              </Link>
              <Link href="/#faq" className="hover:text-hm-ink-900">
                FAQ
              </Link>
            </nav>
          </div>

          <div className="text-[13px] text-hm-ink-500">
            © HummindOS 2026. Tous droits réservés.
          </div>
        </div>

        <div className="mt-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-5 text-[13px] text-hm-ink-500">
            <Link href="/terms" className="hover:text-hm-ink-900">
              Conditions
            </Link>
            <Link href="/privacy" className="hover:text-hm-ink-900">
              Confidentialité
            </Link>
          </div>

          <div className="flex items-center gap-3 text-hm-ink-500">
            <Link
              href="#"
              aria-label="LinkedIn"
              className="rounded-full p-2 transition-colors hover:bg-black/5 hover:text-hm-ink-900"
            >
              <Linkedin className="h-4 w-4" />
            </Link>
            <Link
              href="#"
              aria-label="X (Twitter)"
              className="rounded-full p-2 transition-colors hover:bg-black/5 hover:text-hm-ink-900"
            >
              <Twitter className="h-4 w-4" />
            </Link>
            <Link
              href="#"
              aria-label="YouTube"
              className="rounded-full p-2 transition-colors hover:bg-black/5 hover:text-hm-ink-900"
            >
              <Youtube className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
