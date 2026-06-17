"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  AlertTriangle,
  Bell,
  BellOff,
  BookOpen,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Filter,
  Loader2,
  RefreshCw,
  Settings2,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { toast } from "../../../../src/lib/notify";
import { Button } from "../../../../src/components/ui/button";
import { cn } from "../../../../src/lib/utils";
import {
  emitNotificationsUpdated,
  NotificationService,
  type NotificationCounts,
  type NotificationItem,
  type NotificationQuery,
} from "../../../../src/services/notification.service";

const PAGE_SIZE = 20;

function formatNotificationType(type: string) {
  const normalized = String(type || "").trim();
  if (!normalized) return "Notification";
  return normalized
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getNotificationPresentation(type: string) {
  const n = String(type || "").toLowerCase();
  if (n.includes("course") || n.includes("lesson") || n.includes("module"))
    return { icon: BookOpen, accent: "text-indigo-400", bg: "bg-indigo-500/12", dot: "bg-indigo-400" };
  if (n.includes("access") || n.includes("invite") || n.includes("join") || n.includes("member"))
    return { icon: ShieldCheck, accent: "text-emerald-400", bg: "bg-emerald-500/12", dot: "bg-emerald-400" };
  if (n.includes("alert") || n.includes("error") || n.includes("ban") || n.includes("warning"))
    return { icon: AlertTriangle, accent: "text-amber-400", bg: "bg-amber-500/12", dot: "bg-amber-400" };
  if (n.includes("system") || n.includes("security"))
    return { icon: Settings2, accent: "text-sky-400", bg: "bg-sky-500/12", dot: "bg-sky-400" };
  return { icon: Bell, accent: "text-white/60", bg: "bg-white/8", dot: "bg-white/40" };
}

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return formatDistanceToNow(d, { addSuffix: true, locale: fr });
}

