"use client";

import { useEffect, useState } from "react";
import { Archive, Check, MessageCircle, X, XCircle } from "lucide-react";
import type {
  AdminContact,
  ContactStatus,
} from "../../services/admin.service";

const STATUS_LABELS: Record<ContactStatus, string> = {
  NEW: "Nouveau",
  CONTACTED: "Contacté",
  ACCEPTED: "Accepté",
  REJECTED: "Refusé",
  ARCHIVED: "Archivé",
};

const STATUS_BADGE: Record<ContactStatus, string> = {
  NEW: "bg-hm-coral-400 text-white",
  CONTACTED: "bg-hm-purple-400 text-white",
  ACCEPTED: "bg-hm-mint-300 text-hm-ink-900",
  REJECTED: "bg-hm-ink-500/30 text-hm-ink-900",
  ARCHIVED: "bg-hm-ink-500/20 text-hm-ink-500",
};

const ORG_TYPE_LABELS: Record<string, string> = {
  SCHOOL_PRIMARY: "École primaire",
  SCHOOL_SECONDARY: "Collège / Lycée",
  UNIVERSITY: "Université",
  VOCATIONAL_CENTER: "Centre de formation pro",
  TRAINING_ORG: "Organisme de formation",
  CORPORATE: "Entreprise",
  INDEPENDENT: "Indépendant",
  OTHER: "Autre",
};

const VOLUME_LABELS: Record<string, string> = {
  UNDER_50: "< 50",
  BETWEEN_50_200: "50 à 200",
  BETWEEN_200_1000: "200 à 1 000",
  OVER_1000: "> 1 000",
};

const HORIZON_LABELS: Record<string, string> = {
  IMMEDIATE: "Immédiat",
  WITHIN_1_MONTH: "Sous 1 mois",
  WITHIN_3_MONTHS: "Sous 3 mois",
  EXPLORING: "En exploration",
};

export type RootAction = "accept" | "contact" | "reject" | "archive";

interface Props {
  contact: AdminContact | null;
  onClose: () => void;
  onAction: (id: string, action: RootAction) => Promise<void> | void;
}

