"use client";

import Link from "next/link";

interface CtaSectionProps {
  title: string;
  ctaLabel?: string;
  ctaHref?: string;
  variant?: "soft" | "white";
}

export function CtaSection({
  title,
  ctaLabel = "Réserver une démo",
  ctaHref = "/demo",
  variant = "soft",
}: CtaSectionProps) {
  const bg = variant === "soft" ? "bg-hm-bg-soft" : "bg-white";
  return (
    <section className={`${bg} py-24`}>
      <div className="mx-auto max-w-[920px] px-6 text-center">
        <h2 className="text-[clamp(22px,3vw,32px)] font-semibold leading-[1.25] tracking-tight text-hm-ink-900">
          {title}
        </h2>
        <Link
          href={ctaHref}
          className="mt-8 inline-flex items-center justify-center rounded-full bg-hm-peach-100 px-7 py-3 text-[14px] font-semibold text-hm-ink-900 transition-colors hover:bg-hm-peach-100/80"
        >
          {ctaLabel}
        </Link>
      </div>
    </section>
  );
}
