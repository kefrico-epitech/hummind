"use client";

import * as React from "react";

type KpiItem = { label: string; value: number };

function KpiCard({ label, value }: KpiItem) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/4 p-4 sm:rounded-2xl sm:p-6">
      <p className="text-xs tracking-wide text-white/40">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white sm:mt-3 sm:text-3xl">
        {value}
      </p>
    </div>
  );
}

export function KpiGrid({ items }: { items: KpiItem[] }) {
  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:gap-6">
      {items.map((k) => (
        <KpiCard key={k.label} label={k.label} value={k.value} />
      ))}
    </section>
  );
}
