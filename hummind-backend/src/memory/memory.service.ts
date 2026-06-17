import { Injectable, Logger } from '@nestjs/common';
import { TutorRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import type { ChatMessage, ChatRole } from '../ai/ai.types';
import { emptyMemory, RECENT_MESSAGES, SYNTHESIS_EVERY, type LearnerMemory } from './memory.types';
import { buildSynthesisMessages, type SynthesisOutput } from './memory.prompts';

const toChatRole = (r: TutorRole): ChatRole =>
  r === TutorRole.ASSISTANT ? 'assistant' : r === TutorRole.SYSTEM ? 'system' : 'user';

const toTutorRole = (r: ChatRole): TutorRole =>
  r === 'assistant' ? TutorRole.ASSISTANT : r === 'system' ? TutorRole.SYSTEM : TutorRole.USER;

/**
 * Gère la MÉMOIRE du tuteur — séparée des appels LLM.
 *  - long terme : LearnerProfile.data (structuré)
 *  - courte : N derniers messages + résumé glissant (TutorConversation.summary)
 *  - synthèse périodique : compresse et structure → mémoire qui reste propre.
 */
@Injectable()
export class MemoryService {
  private readonly logger = new Logger(MemoryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
  ) {}

  // ── Mémoire long terme ────────────────────────────────────
  async recall(userId: string): Promise<LearnerMemory> {
    const profile = await this.prisma.learnerProfile.findUnique({ where: { userId } });
    if (!profile) return emptyMemory();
    return { ...emptyMemory(), ...(profile.data as Partial<LearnerMemory>) };
  }

  private async saveMemory(userId: string, memory: LearnerMemory): Promise<void> {
    await this.prisma.learnerProfile.upsert({
      where: { userId },
      update: { summary: memory.summary, data: memory },
      create: { userId, summary: memory.summary, data: memory },
    });
  }

  // ── Conversation (mémoire courte) ─────────────────────────
  async getOrCreateConversation(enrollmentId: string, lessonId: string) {
    return this.prisma.tutorConversation.upsert({
      where: { enrollmentId_lessonId: { enrollmentId, lessonId } },
      update: {},
      create: { enrollmentId, lessonId },
    });
  }

  async recentMessages(conversationId: string): Promise<ChatMessage[]> {
    const rows = await this.prisma.tutorMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: RECENT_MESSAGES,
    });
    return rows
      .reverse()
      .map((m) => ({ role: toChatRole(m.role), content: m.content }));
  }

  async appendMessage(
    conversationId: string,
    role: ChatRole,
    content: string,
    tokensUsed = 0,
  ): Promise<void> {
    await this.prisma.tutorMessage.create({
      data: { conversationId, role: toTutorRole(role), content, tokensUsed },
    });
  }

  // ── Synthèse périodique (garde la mémoire propre) ─────────
  /**
   * Tous les SYNTHESIS_EVERY tours de l'apprenant : compresse les échanges en
   * un résumé glissant + met à jour la mémoire structurée long terme.
   */
  async maybeSynthesize(conversationId: string, userId: string): Promise<void> {
    const userTurns = await this.prisma.tutorMessage.count({
      where: { conversationId, role: TutorRole.USER },
    });
    if (userTurns === 0 || userTurns % SYNTHESIS_EVERY !== 0) return;

    try {
      const [conversation, prevMemory, transcript] = await Promise.all([
        this.prisma.tutorConversation.findUnique({ where: { id: conversationId } }),
        this.recall(userId),
        this.recentMessages(conversationId),
      ]);

      const { data } = await this.ai.generateJson<SynthesisOutput>(
        buildSynthesisMessages(prevMemory, conversation?.summary ?? null, transcript),
        { temperature: 0.3 },
      );

      await Promise.all([
        this.saveMemory(userId, { ...emptyMemory(), ...data.memory }),
        this.prisma.tutorConversation.update({
          where: { id: conversationId },
          data: { summary: data.rollingSummary },
        }),
      ]);
    } catch (err) {
      // La synthèse est best-effort : un échec ne casse pas la conversation.
      this.logger.warn(`Synthèse mémoire ignorée : ${(err as Error).message}`);
    }
  }
}
