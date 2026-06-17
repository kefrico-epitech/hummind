"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

interface FeatureCardProps {
  variant: "purple" | "dark" | "mint";
  icon: ReactNode;
  title: string;
  description: string;
  href?: string;
}

const variantStyles: Record<
  FeatureCardProps["variant"],
  { card: string; title: string; body: string; arrow: string }
> = {
  purple: {
    card: "bg-hm-purple-100",
    title: "text-hm-ink-900",
    body: "text-hm-ink-500",
    arrow: "text-hm-ink-900",
  },
  dark: {
    card: "bg-hm-ink-950 text-white",
    title: "text-white",
    body: "text-white/60",
    arrow: "text-white",
  },
  mint: {
    card: "bg-hm-mint-200",
    title: "text-hm-ink-900",
    body: "text-hm-ink-500",
    arrow: "text-hm-ink-900",
  },
};

export function FeatureCard({
  variant,
  icon,
  title,
  description,
  href = "#",
}: FeatureCardProps) {
  const s = variantStyles[variant];
  return (
    <Link
      href={href}
      className={`group relative flex aspect-[5/6] flex-col justify-between rounded-3xl p-7 transition-transform hover:-translate-y-1 ${s.card}`}
    >
      <div className="text-[28px] leading-none">{icon}</div>

      <div>
        <h3 className={`text-[18px] font-semibold leading-snug ${s.title}`}>
          {title}
        </h3>
        <p className={`mt-2 text-[13px] leading-relaxed ${s.body}`}>{description}</p>
        <ArrowRight
          className={`mt-5 h-5 w-5 transition-transform group-hover:translate-x-1 ${s.arrow}`}
        />
      </div>
    </Link>
  );
}
