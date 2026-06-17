"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "../../../lib/notify";
import { EntityService } from "../../../services/entity.service";
import { MinusCircle, RotateCcw, X } from "lucide-react";
import type { Member } from "../../../dto/usersdto";

interface ParticipantData {
  id: string;
  role: string;
  status: "ACTIVE" | "BANNED";
  banReason?: string | null;
  user: {
    firstname: string;
    lastname: string;
    email: string;
  };
}

interface SalleParticipantProps {
  entityId: string;
  query?: string;
}

function getParticipantName(participant: ParticipantData) {
  return `${participant.user.firstname} ${participant.user.lastname}`.trim();
}

function toParticipantData(
  members: Member[] | null,
  status: ParticipantData["status"],
): ParticipantData[] {
  if (!Array.isArray(members)) return [];

  return members.map((member) => {
    const rawUser =
      member.user && typeof member.user === "object"
        ? (member.user as Record<string, unknown>)
        : {};

    return {
      id: member.id,
      role: member.role,
      status,
      banReason:
        typeof rawUser.banReason === "string" ? rawUser.banReason : null,
      user: {
        firstname:
          typeof rawUser.firstname === "string" ? rawUser.firstname : "",
        lastname: typeof rawUser.lastname === "string" ? rawUser.lastname : "",
        email:
          typeof rawUser.email === "string"
            ? rawUser.email
            : typeof member.email === "string"
              ? member.email
              : "",
      },
    };
  });
}

