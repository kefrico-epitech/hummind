import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import type { Route } from 'next';
import { getSession } from '@/shared/auth/session';
import { LoginForm } from '@/features/auth/components/login-form';
import { MarketingShell } from '@/features/marketing/components/marketing-shell';

export const metadata: Metadata = {
  title: 'Connexion',
  description: 'Connexion à Hummind.',
};

function homeForRole(role: 'ROOT' | 'ADMIN' | 'USER'): Route {
  return (role === 'USER' ? '/' : '/espace/cours/nouveau') as Route;
}

export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    redirect(homeForRole(session.role));
  }

  return (
    <MarketingShell>
      <section className="py-10">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-600">
            Hummind
          </p>
          <h1 className="mt-4 text-balance font-display text-5xl font-semibold tracking-[-0.045em] text-[#17172A] sm:text-6xl">
            Connexion.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-black/45">
            Connecte-toi avec un compte seedé pour tester l&apos;application de bout en bout.
          </p>
        </div>
      </section>

      <LoginForm />
    </MarketingShell>
  );
}
