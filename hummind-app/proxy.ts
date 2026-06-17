import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";

const COOKIE_NAME = "hm_access";

const LOCALES = ["fr", "en"] as const;
const DEFAULT_LOCALE = "fr";

const intlMiddleware = createMiddleware({
  locales: [...LOCALES],
  defaultLocale: DEFAULT_LOCALE,
});

const ROUTE_RULES = {
  // Public routes (visitors): no /register anymore (Flow v2 — accounts
  // are only created by ROOT, OWNER/ADMIN or via /join/[code]).
  public: [
    "/login",
    "/first-login",
    "/forgot-password",
    "/activate",
    "/recovery-password",
  ],
  protected: [
    "/dashboard",
    "/settings",
    "/notifications",
    "/organisation",
    "/access",
    "/departement",
    "/salle",
    "/invitations",
    "/switch",
    "/switch-org",
    "/learner",
    "/admin",
  ],
} as const;

/* ===========================
   Utils
=========================== */

function getLocale(pathname: string): string {
  const seg = pathname.split("/")[1];
  return LOCALES.includes(seg as (typeof LOCALES)[number]) ? seg : DEFAULT_LOCALE;
}

// ✅ Match exact → routes publiques uniquement
function matchExact(
  pathname: string,
  locale: string,
  routes: readonly string[]
) {
  return routes.some((route) => pathname === `/${locale}${route}`);
}

// ✅ Match route + sous-routes → routes protégées
function matchWithChildren(
  pathname: string,
  locale: string,
  routes: readonly string[]
) {
  return routes.some((route) => {
    const base = `/${locale}${route}`;
    return pathname === base || pathname.startsWith(`${base}/`);
  });
}

function isSkippablePath(pathname: string) {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    /\.[a-zA-Z0-9]+$/.test(pathname)
  );
}

function redirectTo(path: string, req: NextRequest) {
  const url = new URL(path, req.url);
  return NextResponse.redirect(url);
}

/* ===========================
   Middleware principal
=========================== */

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1️⃣ Ignore assets / api / fichiers
  if (isSkippablePath(pathname)) {
    return NextResponse.next();
  }

  const locale = getLocale(pathname);
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const isAuthenticated = Boolean(token);

  const isPublic = matchExact(pathname, locale, ROUTE_RULES.public);
  const isProtected = matchWithChildren(
    pathname,
    locale,
    ROUTE_RULES.protected
  );

  const isRoot = pathname === "/" || pathname === `/${locale}`;

  // 🏠 Racine
  if (isRoot) {
    if (isAuthenticated) {
      return redirectTo(`/${locale}/organisation?entry=1`, req);
    }
    return intlMiddleware(req);
  }

  // 🔒 Non connecté + route protégée
  if (!isAuthenticated && isProtected) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = `/${locale}/login`;
    loginUrl.searchParams.set("next", `${pathname}${req.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  // 🔓 Connecté + route publique exacte
  if (isAuthenticated && isPublic) {
    return redirectTo(`/${locale}/organisation?entry=1`, req);
  }
  return intlMiddleware(req);
}

// 👇 Middleware officiel Next.js
export default async function middleware(req: NextRequest) {
  return proxy(req);
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|.*\\..*).*)"],
};
