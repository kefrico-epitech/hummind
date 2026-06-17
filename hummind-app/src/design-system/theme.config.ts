/**
 * 🎨 Source unique de vérité pour la police, le mode visuel et les réglages
 * globaux du thème Hummind.
 */
export const theme = {
  fonts: {
    sans: 'var(--font-inter)',
    display: 'var(--font-poppins)',
  },
  /** Mode visuel par défaut. À brancher sur un toggle si on fait du dark. */
  mode: 'light' as 'light' | 'dark',
  /** Politique de mouvement : 'auto' respecte prefers-reduced-motion. */
  motion: 'auto' as 'auto' | 'reduced' | 'off',
} as const;

/** Classe appliquée sur <body>. */
export const themeBodyClass = 'min-h-screen bg-white text-[#0F0F11] antialiased';
