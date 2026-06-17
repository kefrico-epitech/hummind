import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { env } from '@/shared/config/env';

export type Role = 'ROOT' | 'ADMIN' | 'USER';

export interface Session {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  avatarUrl: string | null;
  locale: string;
  mustChangePassword: boolean;
  onboardingCompleted: boolean;
  profileCompleted: boolean;
}

const SESSION_COOKIE = 'hm_session';

/** En-tête Cookie brut, pour les fetch côté serveur (Server Components / Route Handlers). */
export async function getSessionCookie(): Promise<string> {
  const store = await cookies();
  return store
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');
}

/** Récupère la session via le cookie `hm_session` + `/auth/me`, ou null. */
export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  if (!store.get(SESSION_COOKIE)) return null;
  try {
    const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/api/v1/auth/me`, {
      headers: { Cookie: await getSessionCookie() },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return (await res.json()) as Session;
  } catch {
    return null;
  }
}

/** Garde : session requise, sinon redirection vers /login. */
export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect('/login');
  return session;
}

/** Garde : rôle requis, sinon redirection vers l'accueil. */
export async function requireRole(...roles: Role[]): Promise<Session> {
  const session = await requireSession();
  if (!roles.includes(session.role)) redirect('/');
  return session;
}
