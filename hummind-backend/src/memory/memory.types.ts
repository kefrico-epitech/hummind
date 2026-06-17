/**
 * Mémoire long terme de l'apprenant — STRUCTURÉE (pas un pavé de texte).
 * Stockée dans LearnerProfile.data ; ré-injectée à chaque session.
 */
export interface LearnerMemory {
  /** 2–3 phrases qui résument qui est l'apprenant. */
  summary: string;
  /** Niveau estimé (ex. « Débutant », « Intermédiaire »). */
  level: string;
  /** Points forts observés. */
  strengths: string[];
  /** Difficultés récurrentes (ce sur quoi adapter l'accompagnement). */
  difficulties: string[];
  /** Rythme / style d'apprentissage. */
  pace: string;
}

export function emptyMemory(): LearnerMemory {
  return { summary: '', level: '', strengths: [], difficulties: [], pace: '' };
}

/** Contexte de leçon injecté au tuteur. */
export interface LessonContext {
  courseTitle: string;
  level?: string;
  domain?: string;
  lessonTitle: string;
  objectives: string[];
  content: string;
}

/** Nombre de tours apprenant avant une re-synthèse de la mémoire. */
export const SYNTHESIS_EVERY = 4;

/** Nombre de messages récents conservés bruts dans le contexte. */
export const RECENT_MESSAGES = 8;
