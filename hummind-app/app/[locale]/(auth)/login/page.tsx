import { SigninForm } from "../../../../src/components/auth/signin-form";

export const metadata = {
  title: "Se connecter - Hummind",
};

export default function LoginPage() {
  return (
    <div className="text-center text-black/90">
      <h1 className="mt-3 text-xl font-semibold sm:mt-4 sm:text-2xl">Bienvenue a nouveau</h1>

      <div className="mt-3 w-full px-2 sm:mt-5 sm:px-1">
        <SigninForm />
      </div>
    </div>
  );
}