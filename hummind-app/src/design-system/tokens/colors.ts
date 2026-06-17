/**
 * Palette Hummind — source de vérité des couleurs de marque.
 * Le violet `brand` (#6B4EE6) est la couleur primaire ; `mint` pour le succès,
 * `lavender` pour les accents doux.
 */
export const colors = {
  brand: {
    50: '#F2EFFD',
    100: '#E4DEFB',
    200: '#C9BDF7',
    300: '#AD9BF2',
    400: '#9079ED',
    500: '#6B4EE6', // primaire
    600: '#583BD0',
    700: '#452DAA',
    800: '#332184',
    900: '#22165E',
  },
  mint: {
    300: '#5FD0A6',
    400: '#3CBE8E',
    500: '#1FA876', // succès / complétion
  },
  lavender: '#C0BCE4',
  surface: {
    light: '#FFFFFF',
    dark: '#0F0F11',
    card: '#161618',
    cardDark: '#0B0B0D',
  },
  text: {
    primary: '#0F0F11',
    secondary: 'rgba(255,255,255,0.65)',
    muted: 'rgba(255,255,255,0.45)',
  },
} as const;

export type Colors = typeof colors;
