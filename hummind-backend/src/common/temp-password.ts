import { randomBytes } from 'crypto';

// Alphabet sans ambigüités (Crockford-like) : pas de 0/O, 1/I/L, etc.
// 30 caractères : 24 lettres + 6 chiffres lisibles.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/**
 * Génère un mot de passe temporaire de 12 caractères lisibles, par défaut.
 * Utilise crypto.randomBytes pour une distribution uniforme.
 */
export function generateTempPassword(length = 12): string {
  const alphabetLen = ALPHABET.length;
  // On rejette les bytes >= 256 - (256 % alphabetLen) pour éviter le biais
  // modulo. En pratique l'overhead est négligeable car alphabetLen=31.
  const max = 256 - (256 % alphabetLen);
  const out: string[] = [];
  while (out.length < length) {
    const bytes = randomBytes(length * 2);
    for (let i = 0; i < bytes.length && out.length < length; i += 1) {
      const b = bytes[i];
      if (b < max) {
        out.push(ALPHABET[b % alphabetLen]);
      }
    }
  }
  return out.join('');
}
