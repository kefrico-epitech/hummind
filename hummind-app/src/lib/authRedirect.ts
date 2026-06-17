export function getSafeNextPath(value: string | null | undefined): string | null {
  if (!value) return null;

  const nextPath = value.trim();
  if (!nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return null;
  }

  return nextPath;
}

export function appendNextParam(
  path: string,
  nextPath: string | null | undefined,
): string {
  if (!nextPath) return path;

  const params = new URLSearchParams();
  params.set("next", nextPath);

  return `${path}?${params.toString()}`;
}
