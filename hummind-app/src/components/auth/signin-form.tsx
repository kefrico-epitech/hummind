"use client";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "../../lib/notify";
import Link from "next/link";
import { SigninFormValues, signinSchema } from "../../dto/auth.dto";
import { AuthService } from "../../services/auth.service";
import { appendNextParam, getSafeNextPath } from "../../lib/authRedirect";
import { establishAuthenticatedSession } from "../../lib/authSession";
import { inputCx } from "../../lib/constant";
import { useAppDispatch } from "../../store/hooks";
import { GoogleAuthButton } from "./GoogleAuthButton";

export function SigninForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const nextPath = getSafeNextPath(searchParams.get("next"));
  const forgotPasswordHref = appendNextParam("/forgot-password", nextPath);

  const form = useForm<SigninFormValues>({
    resolver: zodResolver(signinSchema),
    mode: "onTouched",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: SigninFormValues) {
    setSubmitting(true);
    try {
      const res = await AuthService.signIn(values);

      if (res.status !== 200) {
        throw new Error(res.error || "Connexion echouee");
      }

      // First-login workflow: backend returns a temp token, the user
      // must define a permanent password before we issue a real session.
      const payload = res.data;
      if (payload && "requiresPasswordChange" in payload && payload.requiresPasswordChange) {
        const target = `/first-login?token=${encodeURIComponent(payload.tempToken)}${
          nextPath ? `&next=${encodeURIComponent(nextPath)}` : ""
        }`;
        router.replace(target);
        return;
      }

      if (payload && "resendEmail" in payload && payload.resendEmail) {
        toast.warning(
          "Votre e-mail n'est pas encore verifie. Un nouveau message de confirmation a ete envoye.",
        );
        return;
      }

      if (!payload || !("success" in payload) || payload.success !== true) {
        throw new Error("Connexion echouee");
      }

      await establishAuthenticatedSession(payload, dispatch);

      toast.success("Connexion reussie.");
      router.replace(nextPath ?? "/organisation?entry=1");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erreur de connexion";
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleSignIn(credential: string) {
    setSubmitting(true);
    try {
      const res = await AuthService.signInWithGoogle(credential);

      if (res.status !== 200 || !res.data?.success) {
        throw new Error(res.error || "Connexion Google echouee");
      }

      await establishAuthenticatedSession(res.data, dispatch);
      toast.success("Connexion Google reussie.");
      router.replace(nextPath ?? "/organisation?entry=1");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erreur de connexion Google";
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-3.5 sm:space-y-4"
        aria-busy={submitting}
      >
        <FormField
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="email" className="sr-only">
                Email
              </FormLabel>
              <FormControl>
                <Input
                  id="email"
                  type="email"
                  placeholder="exemple@domaine.com"
                  autoComplete="email"
                  {...field}
                  className={inputCx}
                  disabled={submitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="password" className="sr-only">
                Mot de passe
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPwd ? "text" : "password"}
                    placeholder="........"
                    autoComplete="current-password"
                    {...field}
                    className={inputCx + " pr-12"}
                    disabled={submitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((s) => !s)}
                    className="absolute right-2 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md p-0 text-muted-foreground hover:text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                    aria-label={showPwd ? "Masquer" : "Afficher"}
                    aria-pressed={showPwd}
                  >
                    {showPwd ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <p className="text-center text-[13px] text-black/70">
          <Link
            href={forgotPasswordHref}
            className="text-primary underline underline-offset-2"
          >
            Mot de passe oublie ?
          </Link>
        </p>

        <Button
          type="submit"
          variant="auth"
          className="mt-1 h-12 w-full rounded-full text-[15px] font-semibold"
          disabled={submitting}
        >
          {submitting ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Connexion...
            </span>
          ) : (
            "Se connecter"
          )}
        </Button>

        <p className="text-center text-[13px] text-black/70">
          Premiere connexion sur Hummind ? Connectez-vous avec le mot de passe
          temporaire reçu par email — vous serez invite(e) a en choisir un
          nouveau.
        </p>

        <div className="relative py-1.5 sm:py-2">
          <Separator />
          <span className="absolute left-1/2 -top-[.5px] -translate-x-1/2 bg-background-white px-2 text-xs text-black/70">
            OU
          </span>
        </div>

        <GoogleAuthButton
          disabled={submitting}
          onCredential={handleGoogleSignIn}
        />
      </form>
    </Form>
  );
}

