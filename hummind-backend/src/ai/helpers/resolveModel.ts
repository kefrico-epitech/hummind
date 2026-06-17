function unique(values: string[]): string[] {
  return [...new Set(values.map((v) => v.trim()).filter(Boolean))];
}

export function resolveModelCandidates(envKeys: string[], fallbacks: string[]): string[] {
  const fromEnv = envKeys.map((k) => process.env[k] ?? '');
  return unique([...fromEnv, ...fallbacks]);
}

export type OpenAiErrorLike = {
  status?: unknown;
  code?: unknown;
  message?: unknown;
  error?: { code?: unknown; message?: unknown };
};

export function isModelNotFoundError(error: unknown): boolean {
  const err = (error ?? {}) as OpenAiErrorLike;
  const status = Number(err.status);
  const code =
    (typeof err.code === 'string' ? err.code : '') ||
    (typeof err.error?.code === 'string' ? err.error.code : '');
  const message =
    (typeof err.message === 'string' ? err.message : '') ||
    (typeof err.error?.message === 'string' ? err.error.message : '');

  if (code.toLowerCase() === 'model_not_found') return true;
  if (status === 400 && /does not exist|model|not found/i.test(message)) return true;
  return false;
}
