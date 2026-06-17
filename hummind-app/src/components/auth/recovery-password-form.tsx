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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { toast } from "../../lib/notify";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { RecoveryFormValues, recoverySchema } from "../../dto/auth.dto";
import { AuthService } from "../../services/auth.service";
import { inputCx } from "../../lib/constant";

export function RecoveryPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<RecoveryFormValues>({
    resolver: zodResolver(recoverySchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: RecoveryFormValues) {
    if (!token) {
      toast.error("Lien invalide ou token manquant.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await AuthService.recoveryPassword(token, values.newPassword);
      if (res.status !== 200) {
        throw new Error(res.error || "Impossible de reinitialiser le mot de passe");
      }
      toast.success("Mot de passe mis a jour avec succes.");
      router.push("/login");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Impossible de joindre le serveur. Reessayez plus tard.";
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3.5 sm:space-y-4" aria-busy={submitting}>
        <FormField
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="newPassword" className="sr-only">
                Nouveau mot de passe
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPwd ? "text" : "password"}
                    placeholder="Nouveau mot de passe"
                    autoComplete="new-password"
                    {...field}
                    className={inputCx + " pr-12"}
                    disabled={submitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((s) => !s)}
                    className="absolute right-2 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md p-0 text-muted-foreground hover:text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                    aria-label={showPwd ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    aria-pressed={showPwd}
                  >
                    {showPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
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
              <FormLabel htmlFor="confirmPassword" className="sr-only">
                Confirmer le mot de passe
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPwd ? "text" : "password"}
                    placeholder="Confirmer le mot de passe"
                    autoComplete="new-password"
                    {...field}
                    className={inputCx + " pr-12"}
                    disabled={submitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPwd((s) => !s)}
                    className="absolute right-2 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md p-0 text-muted-foreground hover:text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                    aria-label={showConfirmPwd ? "Masquer la confirmation" : "Afficher la confirmation"}
                    aria-pressed={showConfirmPwd}
                  >
                    {showConfirmPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" variant="auth" className="h-12 w-full rounded-full text-[15px] font-semibold" disabled={submitting}>
          {submitting ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Mise a jour...
            </span>
          ) : (
            "Mettre a jour"
          )}
        </Button>
      </form>
    </Form>
  );
}
