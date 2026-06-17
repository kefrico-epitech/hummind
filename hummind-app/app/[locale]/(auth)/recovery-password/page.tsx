import { RecoveryPasswordForm } from "../../../../src/components/auth/recovery-password-form";

export const metadata = {
  title: "Reinitialiser le mot de passe - Hummind",
};

export default function RecoveryPage() {
  return (
    <div className="text-center text-black/90">
      <h1 className="mt-3 text-xl font-semibold sm:mt-4 sm:text-2xl">Reinitialiser le mot de passe</h1>

      <div className="mt-3 w-full px-2 sm:mt-5 sm:px-1">
        <RecoveryPasswordForm />
      </div>
    </div>
  );
}