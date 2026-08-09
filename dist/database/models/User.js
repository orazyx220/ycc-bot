"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
exports.getOrCreateUser = getOrCreateUser;
const mongoose_1 = require("mongoose");
/**
 * Un "User" = un membre Discord, avec son porte-monnaie et ses cartes.
 * On l'identifie par son `discordId` (l'ID unique donné par Discord).
 */
const userSchema = new mongoose_1.Schema({
    // ID Discord du membre — unique, et indexé pour des recherches rapides.
    discordId: { type: String, required: true, unique: true, index: true },
    // Solde de Yumz. Ne peut jamais descendre sous 0 (garde-fou anti-triche).
    yumz: { type: Number, required: true, default: 0, min: 0 },
    // IDs des cartes possédées (on remplira ça à l'étape "achat de cartes").
    cards: { type: [String], required: true, default: [] },
    // Dernière fois que le membre a fait /daily (null = jamais).
    dailyLastClaim: { type: Date, default: null },
    // Nombre de jours consécutifs de /daily (pour le bonus de streak).
    dailyStreak: { type: Number, required: true, default: 0 },
    // Compteur de bumps du jour + la date associée (pour le remettre à 0 chaque jour).
    bumpCountToday: { type: Number, required: true, default: 0 },
    bumpCountDate: { type: String, default: null }, // format 'AAAA-MM-JJ'
    // Cooldowns de /travailler et de la roue (null = jamais utilisé).
    workLastClaim: { type: Date, default: null },
    wheelLastSpin: { type: Date, default: null },
}, { timestamps: true });
exports.User = (0, mongoose_1.model)('User', userSchema);
/**
 * Récupère le user, ou le crée s'il n'existe pas encore.
 * On utilise `upsert` (update-or-insert) : une seule opération atomique,
 * donc pas de risque de créer deux fois le même membre.
 */
async function getOrCreateUser(discordId) {
    const user = await exports.User.findOneAndUpdate({ discordId }, { $setOnInsert: { discordId } }, { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true });
    // upsert:true + new:true garantit qu'on a toujours un document ici.
    return user;
}
