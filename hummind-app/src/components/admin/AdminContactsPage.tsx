"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ShieldCheck } from "lucide-react";
import { useAppSelector } from "../../store/hooks";
import {
  AdminService,
  type AdminContact,
  type ContactKindServer,
  type ContactStatus,
  type ContactStats,
} from "../../services/admin.service";
import { toast } from "../../lib/notify";
import { ContactDetailDrawer, type RootAction } from "./ContactDetailDrawer";

const STATUS_LABELS: Record<ContactStatus, string> = {
  NEW: "Nouveau",
  CONTACTED: "Contacté",
  ACCEPTED: "Accepté",
  REJECTED: "Refusé",
  ARCHIVED: "Archivé",
};

const KIND_LABELS: Record<ContactKindServer, string> = {
  DEMO: "Démo",
  SUPPORT: "Support",
  GENERAL: "Général",
};

const STATUS_COLORS: Record<ContactStatus, string> = {
  NEW: "bg-hm-coral-400 text-white",
  CONTACTED: "bg-hm-purple-400 text-white",
  ACCEPTED: "bg-hm-mint-300 text-hm-ink-900",
  REJECTED: "bg-hm-ink-500/30 text-hm-ink-900",
  ARCHIVED: "bg-hm-ink-500/20 text-hm-ink-500",
};

