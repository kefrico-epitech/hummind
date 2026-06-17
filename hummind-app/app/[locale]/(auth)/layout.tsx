import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="relative flex min-h-svh w-full items-center justify-center bg-background-white px-4 py-6 text-foreground sm:px-6 sm:py-8">
      <Link
        href="/"
        aria-label="Retour"
        className="fixed left-3 top-3 z-50 inline-flex items-center gap-1.5 bg-white/90 px-2 py-1 text-xs font-medium text-black hover:text-black/70  focus-visible:ring-black/20 sm:left-4 sm:top-4 sm:gap-2 sm:text-sm"
      >
        <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        <span>Retour</span>
      </Link>

      <div className="fixed left-1/2 top-3 z-50 -translate-x-1/2 sm:top-4">
        <Image
          src="/logo.svg"
          alt="HummindOS"
          width={132}
          height={32}
          priority
          className="h-7 w-auto sm:h-8"
        />
      </div>

      <div className="relative w-full max-w-md pt-10 sm:max-w-lg sm:pt-12">
        {/* Card */}
        <div className="rounded-lg bg-white p-5 sm:rounded-xl sm:p-8">
          {/* Content */}
          <div className="w-full">{children}</div>
        </div>

        {/* Bottom note */}
        <p className="mt-4 px-2 text-center text-[11px] text-[#6E6E7B] sm:mt-6 sm:text-[12px]">
          (c) {new Date().getFullYear()} Hummind - Tous droits reserves.
        </p>
      </div>
    </main>
  );
}
