"use client";

export const dynamic = "force-dynamic";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "../../../../src/components/ui/button";
import { toast } from "../../../../src/lib/notify";
import { AuthService } from "../../../../src/services/auth.service";

type ViewState = "loading" | "success" | "failed";

export default function ActivatePage() {
  const router = useRouter();
  const search = useSearchParams();
  const token = search.get("token") ?? "";

  const ranRef = useRef(false);
  const [state, setState] = useState<ViewState>("loading");
  const [message, setMessage] = useState("Activation en cours…");

  const cardCx =
    "mx-auto max-w-md w-full rounded-3xl border border-border/50 bg-card text-card-foreground shadow-lg p-8 space-y-5 text-center";

  useEffect(() => {
    // Empêche double call en dev (React Strict Mode)
    if (ranRef.current) return;
    ranRef.current = true;

    const run = async () => {
      if (!token) {
        setState("failed");
        setMessage("Token manquant ou invalide.");
        toast.error("Token manquant ou invalide.");
        return;
      }

      setState("loading");
      setMessage("Activation en cours…");

      const res = await AuthService.activateAccount(token);

      if (res.status !== 200) {
        const errMsg = res.error || "Activation échouée. Réessayez plus tard.";
        setState("failed");
        setMessage(errMsg);
        toast.error(errMsg);
        return;
      }

      setState("success");
      setMessage("Votre email a été confirmé avec succès.");
      toast.success("Compte activé 🎉");
    };

    run().catch(() => {
      const errMsg =
        "Impossible de joindre le serveur. Vérifiez votre connexion et réessayez.";
      setState("failed");
      setMessage(errMsg);
      toast.error(errMsg);
    });
  }, [token]);

  return (
    <main className="min-h-[70vh] grid place-items-center p-4">
      <div
        className={cardCx}
        role={state === "failed" ? "alert" : "status"}
        aria-live={state === "failed" ? "assertive" : "polite"}
        aria-busy={state === "loading"}
      >
        {/* ICON */}
        {state === "loading" && (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            <h1 className="text-xl font-semibold">Activation en cours…</h1>
          </div>
        )}

        {state === "success" && (
          <>
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
            <h1 className="text-2xl font-semibold">Compte activé 🎉</h1>
          </>
        )}

        {state === "failed" && (
          <>
            <XCircle className="h-12 w-12 text-red-500 mx-auto" />
            <h1 className="text-2xl font-semibold">Échec d’activation</h1>
          </>
        )}

        {/* MESSAGE */}
        <p className="text-sm text-muted-foreground">{message}</p>

        {/* ACTIONS */}
        {state === "loading" ? (
          <p className="text-xs text-muted-foreground">
            Veuillez patienter quelques instants…
          </p>
        ) : state === "success" ? (
          <Button asChild className="w-full h-12 rounded-full text-[15px]">
            <Link href="/login">Se connecter</Link>
          </Button>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              className="w-full h-12 rounded-full text-[15px]"
              onClick={() => router.push("/login")}
            >
              Retour connexion
            </Button>
            <Button
              className="w-full h-12 rounded-full text-[15px]"
              variant="outline"
              onClick={() => {
                ranRef.current = false; // autorise retry
                setState("loading");
                setMessage("Activation en cours…");
                // relance en “rafraîchissant” la page
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
}

