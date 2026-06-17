import { FirstLoginForm } from "../../../../src/components/auth/first-login-form";

export const metadata = {
  title: "Première connexion - Hummind",
};

export default function FirstLoginPage() {
  return (
    <div className="text-center text-black/90">
      <div className="mt-3 w-full px-2 sm:mt-5 sm:px-1">
        <FirstLoginForm />
      </div>
    </div>
  );
}
