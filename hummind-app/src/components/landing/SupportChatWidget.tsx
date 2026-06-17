"use client";

import { useState } from "react";
import { ArrowUp, MessageCircle, X } from "lucide-react";
import { ContactService } from "../../services/contact.service";
import { toast } from "../../lib/notify";

export function SupportChatWidget() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = /.+@.+\..+/.test(email) && message.trim().length > 4;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const res = await ContactService.send({
        kind: "support",
        email: email.trim(),
        message: message.trim(),
        source: typeof window !== "undefined" ? window.location.pathname : "widget",
      });
      if (res.error) throw new Error(res.error);
      toast.success("Message envoyé. Nous revenons vers vous très vite.");
      setEmail("");
      setMessage("");
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur d'envoi");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Trigger */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Ouvrir le chat"
          className="fixed bottom-6 right-6 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-hm-purple-500 text-white shadow-[0_12px_32px_-8px_rgba(123,111,224,0.6)] transition-transform hover:scale-105"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* Panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-3xl bg-hm-bg-soft shadow-[0_24px_48px_-12px_rgba(20,20,26,0.25)]">
          <div
            className="relative px-6 pt-6 pb-10"
            style={{
              background:
                "linear-gradient(170deg, #7b6fe0 0%, #9a90eb 50%, #b8b0f2 100%)",
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[14px] font-semibold tracking-tight text-white">
                Hummind<span className="text-white/70">OS</span>
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fermer"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <h3 className="mt-8 text-[22px] font-semibold leading-tight text-white">
              Salut
              <br />
              comment pouvons-
              <br />
              nous vous aider
            </h3>
          </div>

          <p className="px-6 py-5 text-center text-[12px] leading-relaxed text-hm-ink-500">
            N'hésitez pas à nous poser vos questions ou à nous faire part de
            vos commentaires ! Nous sommes là pour vous aider.
          </p>

          <form
            onSubmit={onSubmit}
            className="mx-4 mb-4 rounded-2xl bg-white p-4 ring-1 ring-black/5"
          >
            <input
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-b border-black/5 bg-transparent pb-3 text-[13px] text-hm-ink-900 outline-none placeholder:text-hm-ink-400"
            />
            <textarea
              rows={3}
              placeholder="Message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-3 w-full resize-none bg-transparent text-[13px] text-hm-ink-900 outline-none placeholder:text-hm-ink-400"
            />
            <div className="mt-3 flex justify-end">
              <button
                type="submit"
                disabled={!canSubmit || submitting}
                aria-label="Envoyer"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-hm-bg-soft text-hm-ink-500 transition-colors hover:bg-hm-purple-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