export default function AdminContactsPage() {
  const router = useRouter();
  const user = useAppSelector((state) => state.user.user);
  const [statusFilter, setStatusFilter] = useState<ContactStatus | "">("");
  const [kindFilter, setKindFilter] = useState<ContactKindServer | "">("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [contacts, setContacts] = useState<AdminContact[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<ContactStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<AdminContact | null>(null);

  const pageSize = 20;

  // Guard: only ADMIN can see this page
  useEffect(() => {
    if (user && user.role !== "ROOT") {
      toast.error("Accès réservé aux administrateurs");
      router.replace("/");
    }
  }, [user, router]);

  const refresh = useMemo(
    () => async () => {
      setLoading(true);
      const [listRes, statsRes] = await Promise.all([
        AdminService.listContacts({
          status: statusFilter || undefined,
          kind: kindFilter || undefined,
          search,
          page,
          pageSize,
        }),
        AdminService.stats(),
      ]);
      if (listRes.error) {
        toast.error(listRes.error);
      } else if (listRes.data) {
        setContacts(listRes.data.data);
        setTotal(listRes.data.meta.total);
      }
      if (statsRes.data) setStats(statsRes.data);
      setLoading(false);
    },
    [statusFilter, kindFilter, search, page],
  );

  useEffect(() => {
    if (user?.role === "ROOT") refresh();
  }, [user?.role, refresh]);

  const onAction = async (id: string, action: RootAction) => {
    let err: string | null = null;
    let toastLabel = "";
    let nextContact: AdminContact | null = null;

    if (action === "accept") {
      const res = await AdminService.acceptContact(id);
      err = res.error;
      if (res.data) {
        nextContact = res.data.contact;
        toastLabel = `Compte créé pour ${res.data.user.email}`;
      }
    } else if (action === "contact") {
      const res = await AdminService.markContacted(id);
      err = res.error;
      nextContact = res.data;
      toastLabel = "Statut → Contacté";
    } else if (action === "reject") {
      const res = await AdminService.rejectContact(id);
      err = res.error;
      nextContact = res.data;
      toastLabel = "Demande refusée (email envoyé)";
    } else {
      // archive — passe par le PATCH générique
      const res = await AdminService.updateStatus(id, "ARCHIVED");
      err = res.error;
      nextContact = res.data;
      toastLabel = "Contact archivé";
    }

    if (err) {
      toast.error(err);
      return;
    }
    toast.success(toastLabel);
    setSelected(nextContact);
    refresh();
  };

  if (!user) {
    return (
      <main className="grid min-h-screen place-items-center">
        <div className="text-hm-ink-500">Chargement...</div>
      </main>
    );
  }

  if (user.role !== "ROOT") return null;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <main className="min-h-screen bg-hm-bg-soft">
      <header className="border-b border-black/5 bg-white">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-hm-purple-500" />
            <h1 className="text-[18px] font-semibold tracking-tight text-hm-ink-900">
              Espace administrateur
            </h1>
          </div>
          <div className="text-[13px] text-hm-ink-500">
            Connecté en tant que{" "}
            <span className="font-medium text-hm-ink-900">{user.email}</span>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1200px] px-6 py-8">
        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(["NEW", "CONTACTED", "ACCEPTED", "REJECTED"] as ContactStatus[]).map(
            (s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setStatusFilter(statusFilter === s ? "" : s);
                  setPage(1);
                }}
                className={`rounded-2xl bg-white p-4 text-left ring-1 transition-shadow hover:shadow-sm ${
                  statusFilter === s
                    ? "ring-hm-purple-400"
                    : "ring-black/5"
                }`}
              >
                <div className="text-[11px] font-semibold uppercase tracking-wide text-hm-ink-500">
                  {STATUS_LABELS[s]}
                </div>
                <div className="mt-1 text-[24px] font-bold text-hm-ink-900">
                  {stats?.[s] ?? "—"}
                </div>
              </button>
            ),
          )}
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-hm-ink-400" />
            <input
              type="text"
              placeholder="Rechercher email, nom, organisation..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl bg-white py-3 pl-10 pr-4 text-[14px] outline-none ring-1 ring-black/5 focus:ring-2 focus:ring-hm-purple-300"
            />
          </div>
          <select
            value={kindFilter}
            onChange={(e) => {
              setKindFilter(e.target.value as ContactKindServer | "");
              setPage(1);
            }}
            className="rounded-xl bg-white px-4 py-3 text-[14px] outline-none ring-1 ring-black/5 focus:ring-2 focus:ring-hm-purple-300"
          >
            <option value="">Tous les types</option>
            <option value="DEMO">Démo</option>
            <option value="SUPPORT">Support</option>
            <option value="GENERAL">Général</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-black/5">
          <table className="w-full text-[13px]">
            <thead className="bg-hm-bg-soft text-[11px] font-semibold uppercase tracking-wide text-hm-ink-500">
              <tr>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Contact</th>
                <th className="px-4 py-3 text-left">Organisation</th>
                <th className="px-4 py-3 text-left">Statut</th>
              </tr>
            </thead>
            <tbody>
              {loading && contacts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-hm-ink-500">
                    Chargement...
                  </td>
                </tr>
              )}
              {!loading && contacts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-hm-ink-500">
                    Aucun contact pour ces filtres.
                  </td>
                </tr>
              )}
              {contacts.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => setSelected(c)}
                  className="cursor-pointer border-t border-black/5 transition-colors hover:bg-hm-purple-50/50"
                >
                  <td className="px-4 py-3 text-hm-ink-500">
                    {new Date(c.createdAt).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-hm-bg-soft px-2 py-1 text-[11px] font-medium text-hm-ink-900">
                      {KIND_LABELS[c.kind]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-hm-ink-900">{c.name ?? "—"}</div>
                    <div className="text-hm-ink-500">{c.email}</div>
                  </td>
                  <td className="px-4 py-3 text-hm-ink-900">
                    {c.organizationName ?? <span className="text-hm-ink-400">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold ${STATUS_COLORS[c.status]}`}
                    >
                      {STATUS_LABELS[c.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between text-[13px] text-hm-ink-500">
            <span>
              {total} contact{total > 1 ? "s" : ""} — page {page} / {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="rounded-full bg-white px-4 py-2 text-[12px] font-medium ring-1 ring-black/5 disabled:opacity-40"
              >
                Précédent
              </button>
              <button
                type="button"
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="rounded-full bg-white px-4 py-2 text-[12px] font-medium ring-1 ring-black/5 disabled:opacity-40"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </section>

      <ContactDetailDrawer
        contact={selected}
        onClose={() => setSelected(null)}
        onAction={onAction}
      />
    </main>
  );
}
