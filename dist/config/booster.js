"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BOOSTER_ODDS = exports.BOOSTER_PRICE = void 0;
/** Prix d'un booster, en Yumz. */
exports.BOOSTER_PRICE = 1000;
/**
 * Probabilités de tirage par rareté (doivent sommer à 1).
 * Un booster tire d'abord une rareté selon ces poids, puis une carte
 * au hasard parmi celles de cette rareté.
 */
exports.BOOSTER_ODDS = {
    common: 0.55,
    rare: 0.28,
    epic: 0.12,
    legendary: 0.04,
    mystere: 0.009,
    evil: 0.001,
};
