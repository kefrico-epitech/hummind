"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "../../../../../src/lib/notify";
import { EntityService } from "../../../../../src/services/entity.service";
import { Button } from "../../../../../src/components/ui/button";
import { CheckCircle2, Loader2, UserCheck, XCircle } from "lucide-react";
import Link from "next/link";

type ViewState = "loading" | "success" | "already" | "failed";

function getAcceptErrorMessage(error?: string | null) {
  const normalized = String(error || "").toLowerCase();

  if (normalized.includes("invalid token")) {
    return "Ce lien d'invitation est invalide.";
  }

  if (normalized.includes("invitation expired")) {
    return "Ce lien d'invitation a expire.";
  }

  if (normalized.includes("invitation revoked")) {
    return "Ce lien d'invitation n'est plus actif.";
  }

  if (normalized.includes("authentication required")) {
    return "Vous devez etre connecte pour continuer.";
  }

  return "Impossible d'accepter l'invitation pour le moment. Reessayez plus tard.";
}

const InvitationAcceptPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [state, setState] = useState<ViewState>("loading");
  const [message, setMessage] = useState(
    "Nous finalisons votre acces a l'organisation.",
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
      setMessage("Nous finalisons votre acces a l'organisation.");

      try {
        const res = await EntityService.acceptInvitation(token);

        if (res.status !== 201 || !res.data) {
          const errMsg = getAcceptErrorMessage(res.error);
          setState("failed");
          setMessage(errMsg);
          toast.error(errMsg);
          return;
        }

        if ("message" in res.data && res.data.message === "Already accepted") {
          setState("already");
          setMessage("Votre acces a cette organisation est deja actif.");
          toast.info("Acces deja actif.");
          return;
        }

        setEntityId(res.data.entityId ?? null);
        setState("success");
        setMessage("Vous avez rejoint l'organisation avec succes.");
        toast.success("Invitation acceptee.");
      } catch {
        const errMsg =
          "Impossible de joindre le serveur. Verifiez votre connexion et reessayez.";
        setState("failed");
        setMessage(errMsg);
        toast.error(errMsg);
      }
    };

    run();
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
            <h1 className="text-xl font-semibold">
              Acceptation de l&apos;invitation
            </h1>
          </div>
        )}

        {state === "success" && (
          <>
            <CheckCircle2 className="mx-auto h-14 w-14 text-green-500" />
            <h1 className="text-2xl font-bold">Invitation acceptee</h1>
          </>
        )}

        {state === "already" && (
          <>
            <UserCheck className="mx-auto h-14 w-14 text-blue-500" />
            <h1 className="text-2xl font-bold">
              Vous faites deja partie de cette organisation
            </h1>
          </>
        )}

        {state === "failed" && (
          <>
            <XCircle className="mx-auto h-14 w-14 text-red-500" />
            <h1 className="text-2xl font-bold">
              Impossible d&apos;accepter l&apos;invitation
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
            {entityId && (
              <Button asChild className="h-12 w-full rounded-full text-[15px]">
                <Link href={`/organisation/${entityId}`}>
                  Aller a l&apos;organisation
                </Link>
              </Button>
            )}
            <Button
              asChild
              variant={entityId ? "outline" : "default"}
              className="h-12 w-full rounded-full text-[15px]"
            >
              <Link href="/organisation">Voir mes organisations</Link>
            </Button>
          </div>
        ) : state === "already" ? (
          <div className={actionsCx}>
            <Button asChild className="h-12 w-full rounded-full text-[15px]">
              <Link href="/organisation">Voir mes organisations</Link>
            </Button>
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
                setMessage("Nous finalisons votre acces a l'organisation.");
                router.refresh();
              }}
            >
              Réessayer
            </Button>
          </div>
        )}
      </div>
    </main>
  );
};

export default InvitationAcceptPage;

