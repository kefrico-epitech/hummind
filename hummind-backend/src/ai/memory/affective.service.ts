import { Injectable } from '@nestjs/common';
import { Mood } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MoodDetectorService } from './mood-detector.service';

export interface AffectiveSignal {
  userId: string;
  courseId: string;
  sessionId?: string | null;
  success?: boolean;            // résultat de l'interaction (quiz/exo)
  messageLength?: number;       // longueur du dernier message apprenant
  learnerMessage?: string;      // dernier message apprenant pour le détecteur LLM
  inferredMood?: Mood;          // si fourni explicitement, prioritaire
  confidence?: number;          // 0..1
}

@Injectable()
export class AffectiveService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly moodDetector: MoodDetectorService,
  ) {}

  /**
   * Lit le dernier état affectif et applique un nouveau signal.
   * Règles d'inférence simple si aucun mood n'est fourni :
   *   - streakWin >= 3        → TRIUMPHANT
   *   - streakLoss >= 3       → FRUSTRATED
   *   - messageLength <= 5    → BORED
   *   - sinon                 → ENGAGED
   */
  async observe(signal: AffectiveSignal): Promise<{
    mood: Mood;
    streakWin: number;
    streakLoss: number;
  }> {
    const previous = await this.prisma.affectiveState.findFirst({
      where: { userId: signal.userId, courseId: signal.courseId },
      orderBy: { createdAt: 'desc' },
    });

    let streakWin = previous?.streakWin ?? 0;
    let streakLoss = previous?.streakLoss ?? 0;

    if (signal.success === true) {
      streakWin += 1;
      streakLoss = 0;
    } else if (signal.success === false) {
      streakLoss += 1;
      streakWin = 0;
    }

    // Étape 1 : mood explicite > détecteur LLM > heuristique
    let mood: Mood;
    let confidence: number;

    if (signal.inferredMood) {
      mood = signal.inferredMood;
      confidence = signal.confidence ?? 0.8;
    } else if (signal.learnerMessage && signal.learnerMessage.trim().length > 0) {
      // Charge les 2 messages précédents pour donner du contexte au détecteur.
      const recent = await this.recentLearnerMessages(
        signal.userId,
        signal.courseId,
      );
      const detection = await this.moodDetector.detect({
        userId: signal.userId,
        recentLearnerMessages: [...recent, signal.learnerMessage],
      });
      if (detection) {
        mood = detection.mood;
        confidence = detection.confidence;
      } else {
        mood = this.infer({
          streakWin,
          streakLoss,
          messageLength: signal.messageLength ?? signal.learnerMessage.length,
        });
        confidence = 0.4;
      }
    } else {
      mood = this.infer({
        streakWin,
        streakLoss,
        messageLength: signal.messageLength ?? 50,
      });
      confidence = 0.4;
    }

    await this.prisma.affectiveState.create({
      data: {
        userId: signal.userId,
        courseId: signal.courseId,
        sessionId: signal.sessionId ?? null,
        mood,
        confidence,
        streakWin,
        streakLoss,
      },
    });

    return { mood, streakWin, streakLoss };
  }

  /**
   * Renvoie jusqu'à 2 messages apprenant récents (depuis CourseSession.messages
   * si disponible, sinon vide). Utilisé pour donner du contexte au détecteur.
   */
  private async recentLearnerMessages(
    userId: string,
    courseId: string,
  ): Promise<string[]> {
    const session = await this.prisma.courseSession.findFirst({
      where: { userId, courseId },
      orderBy: { updatedAt: 'desc' },
      select: { messages: true },
    });
    if (!session?.messages || !Array.isArray(session.messages)) return [];

    type Msg = { role?: string; content?: string };
    const learnerMessages = (session.messages as Msg[])
      .filter((m) => m?.role === 'learner' && typeof m.content === 'string')
      .map((m) => m.content as string);

    return learnerMessages.slice(-2);
  }

  private infer(args: {
    streakWin: number;
    streakLoss: number;
    messageLength: number;
  }): Mood {
    if (args.streakWin >= 3) return Mood.TRIUMPHANT;
    if (args.streakLoss >= 3) return Mood.FRUSTRATED;
    if (args.messageLength <= 5) return Mood.BORED;
    return Mood.ENGAGED;
  }
}
