const AUTH_COOKIE = "hm_access";

export function readAuthTokenFromDocument(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(^| )${AUTH_COOKIE}=([^;]+)`),
  );
  return match ? decodeURIComponent(match[2]) : null;
}
