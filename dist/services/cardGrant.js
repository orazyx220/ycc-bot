"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mintBonusCard = mintBonusCard;
exports.transferCard = transferCard;
exports.takeCard = takeCard;
exports.clearInventory = clearInventory;
const Card_1 = require("../database/models/Card");
const User_1 = require("../database/models/User");
const Transaction_1 = require("../database/models/Transaction");
/**
 * (Admin) Crée un exemplaire BONUS d'une carte, SANS toucher au stock.
 * Peut dépasser maxSupply — c'est l'exception assumée pour les cas spéciaux.
 */
async function mintBonusCard(discordId, cardId) {
    const meta = await Card_1.Card.findOne({ cardId });
    if (!meta)
        return { status: 'notfound' };
    await (0, User_1.getOrCreateUser)(discordId);
    await User_1.User.updateOne({ discordId }, { $push: { cards: cardId } });
    await Transaction_1.Transaction.create({ discordId, type: 'admin_bonus_card', amount: 0, cardId });
    return { status: 'ok', card: meta };
}
/**
 * Transfère UN exemplaire d'une carte du donneur vers le receveur.
 * Le stock global ne change pas (la carte change juste de propriétaire).
 * Échoue si le donneur ne possède pas la carte.
 */
async function transferCard(fromId, toId, cardId) {
    const meta = await Card_1.Card.findOne({ cardId });
    if (!meta)
        return { status: 'notfound' };
    const giver = await (0, User_1.getOrCreateUser)(fromId);
    // On retire UN seul exemplaire (indexOf + splice), pas toutes les copies.
    const index = giver.cards.indexOf(cardId);
    if (index === -1)
        return { status: 'notowned' };
    giver.cards.splice(index, 1);
    await giver.save();
    await (0, User_1.getOrCreateUser)(toId);
    await User_1.User.updateOne({ discordId: toId }, { $push: { cards: cardId } });
    await Transaction_1.Transaction.create({ discordId: fromId, type: 'gift_out', amount: 0, cardId });
    await Transaction_1.Transaction.create({ discordId: toId, type: 'gift_in', amount: 0, cardId });
    return { status: 'ok', card: meta };
}
/**
 * (Admin) Retire UN exemplaire d'une carte de l'inventaire d'un membre.
 * Si `restock` est vrai, l'exemplaire est remis dans le stock global
 * (remainingSupply +1, plafonné à maxSupply) — utile pour une carte limitée.
 */
async function takeCard(discordId, cardId, restock) {
    const user = await (0, User_1.getOrCreateUser)(discordId);
    const index = user.cards.indexOf(cardId);
    if (index === -1)
        return { status: 'notowned' };
    user.cards.splice(index, 1);
    await user.save();
    const card = await Card_1.Card.findOne({ cardId });
    let restocked = false;
    if (restock && card && card.remainingSupply < card.maxSupply) {
        card.remainingSupply += 1;
        await card.save();
        restocked = true;
    }
    await Transaction_1.Transaction.create({ discordId, type: 'admin_take', amount: 0, cardId });
    return { status: 'ok', card, restocked };
}
/**
 * (Admin) Vide TOUT l'inventaire de cartes d'un membre.
 * Si `restock` est vrai, chaque exemplaire retiré est remis dans le stock
 * global (remainingSupply +N, plafonné à maxSupply).
 */
async function clearInventory(discordId, restock) {
    const user = await (0, User_1.getOrCreateUser)(discordId);
    const removed = user.cards.length;
    if (removed === 0)
        return { removed: 0, restocked: false };
    if (restock) {
        // Compte combien d'exemplaires de chaque carte, puis remet en stock.
        const counts = new Map();
        for (const id of user.cards)
            counts.set(id, (counts.get(id) ?? 0) + 1);
        const cards = await Card_1.Card.find({ cardId: { $in: [...counts.keys()] } });
        for (const card of cards) {
            const n = counts.get(card.cardId) ?? 0;
            const room = card.maxSupply - card.remainingSupply;
            const add = Math.min(n, room);
            if (add > 0) {
                card.remainingSupply += add;
                await card.save();
            }
        }
    }
    user.cards.splice(0); // vide le tableau
    await user.save();
    await Transaction_1.Transaction.create({ discordId, type: 'admin_clear', amount: 0 });
    return { removed, restocked: restock };
}
