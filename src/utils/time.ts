/** Durée d'une journée en millisecondes. */
export const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Transforme une durée (en ms) en texte lisible, ex. "3h 12min" ou "45min".
 * Sert à dire au membre combien de temps il doit attendre son prochain /daily.
 */
export function formatDuration(ms: number): string {
  const totalMinutes = Math.max(0, Math.ceil(ms / 60_000));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}j ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}min`;
  return `${minutes}min`;
}
