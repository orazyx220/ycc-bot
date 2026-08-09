"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.purchaseCard = purchaseCard;
exports.claimFreeCard = claimFreeCard;
const Card_1 = require("../database/models/Card");
const User_1 = require("../database/models/User");
const Transaction_1 = require("../database/models/Transaction");
/**
 * ⭐️ LE cœur anti-concurrence du projet.
 *
 * Problème : si 2 membres cliquent « Acheter » sur la carte unique à la même
 * milliseconde, il ne doit y avoir QU'UN seul gagnant.
 *
 * Solution choisie : des OPÉRATIONS ATOMIQUES (`findOneAndUpdate` avec une
 * CONDITION dans le filtre). MongoDB garantit qu'une écriture sur un document
 * est indivisible : deux requêtes concurrentes sont mises en file, elles ne
 * peuvent pas "réussir toutes les deux" si la condition ne tient qu'une fois.
 *
 * Pourquoi pas juste "lire puis écrire" ? Parce qu'entre la lecture
 * (« il reste 1 exemplaire ») et l'écriture, l'autre membre peut se glisser :
 * les deux liraient « 1 » et achèteraient. L'atomicité supprime cette faille.
 *
 * Ordre des opérations (important) :
 *   1. On DÉBITE d'abord les Yumz, de façon atomique (réussit seulement si le
 *      solde couvre le prix). Un membre fauché n'ira pas plus loin et ne
 *      "bloquera" jamais la carte.
 *   2. On RÉSERVE ensuite un exemplaire, de façon atomique (réussit seulement
 *      si remainingSupply > 0). C'EST ici que le gagnant unique est décidé.
 *   3. Si plus de stock (on a perdu la course) → on REMBOURSE le débit.
 */
async function purchaseCard(discordId, cardId) {
    // On lit les métadonnées de la carte (pour connaître le prix).
    const cardMeta = await Card_1.Card.findOne({ cardId });
    if (!cardMeta)
        return { status: 'notfound' };
    const price = cardMeta.price;
    const user = await (0, User_1.getOrCreateUser)(discordId);
    // Vérif rapide "de confort" (le vrai garde-fou est le débit atomique en 1).
    if (user.yumz < price) {
        return { status: 'insufficient', price, balance: user.yumz };
    }
    // --- 1) DÉBIT ATOMIQUE ---
    // Ne réussit QUE si yumz >= price au moment exact de l'écriture.
    const charged = await User_1.User.findOneAndUpdate({ discordId, yumz: { $gte: price } }, { $inc: { yumz: -price } }, { returnDocument: 'after' });
    if (!charged) {
        // Course perdue sur le solde (ex: dépensé ailleurs au même instant).
        return { status: 'insufficient', price, balance: user.yumz };
    }
    // --- 2) RÉSERVATION ATOMIQUE D'UN EXEMPLAIRE ---
    // Le filtre `remainingSupply > 0` est la clé : sur la dernière carte,
    // un seul findOneAndUpdate verra la valeur > 0 et la fera passer à 0.
    // Le second verra déjà 0 → filtre non satisfait → renvoie null.
    const claimed = await Card_1.Card.findOneAndUpdate({ cardId, remainingSupply: { $gt: 0 } }, { $inc: { remainingSupply: -1 } }, { returnDocument: 'after' });
    if (!claimed) {
        // --- 3) STOCK ÉPUISÉ → REMBOURSEMENT ---
        await User_1.User.updateOne({ discordId }, { $inc: { yumz: price } });
        await Transaction_1.Transaction.create({
            discordId,
            type: 'refund',
            amount: price,
            cardId,
            reason: 'soldout',
        });
        return { status: 'soldout' };
    }
    // --- SUCCÈS : on attribue la carte + on journalise ---
    // Numéro d'exemplaire = combien ont déjà été vendus (1 = le premier).
    const serial = claimed.maxSupply - claimed.remainingSupply;
    await User_1.User.updateOne({ discordId }, { $push: { cards: cardId } });
    await Transaction_1.Transaction.create({
        discordId,
        type: 'purchase',
        amount: -price,
        cardId,
        serial,
    });
    return { status: 'ok', card: claimed, serial, newBalance: charged.yumz };
}
/**
 * Récupère GRATUITEMENT un exemplaire (drops en mode 'gift').
 * Même garde-fou anti-concurrence que l'achat : la réservation atomique
 * (`remainingSupply > 0`) désigne un seul gagnant. Aucun Yumz débité.
 */
async function claimFreeCard(discordId, cardId, logType = 'gift') {
    const cardMeta = await Card_1.Card.findOne({ cardId });
    if (!cardMeta)
        return { status: 'notfound' };
    await (0, User_1.getOrCreateUser)(discordId);
    const claimed = await Card_1.Card.findOneAndUpdate({ cardId, remainingSupply: { $gt: 0 } }, { $inc: { remainingSupply: -1 } }, { returnDocument: 'after' });
    if (!claimed)
        return { status: 'soldout' };
    const serial = claimed.maxSupply - claimed.remainingSupply;
    await User_1.User.updateOne({ discordId }, { $push: { cards: cardId } });
    await Transaction_1.Transaction.create({ discordId, type: logType, amount: 0, cardId, serial });
    return { status: 'ok', card: claimed, serial };
}
