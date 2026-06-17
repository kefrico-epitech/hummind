import React, { useEffect, useState } from "react";
import { FaEnvelope, FaFacebook, FaWhatsapp } from "react-icons/fa";
import { copyTextToClipboard } from "../../lib/clipboard";
import { toast } from "../../lib/notify";
import { EntityService } from "../../services/entity.service";

type InvitationLinkLike = {
  link?: string;
  token?: string;
  expiresAt?: string;
};

const resolveInvitationLink = (invitation: InvitationLinkLike | null | undefined): string => {
  if (typeof invitation?.link === "string" && invitation.link.length > 0) {
    return invitation.link;
  }

  if (typeof invitation?.token !== "string" || invitation.token.length === 0) {
    return "";
  }

  const token = encodeURIComponent(invitation.token);
  if (typeof window === "undefined") {
    return `/invitations/request?token=${token}`;
  }

  const locale = window.location.pathname.split("/").filter(Boolean)[0] ?? "";
  const path = locale
    ? `/${locale}/invitations/request?token=${token}`
    : `/invitations/request?token=${token}`;

  return `${window.location.origin}${path}`;
};

const generateRoomLink = async (id: string): Promise<string> => {
  try {
    const res = await EntityService.checkLink(id);

    if (res.status !== 200) {
      throw new Error(res.error || "Erreur inconnue");
    }

    if (res.data && res.data.length > 0) {
      const now = Date.now();
      for (let index = res.data.length - 1; index >= 0; index -= 1) {
        const invitation = res.data[index];
        if (!invitation?.expiresAt) continue;

        const expiresAt = Date.parse(invitation.expiresAt);
        if (!Number.isNaN(expiresAt) && expiresAt > now) {
          const resolved = resolveInvitationLink(invitation);
          if (resolved) {
            return resolved;
          }
        }
      }
    }

    const createRes = await EntityService.createLink(id, "LEARNER");
    if (createRes.status !== 201) {
      throw new Error(createRes.error || "Erreur inconnue");
    }

    return resolveInvitationLink(createRes.data) || "";
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    toast.error(`Erreur lors de la generation du lien : ${message}`);
    console.error("Erreur lors de la generation du lien :", error);
    return "";
  }
};

export default function ShareRoom({ entityId }: { entityId: string }) {
  const [copied, setCopied] = useState(false);
  const [link, setLink] = useState("");

  useEffect(() => {
    const fetchLink = async () => {
      const generatedLink = await generateRoomLink(entityId);
      setLink(generatedLink);
    };

    void fetchLink();
  }, [entityId]);

  const handleCopy = async () => {
    if (!link) return;

    const copiedSuccessfully = await copyTextToClipboard(link);
    if (!copiedSuccessfully) {
      toast.error("Impossible de copier le lien.");
      return;
    }

    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const shareFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`,
      "_blank",
    );
  };

  const shareWhatsApp = () => {
    window.open(
      `https://api.whatsapp.com/send?text=${encodeURIComponent(link)}`,
      "_blank",
    );
  };

  const shareEmail = () => {
    const subject = "Invitation a rejoindre ma salle";
    const body = `Voici le lien pour rejoindre la salle : ${link}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="w-full space-y-4">
      <h2 className="mb-4 text-base font-semibold">Partager le lien de votre salle</h2>

      <div className="flex items-center space-x-2 rounded-md border border-white/10 bg-white/4 p-2">
        <input
          type="text"
          readOnly
          value={link || "Generation en cours..."}
          className="flex-1 rounded-md border-none px-3 py-2 text-sm text-white/60"
        />
        <button
          type="button"
          onClick={() => {
            void handleCopy();
          }}
          disabled={!link}
          className="rounded-full bg-primary px-3 py-2 text-sm text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {copied ? "Copie" : "Copier"}
        </button>
      </div>

      <div className="mt-8 flex justify-center gap-6">
        <button
          type="button"
          onClick={shareFacebook}
          className="rounded-full p-2 text-white/80 hover:bg-white/10"
        >
          <FaFacebook className="h-8 w-8" />
        </button>
        <button
          type="button"
          onClick={shareWhatsApp}
          className="rounded-full p-2 text-white/80 hover:bg-white/10"
        >
          <FaWhatsapp className="h-8 w-8" />
        </button>
        <button
          type="button"
          onClick={shareEmail}
          className="rounded-full p-2 text-white/80 hover:bg-white/10"
        >
          <FaEnvelope className="h-8 w-8" />
        </button>
      </div>
    </div>
  );
}

