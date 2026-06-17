import type { Mood } from '@prisma/client';

export interface ConceptRef {
  conceptKey: string;
  label: string;
  mastery: number;
  lastSeenAt: string; // ISO
}

export interface LearnerPreferences {
  preferredExamples?: 'concret' | 'abstrait' | 'visuel';
  learningPace?: 'lent' | 'normal' | 'rapide';
  toleratesChallenge?: boolean;
}

export interface LearnerProfile {
  userId: string;
  courseId: string;
  firstname: string;
  summary: string;
  weakSpots: ConceptRef[];
  strongSpots: ConceptRef[];
  preferences: LearnerPreferences;
  turnsTotal: number;
  mood: Mood;
  streakWin: number;
  streakLoss: number;
}

export interface MasteryUpdate {
  userId: string;
  courseId: string;
  conceptKey: string;
  label: string;
  success: boolean;
}
