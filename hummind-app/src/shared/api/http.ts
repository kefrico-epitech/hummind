import { env } from '@/shared/config/env';

const BASE_URL = `${env.NEXT_PUBLIC_API_URL}/api/v1`;

/** Erreur API normalisée. */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Chemins publics : un 401 ne doit PAS déclencher de refresh/redirection.
const PUBLIC_PATHS = ['/support', '/join', '/contact', '/health', '/auth'];

let refreshing: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  // Une seule tentative de refresh partagée entre les requêtes concurrentes.
  if (!refreshing) {
    refreshing = fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
      .then((r) => r.ok)
      .catch(() => false)
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

/**
 * Client fetch typé.
 * - envoie les cookies httpOnly (`credentials: 'include'`)
 * - sur 401 (hors chemins publics) : tente un refresh puis rejoue la requête,
 *   sinon redirige vers /login
 * - lève `ApiError(status, code, message)` en cas d'échec
 */
export async function http<T>(path: string, init: RequestInit = {}): Promise<T> {
  const isPublic = PUBLIC_PATHS.some((p) => path.startsWith(p));

  const run = (): Promise<Response> => {
    const headers = new Headers(init.headers);
    // Ne pose Content-Type que s'il y a un corps (Fastify rejette un corps vide typé).
    if (init.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    return fetch(`${BASE_URL}${path}`, { ...init, headers, credentials: 'include' });
  };

  let res = await run();

  if (res.status === 401 && !isPublic) {
    const ok = await tryRefresh();
    if (ok) {
      res = await run();
    } else {
      if (typeof window !== 'undefined') {
        window.location.href = '/login?reason=session_expired';
      }
      throw new ApiError(401, 'UNAUTHORIZED', 'Session expirée.');
    }
  }

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const code = (data && (data.code as string)) || 'ERROR';
    const message = (data && (data.message as string)) || `Erreur ${res.status}`;
    throw new ApiError(res.status, code, message);
  }

  return data as T;
}
