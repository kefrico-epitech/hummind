"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, UserCheck, XCircle } from "lucide-react";
import { toast } from "../../../../../src/lib/notify";
import { Button } from "../../../../../src/components/ui/button";
import { EntityService } from "../../../../../src/services/entity.service";

type ViewState = "loading" | "success" | "failed" | "already";

function getRequestErrorMessage(error?: string | null) {
  const normalized = String(error || "").toLowerCase();

  if (normalized.includes("authentication required")) {
    return "Vous devez etre connecte pour continuer.";
  }

  if (normalized.includes("invalid token")) {
    return "Ce lien d'invitation est invalide.";
  }

  if (normalized.includes("invitation expired")) {
    return "Ce lien d'invitation a expire.";
  }

  if (normalized.includes("invitation revoked")) {
    return "Ce lien d'invitation n'est plus actif.";
  }

  if (normalized.includes("already member")) {
    return "Vous etes deja membre de cette organisation.";
  }

  if (normalized.includes("join request already pending")) {
    return "Une demande d'acces est deja en attente pour cette organisation.";
  }

  return "Impossible d'envoyer la demande pour le moment. Reessayez plus tard.";
}

const InvitationRequestPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [state, setState] = useState<ViewState>("loading");
  const [message, setMessage] = useState(
    "Nous transmettons votre demande d'acces a l'organisation.",
  );
  const [entityId, setEntityId] = useState<string | null>(null);

  const ranRef = useRef(false);

  const cardCx =
    "mx-auto max-w-md w-full rounded-3xl border border-border/50 bg-gradient-to-br from-card to-muted shadow-xl p-8 space-y-6 text-center";
  const actionsCx = "flex flex-col gap-3";

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const run = async () => {
      if (!token) {
        setState("failed");
        setMessage("Ce lien d'invitation est invalide.");
        toast.error("Lien d'invitation invalide.");
        return;
      }

      setState("loading");
      setMessage("Nous transmettons votre demande d'acces a l'organisation.");

      try {
        const res = await EntityService.requestLink(token);

        if (res.status !== 201 || !res.data) {
          const errMsg = getRequestErrorMessage(res.error);
          setState("failed");
          setMessage(errMsg);
          toast.error(errMsg);
          return;
        }

        if ("status" in res.data && res.data.status === "APPROVED" && res.data.message === "Already member") {
          setEntityId(res.data.entityId ?? null);
          setState("already");
          setMessage("Vous avez deja acces a cette organisation.");
          toast.info("Vous etes deja membre.");
          return;
        }

        if ("request" in res.data && res.data.request?.status === "PENDING") {
          setState("success");
          setMessage(
            "Votre demande d'acces a bien ete envoyee et reste en attente de validation.",
          );
          toast.success("Demande envoyee.");
          return;
        }

        setState("success");
        setMessage("Votre demande d'acces a ete prise en compte.");
        toast.success("Demande envoyee.");
      } catch {
        const errMsg =
          "Impossible de joindre le serveur. Verifiez votre connexion et reessayez.";
        setState("failed");
        setMessage(errMsg);
        toast.error(errMsg);
      }
    };

    void run();
  }, [token]);

  return (
    <main className="grid min-h-[70vh] place-items-center p-4">
      <div
        className={cardCx}
        role={state === "failed" ? "alert" : "status"}
        aria-live={state === "failed" ? "assertive" : "polite"}
        aria-busy={state === "loading"}
      >
        {state === "loading" && (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
            <h1 className="text-xl font-semibold">Envoi de votre demande</h1>
          </div>
        )}

        {state === "success" && (
          <>
            <CheckCircle2 className="mx-auto h-14 w-14 text-green-500" />
            <h1 className="text-2xl font-bold">Demande envoyee</h1>
          </>
        )}

        {state === "already" && (
          <>
            <UserCheck className="mx-auto h-14 w-14 text-blue-500" />
            <h1 className="text-2xl font-bold">Vous etes deja membre</h1>
          </>
        )}

        {state === "failed" && (
          <>
            <XCircle className="mx-auto h-14 w-14 text-red-500" />
            <h1 className="text-2xl font-bold">
              Impossible d&apos;envoyer la demande
            </h1>
          </>
        )}

        <p className="text-sm text-muted-foreground">{message}</p>

        {state === "loading" ? (
          <p className="text-xs text-muted-foreground">
            Cela peut prendre quelques secondes.
          </p>
        ) : state === "success" ? (
          <div className={actionsCx}>
            <Button asChild className="h-12 w-full rounded-full text-[15px]">
              <Link href="/organisation">Retour a mes organisations</Link>
            </Button>
          </div>
        ) : state === "already" ? (
          <div className={actionsCx}>
            {entityId ? (
              <>
                <Button asChild className="h-12 w-full rounded-full text-[15px]">
                  <Link href={`/organisation/${entityId}`}>
                    Aller a l&apos;organisation
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-12 w-full rounded-full text-[15px]"
                >
                  <Link href="/organisation">Voir mes organisations</Link>
                </Button>
              </>
            ) : (
              <Button asChild className="h-12 w-full rounded-full text-[15px]">
                <Link href="/organisation">Voir mes organisations</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className={actionsCx}>
            <Button
              className="h-12 w-full rounded-full text-[15px]"
              onClick={() => router.push("/organisation")}
            >
              Retour a mes organisations
            </Button>
            <Button
              className="h-12 w-full rounded-full text-[15px]"
              variant="outline"
              onClick={() => {
                ranRef.current = false;
                setState("loading");
                setMessage(
                  "Nous transmettons votre demande d'acces a l'organisation.",
                );
                router.refresh();
              }}
            >
              Reessayer
            </Button>
          </div>
        )}
      </div>
    </main>
  );
};

export default InvitationRequestPage;

