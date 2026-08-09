"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addYumz = addYumz;
exports.grantYumz = grantYumz;
const User_1 = require("../database/models/User");
const Transaction_1 = require("../database/models/Transaction");
/**
 * Crédite (montant > 0) ou débite (montant < 0) des Yumz à un membre,
 * puis journalise l'opération. Le solde ne descend jamais sous 0.
 *
 * Renvoie le nouveau solde.
 *
 * Note : utilisé pour les attributions ADMIN (peu fréquentes, pas de course
 * possible). Le /daily et l'achat de cartes ont, eux, leur propre logique
 * ATOMIQUE dédiée à la concurrence.
 */
/**
 * Ajoute des Yumz de façon ATOMIQUE, sans journaliser (adapté au gros volume
 * de l'économie par message). Crée le membre s'il n'existe pas encore.
 */
async function addYumz(discordId, amount) {
    await User_1.User.updateOne({ discordId }, { $inc: { yumz: amount } }, { upsert: true, setDefaultsOnInsert: true });
}
async function grantYumz(discordId, amount, type, reason) {
    const user = await (0, User_1.getOrCreateUser)(discordId);
    const newBalance = Math.max(0, user.yumz + amount);
    await User_1.User.updateOne({ discordId }, { $set: { yumz: newBalance } });
    await Transaction_1.Transaction.create({
        discordId,
        type,
        amount,
        reason: reason ?? null,
    });
    return newBalance;
}
