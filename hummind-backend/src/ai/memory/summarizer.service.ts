import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import type { ChatCompletion } from 'openai/resources/chat/completions';
import { PrismaService } from '../../prisma/prisma.service';
import { OpenAiClient } from '../openai.client';
import { UsageService } from '../usage/usage.service';
import { MemoryService } from './memory.service';
import { escapeUserContent } from '../helpers/escapeUserContent';
import {
  HUMMIND_TURN_COMPLETED_EVENT,
  type HummindTurnCompletedPayload,
} from './summarizer.events';

const TRIGGER_EVERY_TURNS = 10;
const SUMMARIZER_MODEL = 'gpt-4o-mini';
const MAX_OUTPUT_TOKENS = 600;
const TARGET_SUMMARY_CHARS = 2000;
const MAX_INPUT_MESSAGES = 40;

const SYSTEM_PROMPT = `
Tu es un assistant qui produit la MÉMOIRE LONGUE d'un apprenant à propos d'un cours.
On te donne :
- la mémoire actuelle (peut être vide),
- la liste des derniers messages (rôle "tutor" = Hummind, rôle "learner" = l'apprenant),
- la liste des concepts récemment maîtrisés (mastery >= 0.7),
- la liste des concepts en difficulté (mastery < 0.5).

Tu renvoies UNE SEULE chaîne de texte (pas de JSON, pas de bullets) qui :
- résume en 3 à 6 phrases concises ce que l'apprenant a appris, où il bloque,
  son style d'apprentissage observé,
- mentionne explicitement les points faibles à retravailler,
- mentionne les acquis pour ne pas y revenir inutilement,
- ne dépasse JAMAIS ${TARGET_SUMMARY_CHARS} caractères,
- est rédigé à la 3e personne ("L'apprenant maîtrise X, peine sur Y...").

Pas d'émojis. Pas de salutation. Pas de "voici le résumé".
`.trim();

@Injectable()
export class SummarizerService {
  private readonly logger = new Logger(SummarizerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly openai: OpenAiClient,
    private readonly usage: UsageService,
    private readonly memory: MemoryService,
  ) {}

  /**
   * Listener déclenché par MemoryService.incrementTurn. On filtre ici (plutôt
   * que via une second émission) pour garder la logique de cadence centralisée.
   */
  @OnEvent(HUMMIND_TURN_COMPLETED_EVENT, { async: true })
  async onTurnCompleted(payload: HummindTurnCompletedPayload): Promise<void> {
    if (payload.turnsTotal <= 0) return;
    if (payload.turnsTotal % TRIGGER_EVERY_TURNS !== 0) return;
    try {
      await this.refreshSummary(payload);
    } catch (err) {
      this.logger.error(
        `Summarizer failed for user=${payload.userId} course=${payload.courseId}`,
        err as Error,
      );
    }
  }

  private async refreshSummary(payload: HummindTurnCompletedPayload): Promise<void> {
    const { userId, courseId } = payload;

    const [memory, weak, strong, session] = await Promise.all([
      this.prisma.learnerMemory.findUnique({
        where: { userId_courseId: { userId, courseId } },
      }),
      this.prisma.conceptMastery.findMany({
        where: { userId, courseId, mastery: { lt: 0.5 }, attempts: { gt: 0 } },
        orderBy: { mastery: 'asc' },
        take: 8,
      }),
      this.prisma.conceptMastery.findMany({
        where: { userId, courseId, mastery: { gte: 0.7 } },
        orderBy: { mastery: 'desc' },
        take: 8,
      }),
      this.prisma.courseSession.findFirst({
        where: { userId, courseId },
        orderBy: { updatedAt: 'desc' },
        select: { messages: true },
      }),
    ]);

    type Msg = { role?: string; content?: string };
    const recent = (Array.isArray(session?.messages) ? session.messages : [])
      .slice(-MAX_INPUT_MESSAGES)
      .filter((m): m is Msg => m !== null && typeof m === 'object')
      .map((m) => {
        const role = m.role === 'tutor' ? 'Hummind' : 'Apprenant';
        const content = escapeUserContent(String(m.content ?? ''), 400);
        return `${role}: ${content}`;
      })
      .join('\n');

    const currentSummary = memory?.summary || '(aucune mémoire pour l\'instant)';
    const weakBlock = weak
      .map((c) => `- ${c.label} (mastery=${c.mastery.toFixed(2)}, ${c.attempts} essais)`)
      .join('\n') || '(aucun point faible identifié)';
    const strongBlock = strong
      .map((c) => `- ${c.label} (mastery=${c.mastery.toFixed(2)})`)
      .join('\n') || '(aucun acquis solide identifié)';

    const userBlock = [
      'MÉMOIRE ACTUELLE:',
      currentSummary,
      '',
      'POINTS FAIBLES:',
      weakBlock,
      '',
      'ACQUIS:',
      strongBlock,
      '',
      'DERNIERS ÉCHANGES:',
      recent || '(aucun échange disponible)',
    ].join('\n');

    const startedAt = Date.now();
    let summary = '';
    let inputTokens = 0;
    let outputTokens = 0;
    let totalTokens = 0;

    try {
      const response = (await this.openai.raw.chat.completions.create({
        model: SUMMARIZER_MODEL,
        stream: false,
        max_tokens: MAX_OUTPUT_TOKENS,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userBlock },
        ],
      })) as ChatCompletion;

      summary = (response.choices[0]?.message?.content ?? '').trim();
      inputTokens = response.usage?.prompt_tokens ?? 0;
      outputTokens = response.usage?.completion_tokens ?? 0;
      totalTokens = response.usage?.total_tokens ?? 0;
    } catch (err) {
      void this.usage.log({
        userId,
        route: 'summarizer',
        model: SUMMARIZER_MODEL,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        durationMs: Date.now() - startedAt,
        status: 'error',
        errorMessage: (err as Error)?.message ?? 'unknown',
      });
      throw err;
    }

    if (summary.length === 0) {
      this.logger.warn('Summarizer returned empty content, skipping write');
    } else {
      await this.memory.refreshSummary({ userId, courseId, summary });
    }

    void this.usage.log({
      userId,
      route: 'summarizer',
      model: SUMMARIZER_MODEL,
      inputTokens,
      outputTokens,
      totalTokens,
      durationMs: Date.now() - startedAt,
      status: 'ok',
    });

    this.logger.log(
      `Summary refreshed for user=${userId} course=${courseId} (${summary.length} chars)`,
    );
  }
}
