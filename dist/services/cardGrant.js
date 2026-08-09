"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mintBonusCard = mintBonusCard;
exports.transferCard = transferCard;
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
