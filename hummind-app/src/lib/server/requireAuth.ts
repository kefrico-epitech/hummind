import { NextResponse } from "next/server";

const COOKIE_NAME = "hm_access";
const TOKEN_CACHE_TTL_MS = 60_000;

type CachedToken = { userId: string; expiresAt: number };
const tokenCache = new Map<string, CachedToken>();

function extractToken(req: Request): string | null {
  const cookieHeader = req.headers.get("cookie") ?? "";
  const match = cookieHeader.match(
    new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`),
  );
  if (match) {
    const token = decodeURIComponent(match[1]).trim();
    if (token) return token;
  }

  const authHeader = req.headers.get("authorization") ?? "";
  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    if (token) return token;
  }

  return null;
}

function unauthorized() {
  return NextResponse.json(
    { error: "Authentification requise" },
    { status: 401 },
  );
}

/**
 * Validates the auth token by calling the backend `/users/me` endpoint.
 * Result is memoized in-memory for 60 seconds per token to avoid hitting the
 * backend on every AI request from the same user.
 *
 * Returns `{ token, userId }` on success or a 401 NextResponse on failure.
 */
export async function requireAuth(
  req: Request,
): Promise<{ token: string; userId: string } | NextResponse> {
  const token = extractToken(req);
  if (!token) return unauthorized();

  const cached = tokenCache.get(token);
  if (cached && cached.expiresAt > Date.now()) {
    return { token, userId: cached.userId };
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_NEST_API_URL ?? process.env.NEXT_PUBLIC_API_BASE;
  if (!baseUrl) {
    return NextResponse.json(
      { error: "Backend d'authentification non configuré" },
      { status: 500 },
    );
  }

  try {
    const res = await fetch(`${baseUrl.replace(/\/+$/, "")}/users/me`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return unauthorized();
    const data = (await res.json()) as { user?: { id?: unknown } };
    const userId =
      typeof data?.user?.id === "string" ? data.user.id : null;
    if (!userId) return unauthorized();

    tokenCache.set(token, {
      userId,
      expiresAt: Date.now() + TOKEN_CACHE_TTL_MS,
    });

    if (tokenCache.size > 1000) {
      const now = Date.now();
      for (const [k, v] of tokenCache) {
        if (v.expiresAt <= now) tokenCache.delete(k);
      }
    }

    return { token, userId };
  } catch {
    return unauthorized();
  }
}
