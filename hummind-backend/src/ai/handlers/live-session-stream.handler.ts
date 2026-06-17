import { Injectable, Logger } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
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

/**
 * Streaming variant of LiveSessionHandler. Extracts the "message" field as it
 * grows in the JSON output and emits SSE delta events so the UI can paint
 * tokens in real time. Final turn is parsed and emitted as a "done" event,
 * then post-processing runs asynchronously.
 */
@Injectable()
export class LiveSessionStreamHandler {
  private readonly logger = new Logger(LiveSessionStreamHandler.name);

  constructor(
    private readonly openai: OpenAiClient,
    private readonly memory: MemoryService,
    private readonly affective: AffectiveService,
    private readonly usage: UsageService,
  ) {}

  async stream(args: {
    userId: string;
    firstname: string;
    body: LiveSessionRequestDto;
    reply: FastifyReply;
  }): Promise<void> {
    const { userId, firstname, body, reply } = args;
    const startedAt = Date.now();

    this.openSseStream(reply);

    let buffer = '';
    let emittedMessageLength = 0;
    let usedModel = MODEL_FALLBACKS[0];
    let totalTokens = 0;

    try {
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

      let stream: AsyncIterable<{
        choices?: { delta?: { content?: string | null } }[];
        usage?: {
          prompt_tokens?: number;
          completion_tokens?: number;
          total_tokens?: number;
        };
      }> | null = null;
      let lastError: unknown = null;

      for (const model of models) {
        try {
          stream = (await this.openai.raw.chat.completions.create({
            model,
            stream: true,
            stream_options: { include_usage: true },
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
          })) as unknown as AsyncIterable<{
            choices?: { delta?: { content?: string | null } }[];
            usage?: {
              prompt_tokens?: number;
              completion_tokens?: number;
              total_tokens?: number;
            };
          }>;
          usedModel = model;
          break;
        } catch (err) {
          lastError = err;
          if (!isModelNotFoundError(err)) throw err;
          this.logger.warn(`Model ${model} not available, trying next`);
        }
      }

      if (!stream) {
        throw new Error(
          `No model available. Last error: ${(lastError as Error)?.message ?? 'unknown'}`,
        );
      }

      let lastUsage: {
        prompt_tokens?: number;
        completion_tokens?: number;
        total_tokens?: number;
      } | null = null;

      for await (const chunk of stream) {
        const delta = chunk.choices?.[0]?.delta?.content ?? '';
        if (delta) {
          buffer += delta;
          const extracted = extractMessageProgress(buffer);
          if (extracted && extracted.length > emittedMessageLength) {
            const slice = extracted.slice(emittedMessageLength);
            emittedMessageLength = extracted.length;
            this.sendEvent(reply, 'delta', { text: slice });
          }
        }
        if (chunk.usage) {
          lastUsage = chunk.usage;
        }
      }

      const turn = parseModelJson<HummindTurn>(buffer);
      this.sendEvent(reply, 'done', { turn });
      this.endSseStream(reply);

      totalTokens = lastUsage?.total_tokens ?? 0;
      const durationMs = Date.now() - startedAt;

      // Post-processing non bloquant
      void Promise.allSettled([
        this.usage.log({
          userId,
          route: 'live-session/stream',
          model: usedModel,
          inputTokens: lastUsage?.prompt_tokens ?? 0,
          outputTokens: lastUsage?.completion_tokens ?? 0,
          totalTokens,
          durationMs,
          status: 'ok',
        }),
        this.memory.incrementTurn({
          userId,
          courseId: body.course.id,
          tokens: totalTokens,
        }),
        this.maybeUpdateMastery({
          userId,
          courseId: body.course.id,
          body,
          turn,
        }),
        this.observeAffect({ userId, courseId: body.course.id, body, turn }),
      ]);
    } catch (err) {
      this.logger.error('live-session stream failed', err as Error);
      this.sendEvent(reply, 'error', {
        message: (err as Error)?.message ?? 'unknown',
      });
      this.endSseStream(reply);

      void this.usage.log({
        userId,
        route: 'live-session/stream',
        model: usedModel,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        durationMs: Date.now() - startedAt,
        status: 'error',
        errorMessage: (err as Error)?.message ?? 'unknown',
      });
    }
  }

  private openSseStream(reply: FastifyReply): void {
    reply.hijack();
    const raw = reply.raw;
    raw.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    raw.setHeader('Cache-Control', 'no-cache, no-transform');
    raw.setHeader('Connection', 'keep-alive');
    raw.setHeader('X-Accel-Buffering', 'no'); // disable nginx buffering
    raw.flushHeaders?.();
  }

  private sendEvent(
    reply: FastifyReply,
    event: 'delta' | 'done' | 'error',
    data: unknown,
  ): void {
    reply.raw.write(`event: ${event}\n`);
    reply.raw.write(`data: ${JSON.stringify(data)}\n\n`);
  }

  private endSseStream(reply: FastifyReply): void {
    reply.raw.end();
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
    await this.memory.updateMastery({
      userId: args.userId,
      courseId: args.courseId,
      conceptKey: args.turn.conceptKey,
      label: args.turn.conceptLabel,
      success: args.turn.advanceLesson,
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

/**
 * Extrait incrémentalement la valeur du champ "message" depuis un JSON partiel.
 * Retourne null si le champ n'a pas encore été ouvert.
 *
 * Implémentation : on retire la portion avant `"message":` puis on
 * lit caractère par caractère en gérant les échappements jusqu'au prochain `"`
 * non échappé OU jusqu'à la fin de buffer si la chaîne est encore ouverte.
 */
function extractMessageProgress(jsonBuffer: string): string | null {
  const marker = '"message"';
  const idx = jsonBuffer.indexOf(marker);
  if (idx === -1) return null;
  let i = idx + marker.length;
  while (i < jsonBuffer.length && jsonBuffer[i] !== '"') i += 1;
  if (i >= jsonBuffer.length) return null;
  i += 1; // skip opening quote
  let out = '';
  while (i < jsonBuffer.length) {
    const ch = jsonBuffer[i];
    if (ch === '\\') {
      if (i + 1 >= jsonBuffer.length) break;
      const next = jsonBuffer[i + 1];
      switch (next) {
        case 'n': out += '\n'; break;
        case 't': out += '\t'; break;
        case '"': out += '"'; break;
        case '\\': out += '\\'; break;
        case '/': out += '/'; break;
        default: out += next;
      }
      i += 2;
    } else if (ch === '"') {
      return out; // closing quote
    } else {
      out += ch;
      i += 1;
    }
  }
  return out;
}
