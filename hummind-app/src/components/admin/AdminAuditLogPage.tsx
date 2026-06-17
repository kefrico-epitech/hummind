"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { useAppSelector } from "../../store/hooks";
import {
  AdminService,
  type AuditLogEntry,
} from "../../services/admin.service";
import { toast } from "../../lib/notify";

const ACTION_LABELS: Record<string, string> = {
  CONTACT_ACCEPTED: "Contact accepté",
  CONTACT_CONTACTED: "Contact marqué comme contacté",
  CONTACT_REJECTED: "Contact refusé",
  CONTACT_ARCHIVED: "Contact archivé",
  USER_CREATED_BY_ROOT: "Compte créé par ROOT",
  USER_CREATED_BY_ADMIN: "Compte créé par admin org",
  USER_BANNED: "Utilisateur banni",
  USER_DISABLED: "Utilisateur désactivé",
  USER_REACTIVATED: "Utilisateur réactivé",
  USER_ROLE_CHANGED: "Rôle modifié",
  PASSWORD_RESET_BY_ADMIN: "Reset mdp par admin",
  PUBLIC_JOIN_LINK_TOGGLED: "Lien public modifié",
};

const ACTION_COLORS: Record<string, string> = {
  CONTACT_ACCEPTED: "bg-emerald-100 text-emerald-700",
  CONTACT_REJECTED: "bg-hm-coral-400/20 text-hm-coral-400",
  USER_BANNED: "bg-hm-coral-400 text-white",
  USER_DISABLED: "bg-hm-ink-500/20 text-hm-ink-500",
  USER_REACTIVATED: "bg-emerald-100 text-emerald-700",
  USER_CREATED_BY_ROOT: "bg-hm-purple-500 text-white",
  USER_CREATED_BY_ADMIN: "bg-hm-purple-300 text-hm-ink-900",
  PUBLIC_JOIN_LINK_TOGGLED: "bg-hm-bg-soft text-hm-ink-900",
};

export default function AdminAuditLogPage() {
  const router = useRouter();
  const user = useAppSelector((state) => state.user.user);

  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [actionFilter, setActionFilter] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const pageSize = 50;

  useEffect(() => {
    if (user && user.role !== "ROOT") {
      toast.error("Accès réservé aux administrateurs");
      router.replace("/");
    }
  }, [user, router]);

  const refresh = useMemo(
    () => async () => {
      setLoading(true);
      const res = await AdminService.listAuditLog({
        action: actionFilter || undefined,
        page,
        pageSize,
      });
      if (res.error) {
        toast.error(res.error);
      } else if (res.data) {
        setEntries(res.data.data);
        setTotal(res.data.meta.total);
      }
      setLoading(false);
    },
    [actionFilter, page],
  );

  useEffect(() => {
    if (user?.role === "ROOT") refresh();
  }, [user?.role, refresh]);

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
              Audit log
            </h1>
          </div>
          <nav className="flex items-center gap-4 text-[13px] text-hm-ink-500">
            <Link href="/admin/contacts" className="hover:text-hm-ink-900">
              Contacts
            </Link>
            <Link href="/admin/users" className="hover:text-hm-ink-900">
              Utilisateurs
            </Link>
            <Link href="/admin/audit-log" className="font-semibold text-hm-ink-900">
              Audit log
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-[1200px] px-6 py-8">
        <div className="mb-6">
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl bg-white px-4 py-3 text-[14px] outline-none ring-1 ring-black/5"
          >
            <option value="">Toutes les actions</option>
            {Object.keys(ACTION_LABELS).map((k) => (
              <option key={k} value={k}>
                {ACTION_LABELS[k]}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-black/5">
          {loading && entries.length === 0 ? (
            <div className="px-6 py-12 text-center text-hm-ink-500">Chargement...</div>
          ) : entries.length === 0 ? (
            <div className="px-6 py-12 text-center text-hm-ink-500">
              Aucune entrée d'audit pour ces filtres.
            </div>
          ) : (
            <ol className="divide-y divide-black/5">
              {entries.map((entry) => (
                <li key={entry.id} className="px-6 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                            ACTION_COLORS[entry.action] ??
                            "bg-hm-bg-soft text-hm-ink-900"
                          }`}
                        >
                          {ACTION_LABELS[entry.action] ?? entry.action}
                        </span>
                        {entry.targetType && (
                          <span className="rounded-full bg-hm-bg-soft px-2 py-0.5 text-[10px] font-medium text-hm-ink-500">
                            {entry.targetType}: {entry.targetId?.slice(0, 8)}...
                          </span>
                        )}
                      </div>
                      <div className="mt-2 text-[13px] text-hm-ink-900">
                        {entry.actor ? (
                          <>
                            <span className="font-medium">
                              {entry.actor.firstname} {entry.actor.lastname}
                            </span>{" "}
                            <span className="text-hm-ink-500">
                              ({entry.actor.email})
                            </span>
                          </>
                        ) : (
                          <span className="text-hm-ink-500">Système</span>
                        )}
                      </div>
                      {entry.payload && Object.keys(entry.payload as object).length > 0 && (
                        <pre className="mt-2 overflow-x-auto rounded-lg bg-hm-bg-soft px-3 py-2 text-[11px] text-hm-ink-500">
                          {JSON.stringify(entry.payload, null, 2)}
                        </pre>
                      )}
                    </div>
                    <span className="shrink-0 text-[12px] text-hm-ink-500">
                      {new Date(entry.createdAt).toLocaleString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>

        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between text-[13px] text-hm-ink-500">
            <span>
              {total} entrée{total > 1 ? "s" : ""} — page {page}/{totalPages}
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
    </main>
  );
}
