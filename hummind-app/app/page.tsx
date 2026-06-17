import Link from 'next/link';
import type { Route } from 'next';

export default function HomePage() {
  return (
    <main className="grid min-h-screen place-items-center px-6">
      <div className="max-w-xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
          ✨ Reconstruction v1 en cours
        </span>
        <h1 className="mt-5 font-display text-4xl font-bold text-brand-900">Hummind</h1>
        <p className="mt-3 text-base text-black/55">
          Plateforme d&apos;apprentissage augmentée par l&apos;IA. Le squelette frontend v1 est en
          place — les espaces (apprenant, organisation, admin) seront reconstruits feature par
          feature.
        </p>
        <Link
          href={'/login' as Route}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
        >
          Connexion
        </Link>
      </div>
    </main>
  );
}
