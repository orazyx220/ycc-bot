"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SLOT_MULTIPLIERS = exports.SLOT_SYMBOLS = exports.GAMES = void 0;
/** Bornes de mise pour les mini-jeux de pari. */
exports.GAMES = {
    minBet: 10,
    maxBet: 10_000,
};
/** Symboles de la machine à sous et leur multiplicateur (3 identiques). */
exports.SLOT_SYMBOLS = ['🍒', '🍋', '🔔', '⭐', '💎'];
exports.SLOT_MULTIPLIERS = {
    '🍒': 3,
    '🍋': 4,
    '🔔': 5,
    '⭐': 8,
    '💎': 15,
};
