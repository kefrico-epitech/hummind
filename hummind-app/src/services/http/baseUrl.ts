const API_VERSION_SUFFIX = /\/api\/v1$/i;

export function resolveApiBaseUrl(): string | null {
  const raw =
    process.env.NEXT_PUBLIC_NEST_API_URL ?? process.env.NEXT_PUBLIC_API_BASE;
  if (!raw) return null;

  const trimmed = raw.trim().replace(/\/+$/, "");
  return API_VERSION_SUFFIX.test(trimmed) ? trimmed : `${trimmed}/api/v1`;
}
