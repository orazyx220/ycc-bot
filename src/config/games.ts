/** Bornes de mise pour les mini-jeux de pari. */
export const GAMES = {
  minBet: 10,
  maxBet: 10_000,
};

/** Symboles de la machine à sous et leur multiplicateur (3 identiques). */
export const SLOT_SYMBOLS = ['🍒', '🍋', '🔔', '⭐', '💎'] as const;
export const SLOT_MULTIPLIERS: Record<string, number> = {
  '🍒': 3,
  '🍋': 4,
  '🔔': 5,
  '⭐': 8,
  '💎': 15,
};
