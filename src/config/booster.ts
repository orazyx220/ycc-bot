import type { Rarity } from './rarities';

/** Prix d'un booster, en Yumz. */
export const BOOSTER_PRICE = 1000;

/** Nombre maximum d'ouvertures de boosters par membre sur la fenêtre glissante. */
export const BOOSTER_WEEKLY_LIMIT = 2;

/** Durée de la fenêtre glissante pour la limite (par défaut : 7 jours). */
export const BOOSTER_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Probabilités de tirage par rareté (doivent sommer à 1).
 * Un booster tire d'abord une rareté selon ces poids, puis une carte
 * au hasard parmi celles de cette rareté.
 */
export const BOOSTER_ODDS: Record<Rarity, number> = {
  common: 0.55,
  rare: 0.28,
  epic: 0.12,
  legendary: 0.04,
  mystere: 0.009,
  evil: 0.001,
};
