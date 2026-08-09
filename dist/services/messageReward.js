"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeMessageReward = computeMessageReward;
const activity_1 = require("../config/activity");
/** Tirage aléatoire de la base entre minBase et maxBase (inclus). */
function randomBase() {
    const { minBase, maxBase } = activity_1.MESSAGE_EARN;
    return Math.floor(Math.random() * (maxBase - minBase + 1)) + minBase;
}
/** Multiplicateur du salon (1 si non configuré). */
function channelMultiplier(channelId) {
    return activity_1.CHANNEL_MULTIPLIERS[channelId] ?? 1;
}
/** Meilleur multiplicateur parmi les rôles du membre (1 si aucun). */
function bestRoleMultiplier(roleIds) {
    let best = 1;
    for (const id of roleIds) {
        const m = activity_1.ROLE_MULTIPLIERS[id];
        if (m !== undefined && m > best)
            best = m;
    }
    return best;
}
/** Bonus de longueur (NON multiplié), plafonné. */
function lengthBonus(content) {
    const raw = Math.floor(content.length / activity_1.MESSAGE_EARN.longBonusPerChars);
    return Math.min(raw, activity_1.MESSAGE_EARN.longBonusMax);
}
/**
 * Calcule le gain d'un message selon la formule anti-abus retenue :
 *   base × (meilleur rôle × salon)  +  bonus_longueur   → plafonné à maxPerMessage
 * Les multiplicateurs agissent sur la base ; le bonus de longueur, lui, est à part.
 */
function computeMessageReward(content, roleIds, channelId) {
    const base = randomBase();
    const multiplier = bestRoleMultiplier(roleIds) * channelMultiplier(channelId);
    const multiplied = Math.round(base * multiplier);
    const bonus = lengthBonus(content); // hors multiplicateurs
    return Math.min(multiplied + bonus, activity_1.MESSAGE_EARN.maxPerMessage);
}
