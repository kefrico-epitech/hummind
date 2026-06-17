"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Loader2, Mail } from "lucide-react";
import {
  JoinService,
  type JoinInfoResponse,
} from "../../services/join.service";
import { establishAuthenticatedSession } from "../../lib/authSession";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { toast } from "../../lib/notify";

type Step = "info" | "form" | "otp" | "joined" | "denied";

export default function JoinPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.user.user);

  const code = String(params?.code ?? "").toUpperCase();

  const [step, setStep] = useState<Step>("info");
  const [info, setInfo] = useState<JoinInfoResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Signup
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // OTP
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState("");
  const [otp, setOtp] = useState("");

  // Charge info de la salle
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await JoinService.getInfo(code);
      if (cancelled) return;
      if (res.error || !res.data) {
        setError(res.error || "Lien invalide");
        setStep("denied");
      } else {
        setInfo(res.data);
        setStep("info");
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [code]);

  const onAuthenticatedJoin = async () => {
    setSubmitting(true);
    try {
      const res = await JoinService.acceptAsAuthenticated(code);
      if (res.error || !res.data) {
        throw new Error(res.error || "Impossible de rejoindre cette salle");
      }
      toast.success(
        res.data.alreadyMember
          ? "Vous êtes déjà membre de cette salle"
          : `Bienvenue dans ${res.data.salleName}`,
      );
      router.replace(`/learner`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSubmitting(false);
    }
  };

  const onSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstname.trim() || !lastname.trim() || !email.trim() || password.length < 8) {
      toast.error("Tous les champs sont requis (mot de passe ≥ 8 caractères)");
      return;
    }
    setSubmitting(true);
    try {
      const res = await JoinService.signup(code, {
        firstname: firstname.trim(),
        lastname: lastname.trim(),
        email: email.trim().toLowerCase(),
        password,
      });
      if (res.error || !res.data) {
        throw new Error(res.error || "Inscription impossible");
      }
      setPendingUserId(res.data.userId);
      setPendingEmail(res.data.email);
      setStep("otp");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSubmitting(false);
    }
  };

  const onVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingUserId || otp.length !== 6) return;
    setSubmitting(true);
    try {
      const res = await JoinService.verifyEmail(pendingUserId, otp);
      if (res.error || !res.data?.success) {
        throw new Error(res.error || "Code incorrect");
      }
      await establishAuthenticatedSession(res.data, dispatch);
      toast.success("Bienvenue !");
      setStep("joined");
      router.replace("/learner");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="grid min-h-svh place-items-center bg-hm-bg-soft">
        <Loader2 className="h-6 w-6 animate-spin text-hm-ink-500" />
      </main>
    );
  }

  if (step === "denied" || !info) {
    return (
      <main className="grid min-h-svh place-items-center bg-hm-bg-soft px-6">
        <div className="max-w-md rounded-3xl bg-white p-8 text-center shadow-xl ring-1 ring-black/5">
          <h1 className="text-[20px] font-semibold text-hm-ink-900">
            Lien invalide
          </h1>
          <p className="mt-3 text-[13px] text-hm-ink-500">
            {error ?? "Ce lien d'inscription n'est pas valide ou a expiré."}
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-hm-ink-950 px-5 py-2.5 text-[13px] font-semibold text-white"
          >
            Retour à l'accueil
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main
      className="min-h-svh"
      style={{
        background:
          "linear-gradient(160deg, #edebfa 0%, #f5eef0 50%, #ffe9de 100%)",
      }}
    >
      <div className="mx-auto flex min-h-svh max-w-[520px] flex-col items-stretch justify-center px-6 py-10">
        <div className="overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-black/5">
          {/* Header */}
          <div className="border-b border-black/5 px-8 pt-8 pb-6">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-hm-purple-500">
              Rejoindre une salle
            </p>
            <h1 className="mt-2 text-[22px] font-bold leading-tight text-hm-ink-900">
              {info.salleName}
            </h1>
            {info.organisationName && (
              <p className="mt-1 text-[13px] text-hm-ink-500">
                Organisation : {info.organisationName}
              </p>
            )}
            {info.remainingUses !== null && (
              <p className="mt-3 inline-block rounded-full bg-hm-bg-soft px-3 py-1 text-[11px] font-medium text-hm-ink-500">
                {info.remainingUses} place
                {info.remainingUses > 1 ? "s" : ""} restante
                {info.remainingUses > 1 ? "s" : ""}
              </p>
            )}
          </div>

          <div className="px-8 py-8">
            {step === "info" && (
              <div className="space-y-6">
                {user ? (
                  <button
                    type="button"
                    onClick={onAuthenticatedJoin}
                    disabled={submitting}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-hm-purple-500 px-6 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-hm-purple-400 disabled:opacity-60"
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowRight className="h-4 w-4" />
                    )}
                    Rejoindre en tant que {user.firstname}
                  </button>
                ) : (
                  <>
                    <Link
                      href={`/login?next=${encodeURIComponent(`/join/${code}`)}`}
                      className="inline-flex w-full items-center justify-center rounded-full bg-hm-ink-950 px-6 py-3 text-[14px] font-semibold text-white"
                    >
                      Se connecter et rejoindre
                    </Link>

                    <div className="relative my-2">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-black/10" />
                      </div>
                      <div className="relative flex justify-center">
                        <span className="bg-white px-3 text-[12px] text-hm-ink-500">
                          ou s'inscrire
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setStep("form")}
                      className="inline-flex w-full items-center justify-center rounded-full bg-hm-purple-500 px-6 py-3 text-[14px] font-semibold text-white hover:bg-hm-purple-400"
                    >
                      Créer mon compte apprenant
                    </button>
                  </>
                )}
              </div>
            )}

            {step === "form" && (
              <form onSubmit={onSignup} className="space-y-4">
                <Field label="Prénom" required>
                  <input
                    type="text"
                    value={firstname}
                    onChange={(e) => setFirstname(e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label="Nom" required>
                  <input
                    type="text"
                    value={lastname}
                    onChange={(e) => setLastname(e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label="Email" required>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label="Mot de passe (≥ 8 caractères)" required>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-hm-purple-500 px-6 py-3 text-[14px] font-semibold text-white hover:bg-hm-purple-400 disabled:opacity-60"
                >
                  {submitting ? "Envoi..." : "S'inscrire et rejoindre"}
                </button>
                <button
                  type="button"
                  onClick={() => setStep("info")}
                  className="block w-full text-center text-[12px] text-hm-ink-500 hover:text-hm-ink-900"
                >
                  Annuler
                </button>
              </form>
            )}

            {step === "otp" && (
              <form onSubmit={onVerify} className="space-y-5 text-center">
                <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-hm-purple-100 text-hm-purple-500">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-[16px] font-semibold text-hm-ink-900">
                    Vérifie ton email
                  </h3>
                  <p className="mt-1 text-[13px] text-hm-ink-500">
                    Un code à 6 chiffres a été envoyé à{" "}
                    <span className="font-medium text-hm-ink-900">
                      {pendingEmail}
                    </span>
                    . Il est valable 2 heures.
                  </p>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="000000"
                  className="w-full rounded-xl bg-white px-4 py-4 text-center text-[24px] font-bold tracking-[0.4em] ring-1 ring-black/10 outline-none focus:ring-2 focus:ring-hm-purple-300"
                />
                <button
                  type="submit"
                  disabled={submitting || otp.length !== 6}
                  className="inline-flex w-full items-center justify-center rounded-full bg-hm-purple-500 px-6 py-3 text-[14px] font-semibold text-white hover:bg-hm-purple-400 disabled:opacity-60"
                >
                  {submitting ? "Vérification..." : "Valider"}
                </button>
              </form>
            )}

            {step === "joined" && (
              <div className="space-y-4 text-center">
                <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <h3 className="text-[16px] font-semibold text-hm-ink-900">
                  Bienvenue dans {info.salleName} !
                </h3>
                <p className="text-[13px] text-hm-ink-500">
                  Redirection vers ton espace apprenant...
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

const inputCls =
  "w-full rounded-xl bg-white px-4 py-3 text-[14px] text-hm-ink-900 ring-1 ring-black/10 outline-none transition-shadow placeholder:text-hm-ink-400 focus:ring-2 focus:ring-hm-purple-300";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-left">
      <span className="text-[12px] font-semibold text-hm-ink-900">
        {label}
        {required ? <span className="ml-0.5 text-hm-coral-400">*</span> : null}
      </span>
      {children}
    </label>
  );
}
