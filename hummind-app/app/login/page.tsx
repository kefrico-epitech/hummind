import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import type { Route } from 'next';
import { getSession } from '@/shared/auth/session';
import { LoginForm } from '@/features/auth/components/login-form';
import { Header } from '@/components/Header';
import { PageLayout } from '@/components/PageLayout';
import { Footer } from '@/components/Footer';

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
    <main className="min-h-screen bg-[#f5f1ef] text-[#141426]">
      <div className="sticky top-0 z-50 flex justify-center px-4 py-4 sm:px-6 lg:px-10">
        <Header />
      </div>

      <PageLayout
        title="Connexion."
        subtitle="Connecte-toi avec un compte seedé pour tester l'application de bout en bout."
      >
        <div className="mx-auto max-w-md">
          <LoginForm />
        </div>
      </PageLayout>

      <Footer />
    </main>
  );
}
