/**
 * Barème central des gains de Yumz (source unique de vérité).
 * On modifie un montant ICI et il change partout dans le bot.
 */
export const REWARDS = {
  /** /daily — une fois par 24 h */
  daily: 550,
  /** Bump — max 3 fois par jour */
  bump: 500,
  bumpMaxPerDay: 3,
  /** 1 mois de boost du serveur */
  boostMonth: 5_000,
  /** Succès vocal global */
  voice: 2_000,
} as const;

/**
 * Succès écrits par niveau : un palier tous les 10 niveaux (10 → 100).
 * Formule : niveau × 100 + 500.
 * Ex. : niveau 10 → 1 500 · niveau 100 → 10 500.
 */
export function levelReward(level: number): number {
  return level * 100 + 500;
}
