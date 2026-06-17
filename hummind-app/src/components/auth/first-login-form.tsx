"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { useAppDispatch } from "../../store/hooks";
import { AuthService } from "../../services/auth.service";
import { establishAuthenticatedSession } from "../../lib/authSession";
import { getSafeNextPath } from "../../lib/authRedirect";
import { toast } from "../../lib/notify";
import { inputCx } from "../../lib/constant";

const schema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Au moins 8 caractères")
      .regex(/[A-Z]/, "Au moins une majuscule")
      .regex(/[a-z]/, "Au moins une minuscule")
      .regex(/\d/, "Au moins un chiffre"),
    confirmPassword: z.string().min(1, "Confirmation requise"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Les mots de passe ne correspondent pas",
  });

type FormValues = z.infer<typeof schema>;

export function FirstLoginForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const tempToken = searchParams.get("token") ?? "";
  const nextPath = getSafeNextPath(searchParams.get("next"));

  const [submitting, setSubmitting] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  if (!tempToken) {
    return (
      <div className="text-center text-black/80">
        <p>
          Ce lien est invalide ou a expiré. Revenez à la page de connexion et
          authentifiez-vous avec votre mot de passe temporaire.
        </p>
        <Button asChild className="mt-5" variant="auth">
          <a href="/login">Retour à la connexion</a>
        </Button>
      </div>
    );
  }

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const res = await AuthService.finalize(tempToken, values.newPassword);
      if (res.status !== 200 || !res.data?.success) {
        throw new Error(res.error || "Impossible de finaliser le compte");
      }
      await establishAuthenticatedSession(res.data, dispatch);
      toast.success("Mot de passe défini. Bienvenue !");
      router.replace(nextPath ?? "/organisation?entry=1");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erreur lors de la finalisation",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mx-auto mb-6 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
        <ShieldCheck className="h-6 w-6" />
      </div>
      <h1 className="text-xl font-semibold sm:text-2xl">
        Choisis ton mot de passe
      </h1>
      <p className="mt-2 text-[13px] text-black/70">
        Ton compte a été créé avec un mot de passe temporaire. Définis ton mot
        de passe définitif pour continuer.
      </p>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="mt-6 space-y-4"
          aria-busy={submitting}
        >
          <FormField
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="newPassword">Nouveau mot de passe</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPwd ? "text" : "password"}
                      autoComplete="new-password"
                      {...field}
                      className={inputCx + " pr-12"}
                      disabled={submitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd((s) => !s)}
                      className="absolute right-2 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md p-0 text-muted-foreground hover:text-black"
                      aria-label={showPwd ? "Masquer" : "Afficher"}
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

          <FormField
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="confirmPassword">
                  Confirme ton mot de passe
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirm ? "text" : "password"}
                      autoComplete="new-password"
                      {...field}
                      className={inputCx + " pr-12"}
                      disabled={submitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((s) => !s)}
                      className="absolute right-2 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md p-0 text-muted-foreground hover:text-black"
                      aria-label={showConfirm ? "Masquer" : "Afficher"}
                    >
                      {showConfirm ? (
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

          <Button
            type="submit"
            variant="auth"
            className="mt-2 h-12 w-full rounded-full text-[15px] font-semibold"
            disabled={submitting}
          >
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Finalisation...
              </span>
            ) : (
              "Valider et continuer"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
