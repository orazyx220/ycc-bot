"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WHEEL_PRIZES = exports.WHEEL_COOLDOWN_MS = void 0;
/** Roue de la fortune : gratuite, une fois par SEMAINE. */
exports.WHEEL_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
/**
 * Lots de la roue et leurs poids (façon EuroMillions : plus le lot est gros,
 * plus il est rare). Les poids ci-dessous somment à 100 → ce sont des %.
 */
exports.WHEEL_PRIZES = [
    { key: 'nothing', label: 'Rien...', emoji: '🎯', weight: 25, kind: 'nothing' },
    { key: 'yumz10', label: '10 Yumz', emoji: '🪙', weight: 25, kind: 'yumz', amount: 10 },
    { key: 'yumz100', label: '100 Yumz', emoji: '💵', weight: 20, kind: 'yumz', amount: 100 },
    { key: 'yumz500', label: '500 Yumz', emoji: '💶', weight: 12, kind: 'yumz', amount: 500 },
    { key: 'card', label: 'Une carte aléatoire', emoji: '🎴', weight: 8, kind: 'card' },
    { key: 'respin', label: 'Un tour gratuit', emoji: '🎁', weight: 4, kind: 'respin' },
    { key: 'yumz5k', label: '5 000 Yumz', emoji: '💰', weight: 4, kind: 'yumz', amount: 5_000 },
    { key: 'yumz50k', label: '50 000 Yumz', emoji: '💎', weight: 1.5, kind: 'yumz', amount: 50_000 },
    { key: 'yumz100k', label: '100 000 Yumz', emoji: '🏆', weight: 0.5, kind: 'yumz', amount: 100_000 },
];