export function ContactDetailDrawer({ contact, onClose, onAction }: Props) {
  const [confirming, setConfirming] = useState<RootAction | null>(null);
  const [pending, setPending] = useState<RootAction | null>(null);

  useEffect(() => {
    if (!contact) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [contact, onClose]);

  useEffect(() => {
    if (!contact) setConfirming(null);
  }, [contact]);

  if (!contact) return null;

  const isClosed =
    contact.status === "ACCEPTED" ||
    contact.status === "REJECTED" ||
    contact.status === "ARCHIVED";

  const run = async (action: RootAction) => {
    setPending(action);
    try {
      await onAction(contact.id, action);
    } finally {
      setPending(null);
      setConfirming(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-hm-ink-950/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      <aside className="relative flex h-full w-full max-w-[560px] flex-col overflow-y-auto bg-white shadow-2xl">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-black/5 bg-white px-6 py-4">
          <div className="flex items-center gap-3">
            <h2 className="text-[15px] font-semibold text-hm-ink-900">
              Détail du contact
            </h2>
            <span
              className={`rounded-full px-3 py-1 text-[11px] font-semibold ${STATUS_BADGE[contact.status]}`}
            >
              {STATUS_LABELS[contact.status]}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/5 text-hm-ink-500 hover:bg-black/10"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex flex-col gap-6 px-6 py-6 text-[13px]">
          {/* Actions ROOT (Flow v2.0) */}
          {!isClosed && (
            <div>
              <div className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-hm-ink-500">
                Actions
              </div>

              {confirming === null ? (
                <div className="flex flex-wrap gap-2">
                  <ActionButton
                    color="emerald"
                    icon={<Check className="h-4 w-4" />}
                    onClick={() => setConfirming("accept")}
                  >
                    Accepter & créer le compte
                  </ActionButton>
                  <ActionButton
                    color="purple"
                    icon={<MessageCircle className="h-4 w-4" />}
                    disabled={contact.status === "CONTACTED"}
                    onClick={() => run("contact")}
                  >
                    Marquer comme contacté
                  </ActionButton>
                  <ActionButton
                    color="coral"
                    icon={<XCircle className="h-4 w-4" />}
                    onClick={() => setConfirming("reject")}
                  >
                    Refuser
                  </ActionButton>
                  <ActionButton
                    color="ghost"
                    icon={<Archive className="h-4 w-4" />}
                    onClick={() => run("archive")}
                  >
                    Archiver
                  </ActionButton>
                </div>
              ) : (
                <ConfirmRow
                  action={confirming}
                  contact={contact}
                  pending={pending !== null}
                  onCancel={() => setConfirming(null)}
                  onConfirm={() => run(confirming)}
                />
              )}
            </div>
          )}

          {isClosed && (
            <div className="rounded-xl bg-hm-bg-soft px-4 py-3 text-[12px] text-hm-ink-500">
              Ce contact est clôturé ({STATUS_LABELS[contact.status]}). Aucune
              action supplémentaire n'est disponible.
            </div>
          )}

          <Section title="Contact">
            <KV label="Nom">{contact.name ?? "—"}</KV>
            <KV label="Email">
              <a
                href={`mailto:${contact.email}`}
                className="text-hm-purple-500 hover:underline"
              >
                {contact.email}
              </a>
            </KV>
            <KV label="Téléphone">{contact.phone ?? "—"}</KV>
            <KV label="Rôle">{contact.role ?? "—"}</KV>
          </Section>

          <Section title="Organisation">
            <KV label="Nom">{contact.organizationName ?? "—"}</KV>
            <KV label="Type">
              {contact.organizationType
                ? ORG_TYPE_LABELS[contact.organizationType]
                : "—"}
            </KV>
            <KV label="Apprenants">
              {contact.learnerVolume
                ? VOLUME_LABELS[contact.learnerVolume]
                : "—"}
            </KV>
            <KV label="Pays">{contact.country ?? "—"}</KV>
            <KV label="Ville">{contact.city ?? "—"}</KV>
            <KV label="Site web">
              {contact.website ? (
                <a
                  href={
                    contact.website.startsWith("http")
                      ? contact.website
                      : `https://${contact.website}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-hm-purple-500 hover:underline"
                >
                  {contact.website}
                </a>
              ) : (
                "—"
              )}
            </KV>
          </Section>

          <Section title="Projet">
            <KV label="Horizon">
              {contact.horizon ? HORIZON_LABELS[contact.horizon] : "—"}
            </KV>
            <div className="mt-3">
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-hm-ink-500">
                Message
              </div>
              <p className="whitespace-pre-wrap rounded-xl bg-hm-bg-soft p-4 text-[13px] leading-relaxed text-hm-ink-900">
                {contact.message}
              </p>
            </div>
          </Section>

          <Section title="Méta">
            <KV label="Source">{contact.source ?? "—"}</KV>
            <KV label="Reçu le">
              {new Date(contact.createdAt).toLocaleString("fr-FR")}
            </KV>
          </Section>
        </div>
      </aside>
    </div>
  );
}

function ActionButton({
  color,
  icon,
  children,
  onClick,
  disabled,
}: {
  color: "emerald" | "purple" | "coral" | "ghost";
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  const styles: Record<typeof color, string> = {
    emerald: "bg-emerald-500 text-white hover:bg-emerald-600",
    purple: "bg-hm-purple-500 text-white hover:bg-hm-purple-400",
    coral: "bg-hm-coral-400 text-white hover:bg-hm-coral-400/90",
    ghost: "bg-hm-bg-soft text-hm-ink-900 hover:bg-black/10",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${styles[color]}`}
    >
      {icon}
      {children}
    </button>
  );
}

function ConfirmRow({
  action,
  contact,
  pending,
  onCancel,
  onConfirm,
}: {
  action: RootAction;
  contact: AdminContact;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const labelMap: Record<RootAction, { title: string; body: string; cta: string }> = {
    accept: {
      title: `Créer le compte de ${contact.organizationName ?? contact.name ?? contact.email} ?`,
      body: `Un compte sera créé pour ${contact.email} avec un mot de passe temporaire. Un email lui sera envoyé avec ses identifiants et la procédure de première connexion.`,
      cta: "Oui, créer le compte",
    },
    reject: {
      title: "Refuser cette demande ?",
      body: `Un email de refus poli sera envoyé à ${contact.email}.`,
      cta: "Oui, refuser",
    },
    contact: {
      title: "Marquer comme contacté ?",
      body: "Aucun email n'est envoyé. Cela sert uniquement à indiquer que vous êtes en discussion avec ce lead.",
      cta: "Confirmer",
    },
    archive: {
      title: "Archiver ce contact ?",
      body: "Il sortira du pipeline actif mais restera consultable.",
      cta: "Confirmer",
    },
  };
  const { title, body, cta } = labelMap[action];
  return (
    <div className="rounded-2xl bg-hm-bg-soft p-5">
      <h3 className="text-[14px] font-semibold text-hm-ink-900">{title}</h3>
      <p className="mt-2 text-[12px] text-hm-ink-500">{body}</p>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={onConfirm}
          disabled={pending}
          className={`inline-flex items-center justify-center rounded-full px-5 py-2 text-[12px] font-semibold text-white transition-colors disabled:opacity-50 ${
            action === "reject"
              ? "bg-hm-coral-400 hover:bg-hm-coral-400/90"
              : action === "accept"
                ? "bg-emerald-500 hover:bg-emerald-600"
                : "bg-hm-purple-500 hover:bg-hm-purple-400"
          }`}
        >
          {pending ? "En cours..." : cta}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="inline-flex items-center justify-center rounded-full bg-white px-5 py-2 text-[12px] font-medium text-hm-ink-900 ring-1 ring-black/5 transition-colors hover:bg-black/5"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-hm-ink-500">
        {title}
      </h3>
      <div className="flex flex-col gap-1.5">{children}</div>
    </section>
  );
}

function KV({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[100px_1fr] items-baseline gap-2 text-[13px]">
      <span className="text-hm-ink-500">{label}</span>
      <span className="text-hm-ink-900">{children}</span>
    </div>
  );
}
