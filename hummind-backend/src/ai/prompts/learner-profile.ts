import type { LearnerProfile } from '../memory/memory.types';

// Bloc "Profil apprenant" injecté dans le system message juste après la persona.
// Doit rester court (< 1KB) pour profiter du prompt caching ephemeral.
export function buildLearnerProfilePrompt(profile: LearnerProfile): string {
  const lines: string[] = [];
  lines.push('PROFIL APPRENANT');
  lines.push(`- Prénom : ${profile.firstname || '(inconnu)'}`);
  lines.push(`- Sessions totales sur ce cours : ${profile.turnsTotal ?? 0}`);
  lines.push(`- État émotionnel actuel : ${profile.mood ?? 'ENGAGED'}`);
  if (profile.streakWin && profile.streakWin > 1) {
    lines.push(`- Série en cours : ${profile.streakWin} bonnes réponses d'affilée`);
  }
  if (profile.streakLoss && profile.streakLoss > 1) {
    lines.push(`- Bloque depuis : ${profile.streakLoss} tentatives infructueuses`);
  }
  if (profile.summary) {
    lines.push(`- Mémoire de cours : ${profile.summary}`);
  }
  if (profile.weakSpots && profile.weakSpots.length > 0) {
    const labels = profile.weakSpots
      .slice(0, 3)
      .map((c) => c.label)
      .join(', ');
    lines.push(`- Points faibles à travailler : ${labels}`);
  }
  if (profile.strongSpots && profile.strongSpots.length > 0) {
    const labels = profile.strongSpots
      .slice(0, 3)
      .map((c) => c.label)
      .join(', ');
    lines.push(`- Points déjà acquis (n'y reviens pas inutilement) : ${labels}`);
  }
  if (profile.preferences?.preferredExamples) {
    lines.push(`- Préfère les exemples : ${profile.preferences.preferredExamples}`);
  }
  return lines.join('\n');
}
