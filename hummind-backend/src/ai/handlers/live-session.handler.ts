import { Injectable, Logger } from '@nestjs/common';
import type { ChatCompletion } from 'openai/resources/chat/completions';
import { OpenAiClient } from '../openai.client';
import { MemoryService } from '../memory/memory.service';
import { AffectiveService } from '../memory/affective.service';
import { UsageService } from '../usage/usage.service';
import { escapeUserContent } from '../helpers/escapeUserContent';
import { parseModelJson } from '../helpers/parseJSON';
import {
  isModelNotFoundError,
  resolveModelCandidates,
} from '../helpers/resolveModel';
import { HUMMIND_PERSONA_SYSTEM_PROMPT } from '../prompts/persona';
import { buildLearnerProfilePrompt } from '../prompts/learner-profile';
import {
  HUMMIND_TURN_SCHEMA,
  type HummindTurn,
} from '../prompts/turn-schema';
import type { LiveSessionRequestDto } from './live-session.dto';

const MAX_OUTPUT_TOKENS = 1500;
const MODEL_ENV_KEYS = ['OPENAI_LIVE_MODEL', 'OPENAI_COURSE_MODEL', 'OPENAI_MODEL'];
const MODEL_FALLBACKS = ['gpt-4o-mini', 'gpt-4o'];

@Injectable()
export class LiveSessionHandler {
  private readonly logger = new Logger(LiveSessionHandler.name);

  constructor(
    private readonly openai: OpenAiClient,
    private readonly memory: MemoryService,
    private readonly affective: AffectiveService,
    private readonly usage: UsageService,
  ) {}

  /**
   * Génère un tour Hummind complet. Pour la v1 nous renvoyons le JSON complet,
   * le streaming SSE sera branché dans une itération suivante (le format
   * json_schema strict d'OpenAI fonctionne aussi en streaming).
   */
  async handle(args: {
    userId: string;
    firstname: string;
    body: LiveSessionRequestDto;
  }): Promise<{ turn: HummindTurn; usage: { totalTokens: number } }> {
    const startedAt = Date.now();
    const { userId, firstname, body } = args;

    // 1. Lecture du profil apprenant en parallèle de la construction du prompt
    const profile = await this.memory.loadProfile({
      userId,
      courseId: body.course.id,
      firstname,
    });

    // 2. Construction du prompt en 3 blocs system + 1 user.
    const personaBlock = HUMMIND_PERSONA_SYSTEM_PROMPT;
    const profileBlock = buildLearnerProfilePrompt({
      userId,
      courseId: body.course.id,
      firstname,
      summary: profile.summary,
      weakSpots: profile.weakSpots,
      strongSpots: profile.strongSpots,
      preferences: profile.preferences,
      turnsTotal: profile.turnsTotal,
      mood: profile.mood,
      streakWin: profile.streakWin,
      streakLoss: profile.streakLoss,
    });
    const userBlock = this.buildUserBlock(body);

    // 3. Appel OpenAI avec cascade de fallback sur modèle non disponible
    const models = resolveModelCandidates(MODEL_ENV_KEYS, MODEL_FALLBACKS);

    let response: ChatCompletion | null = null;
    let usedModel = models[0];
    let lastError: unknown = null;

    for (const model of models) {
      try {
        response = (await this.openai.raw.chat.completions.create({
          model,
          stream: false,
          max_tokens: MAX_OUTPUT_TOKENS,
          response_format: {
            type: 'json_schema',
            json_schema: HUMMIND_TURN_SCHEMA,
          },
          messages: [
            { role: 'system', content: personaBlock },
            { role: 'system', content: profileBlock },
            { role: 'user', content: userBlock },
          ],
        })) as ChatCompletion;
        usedModel = model;
        break;
      } catch (err) {
        lastError = err;
        if (!isModelNotFoundError(err)) {
          throw err;
        }
        this.logger.warn(`Model ${model} not available, trying next`);
      }
    }

    if (!response) {
      throw new Error(
        `No model available. Last error: ${(lastError as Error)?.message ?? 'unknown'}`,
      );
    }

    const raw = response.choices[0]?.message?.content ?? '';
    const turn = parseModelJson<HummindTurn>(raw);

    const usage = response.usage ?? { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
    const durationMs = Date.now() - startedAt;

    // 4. Post-processing non-bloquant : usage, mémoire, mastery
    // On ne `await` pas pour ne pas allonger la latence perçue.
    void Promise.allSettled([
      this.usage.log({
        userId,
        route: 'live-session',
        model: usedModel,
        inputTokens: usage.prompt_tokens ?? 0,
        outputTokens: usage.completion_tokens ?? 0,
        totalTokens: usage.total_tokens ?? 0,
        durationMs,
        status: 'ok',
      }),
      this.memory.incrementTurn({
        userId,
        courseId: body.course.id,
        tokens: usage.total_tokens ?? 0,
      }),
      this.maybeUpdateMastery({ userId, courseId: body.course.id, body, turn }),
      this.observeAffect({ userId, courseId: body.course.id, body, turn }),
    ]);

    return { turn, usage: { totalTokens: usage.total_tokens ?? 0 } };
  }

  private buildUserBlock(body: LiveSessionRequestDto): string {
    const lines: string[] = [];
    lines.push(`ACTION: ${body.action}`);
    lines.push(`COURS: ${body.course.title}`);
    if (body.course.description) lines.push(`DESCRIPTION: ${body.course.description}`);
    lines.push(`MODULE: ${body.lesson.moduleTitle}`);
    lines.push(`LEÇON: ${body.lesson.title} (${body.lesson.kind})`);
    if (body.lesson.paragraphs?.length) {
      lines.push('CONTENU DE LA LEÇON:');
      for (const p of body.lesson.paragraphs.slice(0, 10)) {
        lines.push(`- ${p}`);
      }
    }
    if (body.action === 'ANSWER' && body.answer) {
      if (typeof body.answer.choiceIndex === 'number') {
        lines.push(`RÉPONSE APPRENANT (choix): ${body.answer.choiceIndex}`);
      }
      if (body.answer.text) {
        lines.push(
          `RÉPONSE APPRENANT (texte): ${escapeUserContent(body.answer.text, 1000)}`,
        );
      }
    }
    return lines.join('\n');
  }

  private async maybeUpdateMastery(args: {
    userId: string;
    courseId: string;
    body: LiveSessionRequestDto;
    turn: HummindTurn;
  }): Promise<void> {
    if (args.body.action !== 'ANSWER') return;
    if (!args.turn.conceptKey || !args.turn.conceptLabel) return;

    // On considère que la réponse est correcte si le tour suivant propose
    // d'avancer (advanceLesson) plutôt que de réexpliquer.
    const success = args.turn.advanceLesson;

    await this.memory.updateMastery({
      userId: args.userId,
      courseId: args.courseId,
      conceptKey: args.turn.conceptKey,
      label: args.turn.conceptLabel,
      success,
    });
  }

  private async observeAffect(args: {
    userId: string;
    courseId: string;
    body: LiveSessionRequestDto;
    turn: HummindTurn;
  }): Promise<void> {
    const learnerMessage = args.body.answer?.text ?? '';
    const success =
      args.body.action === 'ANSWER' ? args.turn.advanceLesson : undefined;

    await this.affective.observe({
      userId: args.userId,
      courseId: args.courseId,
      sessionId: args.body.sessionId,
      success,
      messageLength: learnerMessage.length,
      learnerMessage,
    });
  }
}
