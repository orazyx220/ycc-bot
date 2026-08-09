"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.giveBumpReward = giveBumpReward;
const User_1 = require("../database/models/User");
const economy_1 = require("./economy");
const rewards_1 = require("../config/rewards");
/** Date du jour au format 'AAAA-MM-JJ' (UTC), pour le compteur de bumps. */
function todayKey() {
    return new Date().toISOString().slice(0, 10);
}
/**
 * Crédite la récompense de bump à un membre, dans la limite de 3/jour.
 * Utilisé à la fois par la commande admin /reward bump et par la détection
 * automatique des bumps Disboard.
 */
async function giveBumpReward(discordId) {
    const today = todayKey();
    const user = await (0, User_1.getOrCreateUser)(discordId);
    const already = user.bumpCountDate === today ? user.bumpCountToday : 0;
    if (already >= rewards_1.REWARDS.bumpMaxPerDay) {
        return { status: 'limit', count: already };
    }
    await User_1.User.updateOne({ discordId }, { $set: { bumpCountDate: today, bumpCountToday: already + 1 } });
    const newBalance = await (0, economy_1.grantYumz)(discordId, rewards_1.REWARDS.bump, 'bump');
    return { status: 'ok', count: already + 1, newBalance };
}
