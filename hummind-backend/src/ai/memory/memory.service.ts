import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  ConceptRef,
  LearnerPreferences,
  LearnerProfile,
  MasteryUpdate,
} from './memory.types';
import { Mood } from '@prisma/client';
import {
  HUMMIND_TURN_COMPLETED_EVENT,
  type HummindTurnCompletedPayload,
} from './summarizer.events';
// Note: SummarizerService listens to HUMMIND_TURN_COMPLETED_EVENT.

const TOP_N_CONCEPTS = 3;
const MEMORY_SUMMARY_MAX_CHARS = 2000;

// EMA bayésienne : alpha décroît avec le nombre d'attempts pour stabiliser.
function bayesianAlpha(attempts: number): number {
  return 1 / Math.sqrt(attempts + 1);
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

@Injectable()
export class MemoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {}

  /**
   * Charge le profil apprenant complet pour un cours.
   * Conçu pour être appelé en parallèle des autres lectures (Promise.all).
   * Auto-crée la mémoire si absente.
   */
  async loadProfile(args: {
    userId: string;
    courseId: string;
    firstname: string;
  }): Promise<LearnerProfile> {
    const [memory, weakConcepts, strongConcepts, lastAffective] =
      await Promise.all([
        this.prisma.learnerMemory.upsert({
          where: { userId_courseId: { userId: args.userId, courseId: args.courseId } },
          update: {},
          create: { userId: args.userId, courseId: args.courseId, summary: '' },
        }),
        this.prisma.conceptMastery.findMany({
          where: {
            userId: args.userId,
            courseId: args.courseId,
            attempts: { gt: 0 },
          },
          orderBy: { mastery: 'asc' },
          take: TOP_N_CONCEPTS,
        }),
        this.prisma.conceptMastery.findMany({
          where: {
            userId: args.userId,
            courseId: args.courseId,
            mastery: { gte: 0.7 },
          },
          orderBy: { mastery: 'desc' },
          take: TOP_N_CONCEPTS,
        }),
        this.prisma.affectiveState.findFirst({
          where: { userId: args.userId, courseId: args.courseId },
          orderBy: { createdAt: 'desc' },
        }),
      ]);

    const toRef = (c: typeof weakConcepts[number]): ConceptRef => ({
      conceptKey: c.conceptKey,
      label: c.label,
      mastery: c.mastery,
      lastSeenAt: c.lastSeenAt.toISOString(),
    });

    return {
      userId: args.userId,
      courseId: args.courseId,
      firstname: args.firstname,
      summary: memory.summary ?? '',
      weakSpots: weakConcepts.map(toRef),
      strongSpots: strongConcepts.map(toRef),
      preferences: (memory.preferences as LearnerPreferences) ?? {},
      turnsTotal: memory.turnsTotal,
      mood: lastAffective?.mood ?? Mood.ENGAGED,
      streakWin: lastAffective?.streakWin ?? 0,
      streakLoss: lastAffective?.streakLoss ?? 0,
    };
  }

  /**
   * Met à jour la maîtrise d'un concept après une tentative (quiz, exercice).
   * Utilise une EMA bayésienne pour converger vers le vrai score.
   */
  async updateMastery(update: MasteryUpdate): Promise<void> {
    const existing = await this.prisma.conceptMastery.findUnique({
      where: {
        userId_courseId_conceptKey: {
          userId: update.userId,
          courseId: update.courseId,
          conceptKey: update.conceptKey,
        },
      },
    });

    const attempts = (existing?.attempts ?? 0) + 1;
    const successes = (existing?.successes ?? 0) + (update.success ? 1 : 0);
    const observed = update.success ? 1 : 0;
    const alpha = bayesianAlpha(attempts);
    const previous = existing?.mastery ?? 0.5;
    const mastery = clamp01(alpha * observed + (1 - alpha) * previous);

    await this.prisma.conceptMastery.upsert({
      where: {
        userId_courseId_conceptKey: {
          userId: update.userId,
          courseId: update.courseId,
          conceptKey: update.conceptKey,
        },
      },
      update: { mastery, attempts, successes, label: update.label },
      create: {
        userId: update.userId,
        courseId: update.courseId,
        conceptKey: update.conceptKey,
        label: update.label,
        mastery,
        attempts,
        successes,
      },
    });
  }

  /**
   * Incrémente le compteur de turns et de tokens consommés pour la mémoire,
   * puis émet un événement asynchrone qui peut déclencher un summarizer
   * (tous les 10 turns par défaut).
   */
  async incrementTurn(args: {
    userId: string;
    courseId: string;
    tokens: number;
  }): Promise<void> {
    const updated = await this.prisma.learnerMemory.update({
      where: { userId_courseId: { userId: args.userId, courseId: args.courseId } },
      data: {
        turnsTotal: { increment: 1 },
        tokensTotal: { increment: args.tokens },
      },
      select: { turnsTotal: true },
    });

    const payload: HummindTurnCompletedPayload = {
      userId: args.userId,
      courseId: args.courseId,
      turnsTotal: updated.turnsTotal,
    };
    this.events.emit(HUMMIND_TURN_COMPLETED_EVENT, payload);
  }

  /**
   * Remplace (et non append) le résumé. Le summarizer doit produire un texte
   * borné en taille — on tronque par sécurité.
   */
  async refreshSummary(args: {
    userId: string;
    courseId: string;
    summary: string;
  }): Promise<void> {
    const trimmed =
      args.summary.length > MEMORY_SUMMARY_MAX_CHARS
        ? args.summary.slice(0, MEMORY_SUMMARY_MAX_CHARS)
        : args.summary;
    await this.prisma.learnerMemory.update({
      where: { userId_courseId: { userId: args.userId, courseId: args.courseId } },
      data: { summary: trimmed },
    });
  }

  async updatePreferences(args: {
    userId: string;
    courseId: string;
    preferences: LearnerPreferences;
  }): Promise<void> {
    await this.prisma.learnerMemory.update({
      where: { userId_courseId: { userId: args.userId, courseId: args.courseId } },
      data: { preferences: args.preferences as unknown as object },
    });
  }
}
