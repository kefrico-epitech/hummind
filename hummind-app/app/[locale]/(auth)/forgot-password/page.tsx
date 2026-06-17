import Link from "next/link";
import { ForgotPasswordForm } from "../../../../src/components/auth/forgot-form";

export const metadata = {
  title: "Reinitialiser le mot de passe - Hummind",
};

export default function ForgotPasswordPage() {
  return (
    <div className="text-center text-black/90">
      <h1 className="mt-3 text-xl font-semibold sm:mt-4 sm:text-2xl">Mot de passe oublie ?</h1>
      <p className="mt-2 text-sm text-sidebar/60 sm:text-base">
        Entrez votre adresse e-mail pour recevoir un lien de reinitialisation.
      </p>

      <div className="mt-3 w-full px-2 sm:mt-5 sm:px-1">
        <ForgotPasswordForm />

        <p className="mt-3 text-center text-[13px] text-black/70">
          <Link href="/login" className="text-primary underline underline-offset-2">
            Retour a la connexion
          </Link>
        </p>
      </div>
    </div>
  );
}