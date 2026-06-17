import { randomBytes } from 'crypto';

// Alphabet Crockford base32 sans ambigüités lisibles : pas de 0/O, 1/I/L, U.
// Idéal pour partage WhatsApp ou impression sur un poster de classe.
const ALPHABET = 'ABCDEFGHJKMNPQRSTVWXYZ23456789'; // 30 caractères

/**
 * Génère un code court (par défaut 8 caractères) pour identifier un lien
 * public de salle. Distribution uniforme via rejet du modulo biaisé.
 */
export function generateJoinCode(length = 8): string {
  const alphabetLen = ALPHABET.length;
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
