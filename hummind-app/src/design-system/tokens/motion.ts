/**
 * Presets d'animation (Framer Motion). Durées et variantes communes.
 * Respecter `prefers-reduced-motion` au niveau du MotionProvider.
 */
export const durations = {
  fast: 0.15,
  base: 0.25,
  slow: 0.45,
  slower: 0.7,
} as const;

export const easing = {
  out: [0.16, 1, 0.3, 1],
  inOut: [0.65, 0, 0.35, 1],
} as const;

export const variants = {
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: durations.base } },
  },
  slideUp: {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: durations.base, ease: easing.out } },
  },
  scaleIn: {
    hidden: { opacity: 0, scale: 0.96 },
    visible: { opacity: 1, scale: 1, transition: { duration: durations.base, ease: easing.out } },
  },
  stagger: {
    visible: { transition: { staggerChildren: 0.06 } },
  },
} as const;