export default function SalleParticipant({
  entityId,
  query = "",
}: SalleParticipantProps) {
  const [participants, setParticipants] = useState<ParticipantData[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMemberId, setActionMemberId] = useState<string | null>(null);

  const fetchParticipants = useCallback(async () => {
    setLoading(true);
    try {
      const [activeResponse, bannedResponse] = await Promise.all([
        EntityService.listMembers(entityId, "ACTIVE"),
        EntityService.listMembers(entityId, "BANNED"),
      ]);
      const activeParticipants = toParticipantData(activeResponse.data, "ACTIVE");
      const bannedParticipants = toParticipantData(bannedResponse.data, "BANNED");
      setParticipants([...activeParticipants, ...bannedParticipants]);
      if (activeResponse.status !== 200 || bannedResponse.status !== 200) {
        toast.error(activeResponse.error || bannedResponse.error || "Impossible de charger les participants");
      }
    } finally {
      setLoading(false);
    }
  }, [entityId]);

  useEffect(() => {
    void fetchParticipants();
  }, [fetchParticipants]);

  const handleDelete = async (p: ParticipantData) => {
    const name = getParticipantName(p);
    if (!window.confirm(`Supprimer ${name} de cette salle ?`)) return;
    setActionMemberId(p.id);
    try {
      const res = await EntityService.deleteMember(entityId, p.id);
      if (res.status === 200 || res.status === 204) {
        toast.success(`${name} a été retiré`);
        await fetchParticipants();
      } else {
        toast.error(res.error || "Impossible de supprimer");
      }
    } finally { setActionMemberId(null); }
  };

  const handleBan = async (p: ParticipantData) => {
    const name = getParticipantName(p);
    const reason = window.prompt(`Motif du bannissement pour ${name} ?`, p.banReason ?? "");
    if (reason === null) return;
    setActionMemberId(p.id);
    try {
      const res = await EntityService.banMember(entityId, p.id, { reason: reason.trim() || undefined });
      if (res.status === 201) {
        toast.success(`${name} a été banni`);
        await fetchParticipants();
      } else {
        toast.error(res.error || "Impossible de bannir");
      }
    } finally { setActionMemberId(null); }
  };

  const handleUnban = async (p: ParticipantData) => {
    const name = getParticipantName(p);
    if (!window.confirm(`Débannir ${name} ?`)) return;
    setActionMemberId(p.id);
    try {
      const res = await EntityService.unbanMember(entityId, p.id);
      if (res.status === 201) {
        toast.success(`${name} a été débanni`);
        await fetchParticipants();
      } else {
        toast.error(res.error || "Impossible de débannir");
      }
    } finally { setActionMemberId(null); }
  };

  const queryText = query.trim().toLowerCase();

  const learners = useMemo(
    () =>
      participants
        .filter((p) => p.role === "LEARNER")
        .filter((p) => {
          if (!queryText) return true;
          const name = getParticipantName(p).toLowerCase();
          return (
            name.includes(queryText) ||
            p.user.email.toLowerCase().includes(queryText) ||
            (p.banReason ?? "").toLowerCase().includes(queryText)
          );
        }),
    [participants, queryText],
  );

  const activeCount = useMemo(() => learners.filter((p) => p.status === "ACTIVE").length, [learners]);
  const bannedCount = useMemo(() => learners.filter((p) => p.status === "BANNED").length, [learners]);

  const sorted = useMemo(
    () =>
      [...learners].sort((a, b) => {
        if (a.status !== b.status) return a.status === "ACTIVE" ? -1 : 1;
        return getParticipantName(a).localeCompare(getParticipantName(b), "fr", { sensitivity: "base" });
      }),
    [learners],
  );

  return (
    <div className="w-full">
      <h2 className="mb-4 px-1 text-base font-medium text-white/80">
        Les participants de cette salle
      </h2>

      <div className="overflow-hidden rounded-2xl border border-white/5 bg-white/2 sm:rounded-3xl">
        {/* Header */}
        <div className="flex flex-col gap-2 bg-white/2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
          <div>
            <h2 className="text-base font-semibold text-white sm:text-lg">Participants</h2>
            <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
              {sorted.length} participant{sorted.length > 1 ? "s" : ""} · {activeCount} actif{activeCount > 1 ? "s" : ""} · {bannedCount} banni{bannedCount > 1 ? "s" : ""}
            </p>
          </div>
          <span className="text-xs font-medium text-muted-foreground sm:text-sm">Modération</span>
        </div>

        {/* List */}
        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Chargement...</div>
        ) : sorted.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            {queryText ? "Aucun résultat." : "Aucun participant."}
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {sorted.map((p) => {
              const pending = actionMemberId === p.id;
              const name = getParticipantName(p);

              return (
                <div
                  key={p.id}
                  className="flex flex-col gap-3 px-4 py-3.5 transition-colors hover:bg-white/2 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4"
                >
                  {/* Info */}
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white sm:h-11 sm:w-11 sm:text-base">
                      {p.user.firstname.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-sm font-semibold text-white sm:text-base">
                          {name}
                        </span>
                        <span
                          className={[
                            "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide sm:text-[11px]",
                            p.status === "ACTIVE"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-red-500/10 text-red-400",
                          ].join(" ")}
                        >
                          {p.status === "ACTIVE" ? "Actif" : "Banni"}
                        </span>
                      </div>
                      <p className="truncate text-xs text-muted-foreground sm:text-sm">{p.user.email}</p>
                      {p.status === "BANNED" && p.banReason && (
                        <p className="mt-0.5 text-[11px] text-red-400/70">Motif : {p.banReason}</p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 gap-2 sm:gap-2.5">
                    {p.status === "ACTIVE" ? (
                      <>
                        <button
                          type="button"
                          onClick={() => void handleBan(p)}
                          disabled={pending}
                          className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 text-xs font-medium text-white transition hover:bg-white/10 disabled:opacity-50 sm:flex-none sm:px-4"
                        >
                          <MinusCircle className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="hidden sm:inline">Bannir</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(p)}
                          disabled={pending}
                          className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full bg-red-500/80 px-3 text-xs font-medium text-white transition hover:bg-red-500 disabled:opacity-50 sm:flex-none sm:px-4"
                        >
                          <X className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Supprimer</span>
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void handleUnban(p)}
                        disabled={pending}
                        className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full bg-emerald-600 px-3 text-xs font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50 sm:flex-none sm:px-4"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Débannir
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
