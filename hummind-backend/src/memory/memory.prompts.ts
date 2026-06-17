import type { ChatMessage } from '../ai/ai.types';
import type { LearnerMemory } from './memory.types';

/**
 * Construit les messages de SYNTHÈSE : à partir de la mémoire précédente et
 * des échanges récents, le modèle produit une mémoire mise à jour + un résumé
 * glissant. Contraintes fortes → mémoire qui reste PROPRE (bornée, dédupliquée).
 */
export function buildSynthesisMessages(
  prevMemory: LearnerMemory,
  prevSummary: string | null,
  transcript: ChatMessage[],
): ChatMessage[] {
  const system: ChatMessage = {
    role: 'system',
    content: `Tu maintiens la mémoire d'apprentissage d'un élève. À partir de la mémoire
existante et des échanges récents, renvoie une mémoire MISE À JOUR.

Règles strictes (pour garder la mémoire propre) :
- "summary" : 2 à 3 phrases maximum, réécrites (pas d'accumulation).
- "strengths" et "difficulties" : 5 éléments maximum chacun, fusionne les doublons,
  retire ce qui n'est plus pertinent.
- "rollingSummary" : un résumé condensé de la conversation (5 phrases max) pour
  remplacer les anciens messages.
- Reste factuel, pas de jugement.

Réponds UNIQUEMENT en JSON :
{
  "memory": { "summary": "", "level": "", "strengths": [], "difficulties": [], "pace": "" },
  "rollingSummary": ""
}`,
  };

  const user: ChatMessage = {
    role: 'user',
    content: [
      `Mémoire existante : ${JSON.stringify(prevMemory)}`,
      prevSummary ? `Résumé glissant existant : ${prevSummary}` : '',
      'Échanges récents :',
      transcript.map((m) => `[${m.role}] ${m.content}`).join('\n'),
    ]
      .filter(Boolean)
      .join('\n\n'),
  };

  return [system, user];
}

export interface SynthesisOutput {
  memory: LearnerMemory;
  rollingSummary: string;
}
