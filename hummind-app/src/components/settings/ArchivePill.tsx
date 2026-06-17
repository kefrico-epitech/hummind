"use client";

import * as React from "react";

export function ArchivePill({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  const base =
    "h-9 rounded-full px-4 text-xs font-medium border border-white/10 transition-colors";
  const activeStyle = "bg-primary/20 text-primary";
  const inactiveStyle =
    "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${base} ${active ? activeStyle : inactiveStyle}`}
    >
      {children}
    </button>
  );
}
