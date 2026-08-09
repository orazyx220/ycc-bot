"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WHEEL_PRIZES = exports.WHEEL_COOLDOWN_MS = void 0;
/** Roue de la fortune : gratuite, une fois par 24 h. */
exports.WHEEL_COOLDOWN_MS = 24 * 60 * 60 * 1000;
/**
 * Lots de la roue et leurs poids. Les gros lots sont rares.
 * (Les poids n'ont pas besoin de sommer à 100 : ce sont des poids relatifs.)
 */
exports.WHEEL_PRIZES = [
    { key: 'nothing', label: 'Rien...', emoji: '🎯', weight: 55, kind: 'nothing' },
    { key: 'card', label: 'Une carte aléatoire', emoji: '🎴', weight: 20, kind: 'card' },
    { key: 'yumz5k', label: '5 000 Yumz', emoji: '💰', weight: 15, kind: 'yumz', amount: 5_000 },
    { key: 'respin', label: 'Un tour gratuit', emoji: '🎁', weight: 7, kind: 'respin' },
    { key: 'yumz50k', label: '50 000 Yumz', emoji: '💎', weight: 2.5, kind: 'yumz', amount: 50_000 },
    { key: 'yumz100k', label: '100 000 Yumz', emoji: '🏆', weight: 0.5, kind: 'yumz', amount: 100_000 },
];
