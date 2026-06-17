import { ReactNode } from "react";
import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "@/styles/globals.css";
import 'katex/dist/katex.min.css';
import { AppProviders } from "../../src/providers/AppProviders";
import { cookies } from "next/headers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Hummind — Plateforme d’apprentissage assistée par IA",
  description: "Hummind : créez, apprenez et gérez avec une IA intégrée.",
};

const SUPPORTED_LOCALES = ["fr", "en"] as const;
const ACCESS_COOKIE_NAME = "hm_access";

type SafeUser = {
  id?: string;
  email?: string;
  lastname?: string;
  firstname?: string;
  role?: string;
} | null;

async function getServerUser(): Promise<SafeUser> {
  const baseUrl =
    process.env.NEXT_PUBLIC_NEST_API_URL ?? process.env.NEXT_PUBLIC_API_BASE;
  if (!baseUrl) return null;

  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const res = await fetch(`${baseUrl}/users/me`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    const user = data?.user;
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      lastname: user.lastname,
      firstname: user.firstname,
      role: user.role,
    };
  } catch {
    return null;
  }
}

export default async function RootLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>; // ✅ objet, pas Promise
}) {
  const { locale } = await params;
  const safeLocale = SUPPORTED_LOCALES.includes(
    locale as (typeof SUPPORTED_LOCALES)[number]
  )
    ? locale
    : "fr";
  const messages = (await import(`@/translate/${safeLocale}.json`)).default;
  const user = await getServerUser();

  return (
    <html lang={safeLocale} suppressHydrationWarning>
      <body className={`${inter.variable} ${poppins.variable} antialiased`}>
        <AppProviders locale={safeLocale} messages={messages} user={user}>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
