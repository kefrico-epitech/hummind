import type { Metadata } from 'next';
import { ReactQueryProvider } from '@/shared/providers/react-query-provider';
import { themeBodyClass } from '@/design-system/theme.config';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: { default: 'Hummind', template: '%s — Hummind' },
  description: "Plateforme d'apprentissage augmentée par l'IA.",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={themeBodyClass}>
        <ReactQueryProvider>{children}</ReactQueryProvider>
      </body>
    </html>
  );
}

