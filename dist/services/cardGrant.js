"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mintBonusCard = mintBonusCard;
exports.transferCard = transferCard;
exports.takeCard = takeCard;
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
