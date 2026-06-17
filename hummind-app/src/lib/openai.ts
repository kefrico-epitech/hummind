import OpenAI from "openai";

let _openai: OpenAI | null = null;

/** Lazy-initializes the OpenAI client so it doesn't throw at build time. */
export function getOpenAI(): OpenAI {
  if (!_openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY manquante dans .env");
    }
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

/** @deprecated Use `getOpenAI()` instead to avoid build-time errors. */
export const openai = new Proxy({} as OpenAI, {
  get(_target, prop) {
    return (getOpenAI() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
