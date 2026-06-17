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
import { Loader2 } from "lucide-react";
import { toast } from "../../lib/notify";
import { ForgotFormValues, forgotSchema } from "../../dto/auth.dto";
import { useRouter } from "next/navigation";
import { AuthService } from "../../services/auth.service";
import { inputCx } from "../../lib/constant";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotFormValues) {
    setSubmitting(true);
    try {
      const res = await AuthService.forgotPassword(values);

      if (res.status !== 200) {
        throw new Error(res.error || "Impossible d'envoyer l'email");
      }

      toast.success("Un email de reinitialisation a ete envoye.");
      router.push("/login");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Impossible d'envoyer l'email",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3.5 sm:space-y-4" aria-busy={submitting}>
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

        <Button type="submit" variant="auth" className="h-12 w-full rounded-full text-[15px] font-semibold" disabled={submitting}>
          {submitting ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Envoi...
            </span>
          ) : (
            "Envoyer le lien"
          )}
        </Button>
      </form>
    </Form>
  );
}

