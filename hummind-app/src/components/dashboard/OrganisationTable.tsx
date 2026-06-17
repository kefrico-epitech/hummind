"use client";

import * as React from "react";

export type DeptRow = {
  id: string;
  organisation: string;
  departments: number;
  rooms: number;
  participants: number;
  courses: number;
};

function format2(n: number) {
  return String(n);
}

export function OrganisationTable({ rows }: { rows: DeptRow[] }) {
  return (
    <section className="w-full rounded-4xl border border-white/10 bg-[#26282d] p-3 shadow-[0_30px_80px_-50px_rgba(0,0,0,0.8)] sm:p-5">
      <div className="space-y-2.5 sm:hidden">
        {rows.map((r) => (
          <article
            key={r.id}
            className="rounded-2xl border border-white/10 bg-[#2d2f35] p-3 text-white/85"
          >
            <p className="truncate text-sm font-semibold text-white">{r.organisation}</p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl bg-white/5 p-2">
                <p className="text-white/55">Departements</p>
                <p className="mt-0.5 tabular-nums">{format2(r.departments)}</p>
              </div>
              <div className="rounded-xl bg-white/5 p-2">
                <p className="text-white/55">Salles</p>
                <p className="mt-0.5 tabular-nums">{format2(r.rooms)}</p>
              </div>
              <div className="rounded-xl bg-white/5 p-2">
                <p className="text-white/55">Participants</p>
                <p className="mt-0.5 tabular-nums">{format2(r.participants)}</p>
              </div>
              <div className="rounded-xl bg-white/5 p-2">
                <p className="text-white/55">Cours</p>
                <p className="mt-0.5 tabular-nums">{format2(r.courses)}</p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="hidden sm:block">
        <table className="w-full border-separate border-spacing-y-0 text-sm md:text-[15px]">
          <thead>
            <tr className="text-white/90">
              <th className="rounded-l-full bg-[#34363c] px-5 py-4 text-left font-semibold">
                Organisation
              </th>
              <th className="border-y border-white/10 bg-[#34363c] px-5 py-4 text-left font-semibold">
                Departements
              </th>
              <th className="border-y border-white/10 bg-[#34363c] px-5 py-4 text-center font-semibold">
                Salles
              </th>
              <th className="border-y border-white/10 bg-[#34363c] px-5 py-4 text-center font-semibold">
                Participants
              </th>
              <th className="rounded-r-full  bg-[#34363c] px-5 py-4 text-center font-semibold">
                Cours
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={r.id} className="text-white/80">
                <td
                  className={`truncate px-5 py-5 font-medium text-white/85 ${idx !== rows.length - 1 ? "border-b border-white/30" : ""}`}
                >
                  {r.organisation}
                </td>
                <td
                  className={`truncate px-5 py-5 text-white/75 ${idx !== rows.length - 1 ? "border-b border-white/30" : ""}`}
                >
                  {format2(r.departments)}
                </td>
                <td
                  className={`px-5 py-5 text-center tabular-nums text-white/75 ${idx !== rows.length - 1 ? "border-b border-white/30" : ""}`}
                >
                  {format2(r.rooms)}
                </td>
                <td
                  className={`px-5 py-5 text-center tabular-nums text-white/75 ${idx !== rows.length - 1 ? "border-b border-white/30" : ""}`}
                >
                  {format2(r.participants)}
                </td>
                <td
                  className={`px-5 py-5 text-center tabular-nums text-white/75 ${idx !== rows.length - 1 ? "border-b border-white/30" : ""}`}
                >
                  {format2(r.courses)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
