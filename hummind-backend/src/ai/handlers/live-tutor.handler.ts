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
import type { LiveTutorRequestDto } from './live-tutor.dto';

const MAX_OUTPUT_TOKENS = 800;
const MODEL_ENV_KEYS = ['OPENAI_LIVE_MODEL', 'OPENAI_MODEL'];
const MODEL_FALLBACKS = ['gpt-4o-mini', 'gpt-4o'];

const TUTOR_RESPONSE_SCHEMA: {
  name: string;
  strict: boolean;
  schema: Record<string, unknown>;
} = {
  name: 'tutor_response',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      reply: {
        type: 'object',
        additionalProperties: false,
        properties: {
          message: { type: 'string' },
          suggestedPrompts: {
            type: 'array',
            items: { type: 'string' },
          },
          evaluation: { type: ['string', 'null'] },
          canContinue: { type: 'boolean' },
        },
        required: ['message', 'suggestedPrompts', 'evaluation', 'canContinue'],
      },
    },
    required: ['reply'],
  },
};

export interface TutorResponse {
  reply: {
    message: string;
    suggestedPrompts: string[];
    evaluation: string | null;
    canContinue: boolean;
  };
}

@Injectable()
export class LiveTutorHandler {
  private readonly logger = new Logger(LiveTutorHandler.name);

  constructor(
    private readonly openai: OpenAiClient,
    private readonly memory: MemoryService,
    private readonly affective: AffectiveService,
    private readonly usage: UsageService,
  ) {}

  async handle(args: {
    userId: string;
    firstname: string;
    body: LiveTutorRequestDto;
  }): Promise<TutorResponse> {
    const startedAt = Date.now();
    const { userId, firstname, body } = args;

    const profile = await this.memory.loadProfile({
      userId,
      courseId: body.course.id,
      firstname,
    });

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
            json_schema: TUTOR_RESPONSE_SCHEMA,
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
        if (!isModelNotFoundError(err)) throw err;
        this.logger.warn(`Model ${model} not available, trying next`);
      }
    }

    if (!response) {
      throw new Error(
        `No model available. Last error: ${(lastError as Error)?.message ?? 'unknown'}`,
      );
    }

    const raw = response.choices[0]?.message?.content ?? '';
    const parsed = parseModelJson<TutorResponse>(raw);
    const usage = response.usage;
    const durationMs = Date.now() - startedAt;

    void Promise.allSettled([
      this.usage.log({
        userId,
        route: 'live-tutor',
        model: usedModel,
        inputTokens: usage?.prompt_tokens ?? 0,
        outputTokens: usage?.completion_tokens ?? 0,
        totalTokens: usage?.total_tokens ?? 0,
        durationMs,
        status: 'ok',
      }),
      this.memory.incrementTurn({
        userId,
        courseId: body.course.id,
        tokens: usage?.total_tokens ?? 0,
      }),
      this.observeAffect({ userId, body, response: parsed }),
    ]);

    return parsed;
  }

  private buildUserBlock(body: LiveTutorRequestDto): string {
    const lines: string[] = [];
    lines.push(`ACTION: ${body.action}`);
    if (body.language) lines.push(`LANGUE: ${body.language}`);
    lines.push(`COURS: ${body.course.title}`);
    if (body.course.description) lines.push(`DESCRIPTION: ${body.course.description}`);
    lines.push(`ÉTAPE: ${body.step.title} (${body.step.kind})`);
    if (body.step.paragraphs?.length) {
      lines.push('CONTENU:');
      for (const p of body.step.paragraphs.slice(0, 8)) lines.push(`- ${p}`);
    }
    if (body.nextStep) {
      lines.push(`ÉTAPE SUIVANTE: ${body.nextStep.title} (${body.nextStep.kind})`);
    }
    if (body.learner.message) {
      lines.push(`MESSAGE APPRENANT: ${escapeUserContent(body.learner.message, 1000)}`);
    }
    if (body.learner.answer) {
      lines.push(`RÉPONSE APPRENANT: ${escapeUserContent(body.learner.answer, 1000)}`);
    }
    if (typeof body.learner.answerIndex === 'number') {
      lines.push(`INDICE DE RÉPONSE: ${body.learner.answerIndex}`);
    }
    if (body.learner.exerciseAttempt) {
      lines.push(`TENTATIVE EXERCICE: ${escapeUserContent(body.learner.exerciseAttempt, 1500)}`);
    }
    lines.push('');
    lines.push(
      'Réponds au format JSON strict { reply: { message, suggestedPrompts, evaluation, canContinue } }.',
    );
    lines.push(
      'message = ta réponse à l\'apprenant. suggestedPrompts = 2-3 questions pour relancer. evaluation = courte phrase d\'évaluation si applicable, sinon null. canContinue = true si l\'apprenant peut passer à l\'étape suivante.',
    );
    return lines.join('\n');
  }

  private async observeAffect(args: {
    userId: string;
    body: LiveTutorRequestDto;
    response: TutorResponse;
  }): Promise<void> {
    const learnerMessage =
      args.body.learner.message ??
      args.body.learner.answer ??
      args.body.learner.exerciseAttempt ??
      '';
    const success =
      args.body.action === 'QUIZ_FEEDBACK' || args.body.action === 'EXERCISE_FEEDBACK'
        ? args.response.reply.canContinue
        : undefined;
    await this.affective.observe({
      userId: args.userId,
      courseId: args.body.course.id,
      success,
      messageLength: learnerMessage.length,
      learnerMessage,
    });
  }
}
