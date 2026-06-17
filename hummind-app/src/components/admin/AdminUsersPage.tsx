"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, ShieldCheck, Ban, PauseCircle, PlayCircle } from "lucide-react";
import { useAppSelector } from "../../store/hooks";
import {
  AdminService,
  type AdminPlatformRole,
  type AdminUser,
  type AdminUserStatus,
} from "../../services/admin.service";
import { toast } from "../../lib/notify";

const STATUS_LABELS: Record<AdminUserStatus, string> = {
  INVITED: "Invité",
  ACTIVE: "Actif",
  DISABLED: "Désactivé",
  BANNED: "Banni",
};

const STATUS_COLORS: Record<AdminUserStatus, string> = {
  INVITED: "bg-hm-purple-300 text-hm-ink-900",
  ACTIVE: "bg-hm-mint-300 text-hm-ink-900",
  DISABLED: "bg-hm-ink-500/30 text-hm-ink-900",
  BANNED: "bg-hm-coral-400 text-white",
};

export default function AdminUsersPage() {
  const router = useRouter();
  const user = useAppSelector((state) => state.user.user);

  const [statusFilter, setStatusFilter] = useState<AdminUserStatus | "">("");
  const [roleFilter, setRoleFilter] = useState<AdminPlatformRole | "">("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const pageSize = 25;

  useEffect(() => {
    if (user && user.role !== "ROOT") {
      toast.error("Accès réservé aux administrateurs");
      router.replace("/");
    }
  }, [user, router]);

  const refresh = useMemo(
    () => async () => {
      setLoading(true);
      const res = await AdminService.listUsers({
        status: statusFilter || undefined,
        platformRole: roleFilter || undefined,
        search,
        page,
        pageSize,
      });
      if (res.error) {
        toast.error(res.error);
      } else if (res.data) {
        setUsers(res.data.data);
        setTotal(res.data.meta.total);
      }
      setLoading(false);
    },
    [statusFilter, roleFilter, search, page],
  );

  useEffect(() => {
    if (user?.role === "ROOT") refresh();
  }, [user?.role, refresh]);

  const onUpdateStatus = async (id: string, status: AdminUserStatus) => {
    if (id === user?.id) {
      toast.error("Impossible de modifier votre propre statut");
      return;
    }
    const res = await AdminService.updateUserStatus(id, status);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success(`Statut → ${STATUS_LABELS[status]}`);
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
              Utilisateurs
            </h1>
          </div>
          <nav className="flex items-center gap-4 text-[13px] text-hm-ink-500">
            <Link href="/admin/contacts" className="hover:text-hm-ink-900">
              Contacts
            </Link>
            <Link href="/admin/users" className="font-semibold text-hm-ink-900">
              Utilisateurs
            </Link>
            <Link href="/admin/audit-log" className="hover:text-hm-ink-900">
              Audit log
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-[1200px] px-6 py-8">
        {/* Filtres */}
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-hm-ink-400" />
            <input
              type="text"
              placeholder="Rechercher email, nom..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl bg-white py-3 pl-10 pr-4 text-[14px] outline-none ring-1 ring-black/5 focus:ring-2 focus:ring-hm-purple-300"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as AdminUserStatus | "");
              setPage(1);
            }}
            className="rounded-xl bg-white px-4 py-3 text-[14px] outline-none ring-1 ring-black/5"
          >
            <option value="">Tous les statuts</option>
            <option value="INVITED">Invité</option>
            <option value="ACTIVE">Actif</option>
            <option value="DISABLED">Désactivé</option>
            <option value="BANNED">Banni</option>
          </select>
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value as AdminPlatformRole | "");
              setPage(1);
            }}
            className="rounded-xl bg-white px-4 py-3 text-[14px] outline-none ring-1 ring-black/5"
          >
            <option value="">Tous les rôles</option>
            <option value="ROOT">ROOT</option>
            <option value="MEMBER">MEMBER</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-black/5">
          <table className="w-full text-[13px]">
            <thead className="bg-hm-bg-soft text-[11px] font-semibold uppercase tracking-wide text-hm-ink-500">
              <tr>
                <th className="px-4 py-3 text-left">Utilisateur</th>
                <th className="px-4 py-3 text-left">Rôle</th>
                <th className="px-4 py-3 text-left">Statut</th>
                <th className="px-4 py-3 text-left">Créé le</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-hm-ink-500">
                    Chargement...
                  </td>
                </tr>
              )}
              {!loading && users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-hm-ink-500">
                    Aucun utilisateur pour ces filtres.
                  </td>
                </tr>
              )}
              {users.map((u) => (
                <tr
                  key={u.id}
                  className="border-t border-black/5 hover:bg-hm-purple-50/40"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-hm-ink-900">
                      {u.firstname} {u.lastname}
                    </div>
                    <div className="text-hm-ink-500">{u.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                        u.platformRole === "ROOT"
                          ? "bg-hm-purple-500 text-white"
                          : "bg-hm-bg-soft text-hm-ink-900"
                      }`}
                    >
                      {u.platformRole}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold ${STATUS_COLORS[u.status]}`}
                    >
                      {STATUS_LABELS[u.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-hm-ink-500">
                    {new Date(u.createdAt).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {u.id === user.id ? (
                      <span className="text-[12px] text-hm-ink-400">vous</span>
                    ) : (
                      <div className="flex justify-end gap-2">
                        {u.status !== "ACTIVE" && (
                          <ActionIcon
                            label="Réactiver"
                            onClick={() => onUpdateStatus(u.id, "ACTIVE")}
                            color="emerald"
                          >
                            <PlayCircle className="h-4 w-4" />
                          </ActionIcon>
                        )}
                        {u.status !== "DISABLED" && (
                          <ActionIcon
                            label="Désactiver"
                            onClick={() => onUpdateStatus(u.id, "DISABLED")}
                            color="grey"
                          >
                            <PauseCircle className="h-4 w-4" />
                          </ActionIcon>
                        )}
                        {u.status !== "BANNED" && (
                          <ActionIcon
                            label="Bannir"
                            onClick={() => {
                              if (
                                confirm(
                                  `Bannir définitivement ${u.email} ? Cette action est tracée dans l'audit log.`,
                                )
                              ) {
                                onUpdateStatus(u.id, "BANNED");
                              }
                            }}
                            color="coral"
                          >
                            <Ban className="h-4 w-4" />
                          </ActionIcon>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between text-[13px] text-hm-ink-500">
            <span>
              {total} utilisateur{total > 1 ? "s" : ""} — page {page}/{totalPages}
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

function ActionIcon({
  label,
  onClick,
  children,
  color,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  color: "emerald" | "grey" | "coral";
}) {
  const colors: Record<typeof color, string> = {
    emerald: "text-emerald-600 hover:bg-emerald-50",
    grey: "text-hm-ink-500 hover:bg-black/5",
    coral: "text-hm-coral-400 hover:bg-orange-50",
  };
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${colors[color]}`}
    >
      {children}
    </button>
  );
}
