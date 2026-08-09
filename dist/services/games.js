"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.playCoinflip = playCoinflip;
exports.playDice = playDice;
exports.playSlots = playSlots;
const User_1 = require("../database/models/User");
const Transaction_1 = require("../database/models/Transaction");
const games_1 = require("../config/games");
/** Débite la mise de façon atomique (échoue si solde insuffisant). */
async function debit(discordId, bet) {
    return User_1.User.findOneAndUpdate({ discordId, yumz: { $gte: bet } }, { $inc: { yumz: -bet } }, { returnDocument: 'after' });
}
/** Crédite un gain et renvoie le nouveau solde. */
async function credit(discordId, amount) {
    const updated = await User_1.User.findOneAndUpdate({ discordId }, { $inc: { yumz: amount } }, { returnDocument: 'after' });
    return updated?.yumz ?? 0;
}
async function currentBalance(discordId) {
    const user = await (0, User_1.getOrCreateUser)(discordId);
    return user.yumz;
}
async function playCoinflip(discordId, bet, choice) {
    const charged = await debit(discordId, bet);
    if (!charged)
        return { status: 'insufficient', balance: await currentBalance(discordId) };
    const result = Math.random() < 0.5 ? 'pile' : 'face';
    const win = result === choice;
    const newBalance = win ? await credit(discordId, bet * 2) : charged.yumz;
    await Transaction_1.Transaction.create({ discordId, type: 'game_coinflip', amount: win ? bet : -bet });
    return { status: 'ok', result, win, bet, newBalance };
}
async function playDice(discordId, bet) {
    const charged = await debit(discordId, bet);
    if (!charged)
        return { status: 'insufficient', balance: await currentBalance(discordId) };
    const player = 1 + Math.floor(Math.random() * 6);
    const botRoll = 1 + Math.floor(Math.random() * 6);
    let outcome;
    let newBalance = charged.yumz;
    if (player > botRoll) {
        outcome = 'win';
        newBalance = await credit(discordId, bet * 2);
    }
    else if (player === botRoll) {
        outcome = 'tie';
        newBalance = await credit(discordId, bet); // mise remboursée
    }
    else {
        outcome = 'lose';
    }
    await Transaction_1.Transaction.create({
        discordId,
        type: 'game_dice',
        amount: outcome === 'win' ? bet : outcome === 'tie' ? 0 : -bet,
    });
    return { status: 'ok', player, bot: botRoll, outcome, bet, newBalance };
}
function spinReel() {
    return games_1.SLOT_SYMBOLS[Math.floor(Math.random() * games_1.SLOT_SYMBOLS.length)];
}
async function playSlots(discordId, bet) {
    const charged = await debit(discordId, bet);
    if (!charged)
        return { status: 'insufficient', balance: await currentBalance(discordId) };
    const a = spinReel();
    const b = spinReel();
    const c = spinReel();
    // 3 identiques = JACKPOT (gain net = mise × multiplicateur du symbole).
    // 2 identiques = mise REMBOURSÉE (gain net 0). Sinon : perdu.
    let multiplier = 0;
    let refund = false;
    if (a === b && b === c)
        multiplier = games_1.SLOT_MULTIPLIERS[a] ?? 3;
    else if (a === b || b === c || a === c)
        refund = true;
    let won; // total crédité (mise rendue + gain éventuel)
    if (multiplier > 0)
        won = bet * (multiplier + 1);
    else if (refund)
        won = bet; // on rend juste la mise
    else
        won = 0;
    const newBalance = won > 0 ? await credit(discordId, won) : charged.yumz;
    await Transaction_1.Transaction.create({
        discordId,
        type: 'game_slots',
        amount: won - bet, // >0 jackpot · 0 remboursé · -mise perdu
    });
    return { status: 'ok', reels: [a, b, c], multiplier, refund, won, bet, newBalance };
}
