// JSON schema strict pour la réponse OpenAI d'un tour Hummind.
// Tout champ optionnel est explicitement nullable pour que le schema "strict" tienne.
export const HUMMIND_TURN_SCHEMA: {
  name: string;
  strict: boolean;
  schema: Record<string, unknown>;
} = {
  name: 'hummind_turn',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      message: { type: 'string' },
      microObjective: { type: 'string' },
      interactionKind: {
        type: 'string',
        enum: ['explain', 'quiz', 'exercise', 'checkpoint'],
      },
      question: { type: ['string', 'null'] },
      choices: {
        type: ['array', 'null'],
        items: { type: 'string' },
      },
      correctIndexes: {
        type: ['array', 'null'],
        items: { type: 'integer' },
      },
      hint: { type: ['string', 'null'] },
      conceptKey: { type: ['string', 'null'] },
      conceptLabel: { type: ['string', 'null'] },
      nextAction: {
        type: 'string',
        enum: ['continue', 'quiz', 'practice', 'review'],
      },
      difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
      advanceLesson: { type: 'boolean' },
    },
    required: [
      'message',
      'microObjective',
      'interactionKind',
      'question',
      'choices',
      'correctIndexes',
      'hint',
      'conceptKey',
      'conceptLabel',
      'nextAction',
      'difficulty',
      'advanceLesson',
    ],
  },
} as const;

export interface HummindTurn {
  message: string;
  microObjective: string;
  interactionKind: 'explain' | 'quiz' | 'exercise' | 'checkpoint';
  question: string | null;
  choices: string[] | null;
  correctIndexes: number[] | null;
  hint: string | null;
  conceptKey: string | null;
  conceptLabel: string | null;
  nextAction: 'continue' | 'quiz' | 'practice' | 'review';
  difficulty: 'easy' | 'medium' | 'hard';
  advanceLesson: boolean;
}
