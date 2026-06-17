import type { ChatMessage } from '../ai/ai.types';
import { TUTOR_PERSONA } from './tutor.persona';
import type { LearnerMemory, LessonContext } from './memory.types';

export interface BuildContextInput {
  lesson: LessonContext;
  memory: LearnerMemory;
  /** Extraits du cours pertinents pour la question (RAG). */
  ragChunks: string[];
  /** Résumé glissant de la conversation (mémoire courte compressée). */
  rollingSummary: string | null;
  /** Messages récents bruts (déjà bornés), incluant le dernier de l'apprenant. */
  recentMessages: ChatMessage[];
}

/**
 * Assemble le contexte du tuteur en une liste de messages — fonction PURE.
 * Ordre : persona → contexte leçon → RAG → profil → résumé → messages récents.
 */
export function buildTutorContext(input: BuildContextInput): ChatMessage[] {
  const { lesson, memory, ragChunks, rollingSummary, recentMessages } = input;

  const sections: string[] = [TUTOR_PERSONA];

  sections.push(
    [
      '## Contexte de la leçon',
      `Cours : ${lesson.courseTitle}${lesson.level ? ` (niveau ${lesson.level})` : ''}${
        lesson.domain ? ` — domaine ${lesson.domain}` : ''
      }`,
      `Leçon : ${lesson.lessonTitle}`,
      lesson.objectives.length ? `Objectifs : ${lesson.objectives.join(' ; ')}` : '',
      lesson.content ? `Contenu :\n${lesson.content}` : '',
    ]
      .filter(Boolean)
      .join('\n'),
  );

  if (ragChunks.length) {
    sections.push(`## Extraits du cours (référence)\n${ragChunks.join('\n---\n')}`);
  }

  if (hasMemory(memory)) {
    sections.push(
      [
        '## Profil de l’apprenant',
        memory.summary && `Résumé : ${memory.summary}`,
        memory.level && `Niveau : ${memory.level}`,
        memory.strengths.length && `Forces : ${memory.strengths.join(', ')}`,
        memory.difficulties.length && `Difficultés : ${memory.difficulties.join(', ')}`,
        memory.pace && `Rythme : ${memory.pace}`,
      ]
        .filter(Boolean)
        .join('\n'),
    );
  }

  if (rollingSummary) {
    sections.push(`## Résumé des échanges précédents\n${rollingSummary}`);
  }

  const system: ChatMessage = { role: 'system', content: sections.join('\n\n') };
  return [system, ...recentMessages];
}

function hasMemory(m: LearnerMemory): boolean {
  return Boolean(
    m.summary || m.level || m.pace || m.strengths.length || m.difficulties.length,
  );
}
