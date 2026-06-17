import { z } from 'zod';

/**
 * Variables d'environnement PUBLIQUES (exposées au client).
 * Aucune valeur secrète ici — les secrets restent côté backend.
 */
const schema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url().default('http://localhost:5500'),
  NEXT_PUBLIC_APP_NAME: z.string().default('Hummind'),
});

// Next.js inline les `NEXT_PUBLIC_*` à la compilation : on les référence explicitement.
export const env = schema.parse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
});
