"use client";

import { CheckCircle2, X } from "lucide-react";
import { useEffect } from "react";
import Link from "next/link";

interface SuccessModalProps {
  open: boolean;
  onClose: () => void;
  contactName?: string;
  contactEmail?: string;
}

export function SuccessModal({
  open,
  onClose,
  contactName,
  contactEmail,
}: SuccessModalProps) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const friendlyName = contactName?.trim().split(" ")[0] ?? "";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="success-modal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
      <div
        className="absolute inset-0 bg-hm-ink-950/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/5 text-hm-ink-500 transition-colors hover:bg-black/10"
        >
          <X className="h-4 w-4" />
        </button>

        <div
          className="px-8 pt-10 pb-8 text-center"
          style={{
            background:
              "linear-gradient(170deg, #edebfa 0%, #ffe9de 100%)",
          }}
        >
          <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
            <CheckCircle2 className="h-9 w-9 text-hm-purple-500" />
          </div>

          <h2
            id="success-modal-title"
            className="mt-6 text-[24px] font-semibold leading-tight tracking-tight text-hm-ink-900"
          >
            Demande envoyée
            {friendlyName ? `, ${friendlyName}` : ""} !
          </h2>

          <p className="mt-3 text-[14px] leading-relaxed text-hm-ink-500">
            Votre demande a bien été prise en compte. Notre équipe revient vers
            vous sous 24h
            {contactEmail ? (
              <>
                {" "}à l'adresse{" "}
                <span className="font-medium text-hm-ink-900">
                  {contactEmail}
                </span>
              </>
            ) : null}
            .
          </p>
        </div>

        <div className="flex flex-col gap-3 px-8 py-6">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full bg-hm-ink-950 px-6 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-hm-ink-900"
          >
            Retour à l'accueil
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-full bg-transparent px-6 py-2 text-[13px] font-medium text-hm-ink-500 transition-colors hover:text-hm-ink-900"
          >
            Envoyer une autre demande
          </button>
        </div>
      </div>
    </div>
  );
}
