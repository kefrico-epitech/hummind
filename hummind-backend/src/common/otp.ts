import { randomInt } from 'crypto';

/** Génère un code OTP à N chiffres (défaut 6). Uniforme. */
export function generateOtpCode(digits = 6): string {
  const max = 10 ** digits;
  // randomInt(max) renvoie 0..max-1, on padLeft pour garantir la longueur.
  const n = randomInt(max);
  return n.toString().padStart(digits, '0');
}
