"use client";

import React, { useRef } from "react";

type Props = {
  value: string;
  placeholder?: string;
  selected: boolean;
  onChange: (next: string) => void;
};

export function TitleBlockEditor({
  value,
  placeholder = "Titre (ex: Chapitre 1 - Introduction)",
  selected,
  onChange,
}: Props) {
  const ref = useRef<HTMLInputElement | null>(null);

  return (
    <input
      ref={ref}
      value={value ?? ""}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className={[
        "w-full rounded-xl border bg-transparent px-4 py-3",
        "text-base font-semibold text-white outline-none transition",
        selected
          ? "border-[#7C6BF5]/70 ring-4 ring-[#7C6BF5]/15 bg-black/20"
          : "border-transparent hover:border-white/10 hover:bg-black/10",
        "placeholder:text-white/30",
      ].join(" ")}
      onClick={(event) => event.stopPropagation()}
    />
  );
}
