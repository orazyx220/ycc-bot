"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.spinWheel = spinWheel;
const User_1 = require("../database/models/User");
const Card_1 = require("../database/models/Card");
const Transaction_1 = require("../database/models/Transaction");
const economy_1 = require("./economy");
const wheel_1 = require("../config/wheel");
/** Tire un lot au hasard selon les poids. */
function rollPrize() {
    const total = wheel_1.WHEEL_PRIZES.reduce((sum, p) => sum + p.weight, 0);
    let r = Math.random() * total;
    for (const prize of wheel_1.WHEEL_PRIZES) {
        r -= prize.weight;
        if (r < 0)
            return prize;
    }
    return wheel_1.WHEEL_PRIZES[wheel_1.WHEEL_PRIZES.length - 1];
}
const MAX_SPINS = 10; // garde-fou contre une chaîne infinie de "tours gratuits"
/**
 * Fait tourner la roue (gratuit, 1×/24 h). Un lot "tour gratuit" relance
 * immédiatement un tour supplémentaire (jusqu'à MAX_SPINS).
 */
async function spinWheel(discordId) {
    const user = await (0, User_1.getOrCreateUser)(discordId);
    const now = Date.now();
    const last = user.wheelLastSpin?.getTime() ?? null;
    if (last !== null && now - last < wheel_1.WHEEL_COOLDOWN_MS) {
        return { status: 'cooldown', remaining: last + wheel_1.WHEEL_COOLDOWN_MS - now };
    }
    await User_1.User.updateOne({ discordId }, { $set: { wheelLastSpin: new Date(now) } });
    const outcomes = [];
    for (let i = 0; i < MAX_SPINS; i++) {
        const prize = rollPrize();
        if (prize.kind === 'respin') {
            outcomes.push({ emoji: prize.emoji, label: prize.label, detail: 'Tu rejoues !' });
            continue;
        }
        if (prize.kind === 'yumz') {
            const amount = prize.amount ?? 0;
            await (0, economy_1.addYumz)(discordId, amount);
            await Transaction_1.Transaction.create({ discordId, type: 'wheel', amount });
            outcomes.push({ emoji: prize.emoji, label: prize.label, detail: `+${amount} Yumz !` });
            break;
        }
        if (prize.kind === 'card') {
            const all = await Card_1.Card.find();
            if (all.length === 0) {
                outcomes.push({ emoji: '🎯', label: 'Rien...', detail: 'Aucune carte disponible.' });
                break;
            }
            const card = all[Math.floor(Math.random() * all.length)];
            await User_1.User.updateOne({ discordId }, { $push: { cards: card.cardId } });
            await Transaction_1.Transaction.create({ discordId, type: 'wheel_card', amount: 0, cardId: card.cardId });
            outcomes.push({ emoji: prize.emoji, label: prize.label, detail: `Tu gagnes **${card.name}** !` });
            break;
        }
        // kind === 'nothing'
        outcomes.push({ emoji: prize.emoji, label: prize.label, detail: 'Pas de chance cette fois.' });
        break;
    }
    const finalUser = await (0, User_1.getOrCreateUser)(discordId);
    return { status: 'ok', outcomes, newBalance: finalUser.yumz };
}
