"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Copy,
  ExternalLink,
  Loader2,
  PlusCircle,
  Power,
  PowerOff,
  Trash2,
  Users,
} from "lucide-react";
import {
  JoinLinkService,
  type PublicJoinLink,
} from "../../services/join.service";
import { toast } from "../../lib/notify";

interface Props {
  entityId: string;
  entityName: string;
}

export function PublicJoinLinksSection({ entityId, entityName }: Props) {
  const [links, setLinks] = useState<PublicJoinLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const res = await JoinLinkService.list(entityId);
    if (res.error) {
      toast.error(res.error);
    } else if (res.data) {
      setLinks(res.data);
    }
    setLoading(false);
  }, [entityId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const onCreate = async () => {
    setCreating(true);
    const res = await JoinLinkService.create({ entityId });
    if (res.error) {
      toast.error(res.error);
    } else if (res.data) {
      toast.success("Lien public créé");
      setLinks((prev) => [res.data!, ...prev]);
    }
    setCreating(false);
  };

  const onToggle = async (link: PublicJoinLink) => {
    const res = await JoinLinkService.update(link.id, {
      enabled: !link.enabled,
    });
    if (res.error) {
      toast.error(res.error);
      return;
    }
    if (res.data) {
      setLinks((prev) => prev.map((l) => (l.id === link.id ? res.data! : l)));
      toast.success(link.enabled ? "Lien désactivé" : "Lien activé");
    }
  };

  const onDelete = async (link: PublicJoinLink) => {
    if (!confirm("Supprimer définitivement ce lien public ?")) return;
    const res = await JoinLinkService.remove(link.id);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    setLinks((prev) => prev.filter((l) => l.id !== link.id));
    toast.success("Lien supprimé");
  };

  const buildShareUrl = (code: string): string => {
    if (typeof window === "undefined") return `/join/${code}`;
    return `${window.location.origin}/join/${code}`;
  };

  const copyUrl = async (code: string) => {
    try {
      await navigator.clipboard.writeText(buildShareUrl(code));
      toast.success("Lien copié");
    } catch {
      toast.error("Impossible de copier le lien");
    }
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-medium text-foreground/90">
            Lien public d'inscription
          </h2>
          <p className="mt-1 text-xs text-foreground/60">
            Partage ce lien (WhatsApp, email, affichage) pour que les
            apprenants rejoignent <span className="font-medium">{entityName}</span>{" "}
            directement.
          </p>
        </div>
        <button
          type="button"
          onClick={onCreate}
          disabled={creating}
          className="inline-flex items-center gap-2 self-start rounded-full bg-primary px-4 py-2 text-xs font-semibold text-sidebar hover:bg-primary/80 disabled:opacity-50 sm:self-auto"
        >
          {creating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <PlusCircle className="h-3.5 w-3.5" />
          )}
          Créer un lien
        </button>
      </header>

      <div className="mt-4">
        {loading && links.length === 0 ? (
          <div className="py-10 text-center text-xs text-foreground/50">
            Chargement...
          </div>
        ) : links.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-xs text-foreground/60">
            Aucun lien public pour cette salle. Crées-en un pour permettre
            l'auto-inscription des apprenants.
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {links.map((link) => {
              const url = buildShareUrl(link.code);
              return (
                <li
                  key={link.id}
                  className={`rounded-xl border p-4 transition-colors ${
                    link.enabled
                      ? "border-white/10 bg-white/5"
                      : "border-white/5 bg-white/[0.02] opacity-70"
                  }`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <code className="rounded-md bg-black/30 px-2 py-1 font-mono text-[12px] text-foreground/90">
                          {link.code}
                        </code>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            link.enabled
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-white/10 text-foreground/60"
                          }`}
                        >
                          {link.enabled ? "Actif" : "Désactivé"}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-2 truncate text-[11px] text-foreground/60">
                        <ExternalLink className="h-3 w-3 shrink-0" />
                        <span className="truncate">{url}</span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-foreground/50">
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {link.usedCount} inscrit
                          {link.usedCount > 1 ? "s" : ""}
                          {link.maxUses ? ` / ${link.maxUses}` : ""}
                        </span>
                        {link.expiresAt && (
                          <span>
                            Expire le{" "}
                            {new Date(link.expiresAt).toLocaleDateString(
                              "fr-FR",
                            )}
                          </span>
                        )}
                        <span>
                          Créé le{" "}
                          {new Date(link.createdAt).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <IconButton
                        title="Copier le lien"
                        onClick={() => copyUrl(link.code)}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </IconButton>
                      <IconButton
                        title={link.enabled ? "Désactiver" : "Activer"}
                        onClick={() => onToggle(link)}
                      >
                        {link.enabled ? (
                          <PowerOff className="h-3.5 w-3.5" />
                        ) : (
                          <Power className="h-3.5 w-3.5" />
                        )}
                      </IconButton>
                      <IconButton
                        title="Supprimer"
                        onClick={() => onDelete(link)}
                        danger
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </IconButton>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

function IconButton({
  title,
  onClick,
  danger,
  children,
}: {
  title: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ring-1 ring-white/10 transition-colors ${
        danger
          ? "text-red-300 hover:bg-red-500/20"
          : "text-foreground/80 hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}
