import { Injectable, Logger } from '@nestjs/common';
import type { ChatCompletion } from 'openai/resources/chat/completions';
import { Mood } from '@prisma/client';
import { OpenAiClient } from '../openai.client';
import { UsageService } from '../usage/usage.service';
import { escapeUserContent } from '../helpers/escapeUserContent';
import { parseModelJson } from '../helpers/parseJSON';

const DETECTOR_MODEL = 'gpt-4o-mini';
const MAX_OUTPUT_TOKENS = 60;

const SYSTEM_PROMPT = `
Tu es un détecteur d'état émotionnel pour un tuteur IA.
Tu reçois les 3 derniers messages de l'apprenant et tu renvoies UN SEUL JSON
strict du type :
  { "mood": "ENGAGED" | "TRIUMPHANT" | "FRUSTRATED" | "CONFUSED" | "BORED" | "ANXIOUS",
    "confidence": 0..1 }

Heuristiques :
- FRUSTRATED  : ton négatif, "j'y arrive pas", "trop dur", insultes, abandon.
- CONFUSED    : questions confuses, "je comprends pas", hésitations, reformulations.
- BORED       : réponses très courtes répétées ("ok", "ouais"), lassitude.
- ANXIOUS     : demandes répétées de validation ("est-ce bon ?", "j'ai bien fait ?").
- TRIUMPHANT  : enthousiasme, "j'ai trouvé", smileys positifs, succès évoqués.
- ENGAGED     : par défaut, ton normal, questions construites, intérêt.

Pas de commentaire, pas d'explication, JUSTE le JSON.
`.trim();

const MOOD_SCHEMA: {
  name: string;
  strict: boolean;
  schema: Record<string, unknown>;
} = {
  name: 'mood_inference',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      mood: {
        type: 'string',
        enum: [
          'ENGAGED',
          'TRIUMPHANT',
          'FRUSTRATED',
          'CONFUSED',
          'BORED',
          'ANXIOUS',
        ],
      },
      confidence: { type: 'number' },
    },
    required: ['mood', 'confidence'],
  },
};

const VALID_MOODS = new Set<Mood>([
  Mood.ENGAGED,
  Mood.TRIUMPHANT,
  Mood.FRUSTRATED,
  Mood.CONFUSED,
  Mood.BORED,
  Mood.ANXIOUS,
]);

@Injectable()
export class MoodDetectorService {
  private readonly logger = new Logger(MoodDetectorService.name);

  constructor(
    private readonly openai: OpenAiClient,
    private readonly usage: UsageService,
  ) {}

  /**
   * Infère un mood à partir des derniers messages apprenant.
   * Conçu pour être lancé en fire-and-forget : ne throw jamais.
   * Retourne null si rien d'exploitable (pas de messages, erreur, etc.).
   */
  async detect(args: {
    userId: string;
    recentLearnerMessages: string[];
  }): Promise<{ mood: Mood; confidence: number } | null> {
    const messages = (args.recentLearnerMessages ?? [])
      .map((m) => escapeUserContent(m, 600))
      .filter(Boolean)
      .slice(-3);

    if (messages.length === 0) return null;

    const startedAt = Date.now();
    try {
      const response = (await this.openai.raw.chat.completions.create({
        model: DETECTOR_MODEL,
        stream: false,
        max_tokens: MAX_OUTPUT_TOKENS,
        response_format: {
          type: 'json_schema',
          json_schema: MOOD_SCHEMA,
        },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: messages
              .map((m, i) => `Message ${i + 1}: ${m}`)
              .join('\n'),
          },
        ],
      })) as ChatCompletion;

      const raw = response.choices[0]?.message?.content ?? '';
      const parsed = parseModelJson<{ mood: string; confidence: number }>(raw);
      const usage = response.usage;
      const durationMs = Date.now() - startedAt;

      void this.usage.log({
        userId: args.userId,
        route: 'mood-detector',
        model: DETECTOR_MODEL,
        inputTokens: usage?.prompt_tokens ?? 0,
        outputTokens: usage?.completion_tokens ?? 0,
        totalTokens: usage?.total_tokens ?? 0,
        durationMs,
        status: 'ok',
      });

      const moodValue = parsed.mood as Mood;
      if (!VALID_MOODS.has(moodValue)) return null;

      const confidence = Math.max(0, Math.min(1, Number(parsed.confidence) || 0));
      return { mood: moodValue, confidence };
    } catch (err) {
      this.logger.warn(
        `Mood detection failed: ${(err as Error)?.message ?? 'unknown'}`,
      );
      void this.usage.log({
        userId: args.userId,
        route: 'mood-detector',
        model: DETECTOR_MODEL,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        durationMs: Date.now() - startedAt,
        status: 'error',
        errorMessage: (err as Error)?.message ?? 'unknown',
      });
      return null;
    }
  }
}
