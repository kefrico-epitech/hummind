import type { Metadata } from 'next';
import { Inter, Sora } from 'next/font/google';
import { ReactQueryProvider } from '@/shared/providers/react-query-provider';
import { themeBodyClass } from '@/design-system/theme.config';
import '@/styles/globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const sora = Sora({ subsets: ['latin'], variable: '--font-sora', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'Hummind', template: '%s — Hummind' },
  description: "Plateforme d'apprentissage augmentée par l'IA.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${inter.variable} ${sora.variable}`}>
      <body className={themeBodyClass}>
        <ReactQueryProvider>{children}</ReactQueryProvider>
      </body>
    </html>
  );
}