function getHref(n: NotificationItem) {
  const data = n.data as Record<string, unknown> | null;
  const href = data?.href;
  return typeof href === "string" && href.startsWith("/") ? href : null;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [counts, setCounts] = useState<NotificationCounts>({ total: 0, unread: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [page, setPage] = useState(1);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [meta, setMeta] = useState({ page: 1, pageSize: PAGE_SIZE, total: 0 });

  useEffect(() => { setPage(1); }, [showUnreadOnly]);

  const listQuery = useMemo<NotificationQuery>(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      sort: "createdAt:desc",
      ...(showUnreadOnly ? { unread: true } : {}),
    }),
    [page, showUnreadOnly],
  );

  const refresh = useCallback(
    async (mode: "init" | "silent" = "init") => {
      if (mode === "init") setLoading(true);
      else setRefreshing(true);
      try {
        const [listRes, countsRes] = await Promise.all([
          NotificationService.list(listQuery),
          NotificationService.counts(),
        ]);
        if (listRes.data) {
          setNotifications(listRes.data.data ?? []);
          setMeta(listRes.data.meta ?? { page, pageSize: PAGE_SIZE, total: 0 });
        }
        if (countsRes.data) setCounts(countsRes.data);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [listQuery, page],
  );

  useEffect(() => { void refresh("init"); }, [refresh]);

  const totalPages = Math.max(1, Math.ceil(meta.total / PAGE_SIZE));
  const readCount = Math.max(counts.total - counts.unread, 0);

  const toggleRead = useCallback(async (n: NotificationItem) => {
    setBusyId(n.id);
    try {
      await NotificationService.markRead(n.id, n.readAt ? null : undefined);
      emitNotificationsUpdated();
      await refresh("silent");
    } catch {
      toast.error("Erreur lors de la mise à jour");
    } finally { setBusyId(null); }
  }, [refresh]);

  const markAllRead = useCallback(async () => {
    if (counts.unread <= 0) return;
    setMarkingAll(true);
    try {
      const res = await NotificationService.markAllRead();
      toast.success(res.data?.count ? `${res.data.count} notification(s) marquée(s)` : "Tout marqué comme lu");
      emitNotificationsUpdated();
      await refresh("silent");
    } catch {
      toast.error("Erreur");
    } finally { setMarkingAll(false); }
  }, [counts.unread, refresh]);

  const deleteNotif = useCallback(async (id: string) => {
    setBusyId(id);
    try {
      await NotificationService.delete(id);
      toast.success("Supprimée");
      emitNotificationsUpdated();
      if (notifications.length === 1 && page > 1) setPage((p) => p - 1);
      else await refresh("silent");
    } catch {
      toast.error("Erreur");
    } finally { setBusyId(null); }
  }, [notifications.length, page, refresh]);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      {/* ─── Header ─── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {counts.unread > 0
              ? `${counts.unread} non lue${counts.unread > 1 ? "s" : ""}`
              : "Tout est à jour"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowUnreadOnly((v) => !v)}
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-xs font-medium transition",
              showUnreadOnly
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border bg-white/2 text-muted-foreground hover:bg-secondary",
            )}
          >
            <Filter className="h-3.5 w-3.5" />
            {showUnreadOnly ? "Non lues" : "Toutes"}
          </button>

          <button
            type="button"
            onClick={() => void refresh("silent")}
            disabled={refreshing}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white/2 text-muted-foreground transition hover:bg-secondary disabled:opacity-50"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
          </button>

          {counts.unread > 0 && (
            <Button
              size="sm"
              className="h-9 rounded-full text-xs"
              onClick={() => void markAllRead()}
              disabled={markingAll}
              loading={markingAll}
            >
              <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
              Tout marquer lu
            </Button>
          )}
        </div>
      </div>

      {/* ─── Stats cards ─── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-white/2 p-3.5">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Total</p>
          <p className="mt-1 text-2xl font-bold">{counts.total}</p>
        </div>
        <div className="rounded-xl border border-border bg-white/2 p-3.5">
          <p className="text-[11px] font-medium uppercase tracking-wide text-amber-400/80">Non lues</p>
          <p className="mt-1 text-2xl font-bold text-amber-400">{counts.unread}</p>
        </div>
        <div className="rounded-xl border border-border bg-white/2 p-3.5">
          <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-400/80">Lues</p>
          <p className="mt-1 text-2xl font-bold text-emerald-400">{readCount}</p>
        </div>
      </div>

      {/* ─── List ─── */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl border border-border bg-white/2" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-white/2 py-16">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <BellOff className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="font-medium">Aucune notification</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {showUnreadOnly ? "Toutes vos notifications ont été lues." : "Vous n'avez pas encore de notifications."}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const pres = getNotificationPresentation(n.type);
            const Icon = pres.icon;
            const href = getHref(n);
            const unread = !n.readAt;
            const busy = busyId === n.id;

            return (
              <div
                key={n.id}
                className={cn(
                  "group relative flex items-start gap-3 rounded-xl border p-4 transition",
                  unread
                    ? "border-border bg-white/2 shadow-sm"
                    : "border-transparent bg-transparent hover:bg-white/4",
                )}
              >
                {/* Unread dot */}
                {unread && (
                  <span className={cn("absolute left-1.5 top-1.5 h-2 w-2 rounded-full", pres.dot)} />
                )}

                {/* Icon */}
                <div className={cn("mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full", pres.bg)}>
                  <Icon className={cn("h-4 w-4", pres.accent)} />
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className={cn("text-sm font-medium", unread ? "text-foreground" : "text-muted-foreground")}>
                        {n.title}
                      </p>
                      {n.message && (
                        <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">{n.message}</p>
                      )}
                    </div>

                    {/* Actions — visible on hover */}
                    <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => void toggleRead(n)}
                        disabled={busy}
                        title={unread ? "Marquer comme lu" : "Marquer non lu"}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:opacity-50"
                      >
                        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCheck className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteNotif(n.id)}
                        disabled={busy}
                        title="Supprimer"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Meta row */}
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground/70">
                    <span>{formatDate(n.createdAt)}</span>
                    <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                    <span className={cn("font-medium", pres.accent)}>{formatNotificationType(n.type)}</span>
                    {href && (
                      <>
                        <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                        <Link href={href} className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
                          Ouvrir <ExternalLink className="h-3 w-3" />
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Pagination ─── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between rounded-xl border border-border bg-white/2 px-4 py-3">
          <p className="text-xs text-muted-foreground">
            Page {page}/{totalPages} · {meta.total} notification{meta.total > 1 ? "s" : ""}
          </p>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:bg-secondary disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:bg-secondary disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
