const DEFAULT_ERROR = "Erreur de requete";

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Erreur inconnue";
}

export function extractErrorMessage(data: unknown): string {
  if (!data || typeof data !== "object" || !("message" in data)) {
    return DEFAULT_ERROR;
  }

  const message = (data as { message?: unknown }).message;

  if (typeof message === "string" && message.trim()) return message;

  if (Array.isArray(message)) {
    const messages = message.filter(
      (item): item is string =>
        typeof item === "string" && item.trim().length > 0,
    );
    if (messages.length > 0) return messages.join("\n");
  }

  return DEFAULT_ERROR;
}
