"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REWARDS = void 0;
exports.levelReward = levelReward;
/**
 * Barème central des gains de Yumz (source unique de vérité).
 * On modifie un montant ICI et il change partout dans le bot.
 */
exports.REWARDS = {
    /** /daily — une fois par 24 h (montant de base) */
    daily: 550,
    /** Bonus ajouté par jour consécutif de /daily */
    dailyStreakBonus: 10,
    /** Plafond du gain quotidien (base + bonus de streak) */
    dailyMax: 1000,
    /** Bump — max 3 fois par jour */
    bump: 500,
    bumpMaxPerDay: 3,
    /** 1 mois de boost du serveur */
    boostMonth: 5_000,
    /** Succès vocal global */
    voice: 2_000,
};
/**
 * Succès écrits par niveau : un palier tous les 10 niveaux (10 → 100).
 * Formule : niveau × 100 + 500.
 * Ex. : niveau 10 → 1 500 · niveau 100 → 10 500.
 */
function levelReward(level) {
    return level * 100 + 500;
}
