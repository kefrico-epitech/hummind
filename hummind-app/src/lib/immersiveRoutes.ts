const IMMERSIVE_ORGANISATION_ROUTE_PATTERNS = [/^\/course\/[^/]+\/live\/?$/];

export function getPathWithoutLocale(pathname: string | null) {
  if (!pathname) return "/";

  const normalizedPathname = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const segments = normalizedPathname.split("/");
  const localeSegment = segments[1] ?? "";

  if (/^[a-z]{2}(?:-[A-Z]{2})?$/.test(localeSegment)) {
    return "/" + segments.slice(2).join("/");
  }

  return normalizedPathname;
}

export function isImmersiveOrganisationPath(pathname: string | null) {
  const pathWithoutLocale = getPathWithoutLocale(pathname);

  return IMMERSIVE_ORGANISATION_ROUTE_PATTERNS.some((pattern) =>
    pattern.test(pathWithoutLocale),
  );
}
