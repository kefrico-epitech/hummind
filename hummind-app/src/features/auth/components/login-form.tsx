'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import type { Route } from 'next';
import { useSearchParams, useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { http, ApiError } from '@/shared/api/http';
import { cn } from '@/shared/lib/cn';

const loginSchema = z.object({
  email: z.string().email('Email invalide.'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères.'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

type Session = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ROOT' | 'ADMIN' | 'USER';
  avatarUrl: string | null;
  locale: string;
  mustChangePassword: boolean;
  onboardingCompleted: boolean;
  profileCompleted: boolean;
};

const DEMO_ACCOUNTS = [
  {
    label: 'Admin',
    email: 'rogerfercusson@gmail.com',
    password: 'Hummind!2025',
    description: 'Pour tester la création de cours.',
  },
  {
    label: 'Apprenant',
    email: 'kefrico99@gmail.com',
    password: 'Hummind!2025',
    description: 'Pour vérifier la session utilisateur.',
  },
  {
    label: 'Root',
    email: 'root@hummind.com',
    password: 'Hummind!2025',
    description: 'Compte super-admin.',
  },
] as const;

function homeForRole(role: Session['role']): Route {
  return (role === 'USER' ? '/' : '/espace/cours/nouveau') as Route;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'rogerfercusson@gmail.com',
      password: 'Hummind!2025',
    },
  });

  async function onSubmit(values: LoginFormValues) {
    setLoading(true);
    setError(null);

    try {
      const session = await http<Session>('/auth/signin', {
        method: 'POST',
        body: JSON.stringify(values),
      });
      router.replace(homeForRole(session.role));
      router.refresh();
    } catch (cause) {
      if (cause instanceof ApiError) {
        setError(`${cause.code}: ${cause.message}`);
      } else if (cause instanceof Error) {
        setError(cause.message);
      } else {
        setError('Une erreur inattendue est survenue.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="rounded-[32px] border border-black/8 bg-white p-6 shadow-[0_24px_80px_rgba(17,17,20,0.08)]"
      >
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-600">
            Connexion
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-[#111116]">
            Se connecter à Hummind
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-black/55">
            Utilise un compte seedé pour tester le flux complet. Les cookies de session seront
            posés automatiquement après authentification.
          </p>
        </div>

        {reason === 'session_expired' ? (
          <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Ta session a expiré. Connecte-toi à nouveau pour continuer.
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Email" error={form.formState.errors.email?.message}>
            <input
              {...form.register('email')}
              type="email"
              autoComplete="email"
              className={inputClass}
              placeholder="ton@email.com"
            />
          </Field>
          <Field label="Mot de passe" error={form.formState.errors.password?.message}>
            <input
              {...form.register('password')}
              type="password"
              autoComplete="current-password"
              className={inputClass}
              placeholder="********"
            />
          </Field>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() =>
              form.reset({
                email: 'rogerfercusson@gmail.com',
                password: 'Hummind!2025',
              })
            }
            className="inline-flex items-center justify-center rounded-full border border-black/10 px-5 py-3 text-sm font-semibold text-black/70 transition hover:border-black/20 hover:bg-black/[0.03]"
          >
            Préremplir admin
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center rounded-full bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </div>

        {error ? (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
      </form>

      <aside className="space-y-6">
        <div className="rounded-[32px] border border-black/8 bg-[#111116] p-6 text-white shadow-[0_24px_80px_rgba(17,17,20,0.18)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-300">
            Comptes de test
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold">Connexion rapide</h2>
          <p className="mt-3 text-sm leading-6 text-white/68">
            Les comptes seedés permettent de valider immédiatement le backend et la création de
            cours.
          </p>

        <div className="mt-6 space-y-3">
          {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() =>
                  form.reset({
                    email: account.email,
                    password: account.password,
                  })
                }
                className="block w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left transition hover:border-brand-300 hover:bg-white/10"
              >
                <div className="flex items-center justify-between gap-4">
                  <strong className="text-sm font-semibold text-white">{account.label}</strong>
                  <span className="text-xs uppercase tracking-[0.16em] text-white/40">
                    {account.email.split('@')[0]}
                  </span>
                </div>
                <p className="mt-1 text-xs text-white/50">{account.description}</p>
              </button>
          ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-black/8 bg-white p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
            Astuce
          </p>
          <p className="mt-4 text-sm leading-6 text-black/60">
            Après connexion, tu seras redirigé automatiquement vers l’espace de test de création de
            cours.
          </p>
        </div>
      </aside>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-2 flex items-center justify-between gap-4">
        <span className="text-sm font-semibold text-black/80">{label}</span>
      </div>
      {children}
      {error ? <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p> : null}
    </label>
  );
}

const inputClass =
  'mt-0 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-[#111116] outline-none transition placeholder:text-black/30 focus:border-brand-400 focus:ring-4 focus:ring-brand-100';
