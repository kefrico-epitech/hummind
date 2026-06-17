"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";

type GoogleCredentialResponse = {
  credential?: string;
};

type GoogleAccounts = {
  accounts?: {
    id?: {
      initialize: (config: {
        client_id: string;
        callback: (response: GoogleCredentialResponse) => void;
      }) => void;
      renderButton: (
        parent: HTMLElement,
        options: Record<string, string | number | boolean>,
      ) => void;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleAccounts;
  }
}

const GOOGLE_SCRIPT_ID = "google-identity-services";

function loadGoogleScript() {
  return new Promise<void>((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }

    const existing = document.getElementById(
      GOOGLE_SCRIPT_ID,
    ) as HTMLScriptElement | null;

    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Impossible de charger Google Sign-In")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_SCRIPT_ID;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Impossible de charger Google Sign-In"));
    document.head.appendChild(script);
  });
}

interface GoogleAuthButtonProps {
  disabled?: boolean;
  onCredential: (credential: string) => Promise<void> | void;
}

export function GoogleAuthButton({
  disabled = false,
  onCredential,
}: GoogleAuthButtonProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ?? "";

  const renderGoogleButton = useCallback(async () => {
    if (!clientId || !containerRef.current) return;

    await loadGoogleScript();

    const googleId = window.google?.accounts?.id;
    if (!googleId || !containerRef.current) {
      throw new Error("Google Sign-In est indisponible");
    }

    const buttonWidth = Math.max(
      250,
      Math.min(Math.round(containerRef.current.offsetWidth || 320), 380),
    );

    containerRef.current.innerHTML = "";
    googleId.initialize({
      client_id: clientId,
      callback: ({ credential }) => {
        if (credential) {
          void onCredential(credential);
        }
      },
    });
    googleId.renderButton(containerRef.current, {
      type: "standard",
      theme: "outline",
      size: "large",
      text: "continue_with",
      shape: "pill",
      width: buttonWidth,
      logo_alignment: "left",
    });

    setReady(true);
  }, [clientId, onCredential]);

  useEffect(() => {
    const container = containerRef.current;
    const timeoutId = window.setTimeout(() => {
      void renderGoogleButton().catch(() => undefined);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
      if (container) {
        container.innerHTML = "";
      }
    };
  }, [renderGoogleButton]);

  if (!clientId) {
    return (
      <Button
        type="button"
        disabled
        className="h-12 w-full rounded-full border border-sidebar/50 bg-white text-foreground"
      >
        Google non configure
      </Button>
    );
  }

  return (
    <div
      className={cn(
        "relative flex min-h-12 w-full items-center justify-center",
        disabled && "pointer-events-none opacity-60",
      )}
      aria-disabled={disabled}
    >
      {!ready && (
        <Button
          type="button"
          disabled
          className="h-12 w-full rounded-full border border-sidebar/50 bg-white text-foreground hover:bg-white"
        >
          <span className="inline-flex items-center gap-2 text-black/80">
            <Loader2 className="h-4 w-4 animate-spin" />
            Chargement de Google...
          </span>
        </Button>
      )}

      <div
        ref={containerRef}
        className={cn(
          "flex w-full justify-center",
          !ready && "absolute inset-0 opacity-0",
        )}
      />
    </div>
  );
}
