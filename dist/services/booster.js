"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.openBooster = openBooster;
const Card_1 = require("../database/models/Card");
const User_1 = require("../database/models/User");
const Transaction_1 = require("../database/models/Transaction");
const rarities_1 = require("../config/rarities");
const booster_1 = require("../config/booster");
/** Tire une rareté au hasard selon les poids configurés. */
function rollRarity() {
    const r = Math.random();
    let cumulative = 0;
    for (const rarity of rarities_1.RARITIES) {
        cumulative += booster_1.BOOSTER_ODDS[rarity] ?? 0;
        if (r < cumulative)
            return rarity;
    }
    return 'common'; // filet de sécurité (si les poids ne somment pas à 1)
}
/**
 * Ouvre un booster : débite le prix, tire une rareté puis une carte au hasard.
 *
 * Génération LIBRE (choix du projet) : le tirage n'affecte PAS le stock des
 * cartes — on peut donc tirer plusieurs fois la même carte, sans limite.
 * Le débit des Yumz reste atomique (anti double-clic).
 */
async function openBooster(discordId) {
    const user = await (0, User_1.getOrCreateUser)(discordId);
    if (user.yumz < booster_1.BOOSTER_PRICE) {
        return { status: 'insufficient', price: booster_1.BOOSTER_PRICE, balance: user.yumz };
    }
    const all = await Card_1.Card.find();
    if (all.length === 0)
        return { status: 'empty' };
    // Débit atomique du prix du booster.
    const charged = await User_1.User.findOneAndUpdate({ discordId, yumz: { $gte: booster_1.BOOSTER_PRICE } }, { $inc: { yumz: -booster_1.BOOSTER_PRICE } }, { returnDocument: 'after' });
    if (!charged)
        return { status: 'insufficient', price: booster_1.BOOSTER_PRICE, balance: user.yumz };
    // Regroupe les cartes par rareté.
    const byRarity = new Map();
    for (const c of all) {
        const list = byRarity.get(c.rarity) ?? [];
        list.push(c);
        byRarity.set(c.rarity, list);
    }
    // Tire une rareté ; si aucune carte de cette rareté n'existe, on retombe
    // sur la première rareté disponible (la plus commune en priorité).
    const rolled = rollRarity();
    let pool = byRarity.get(rolled) ?? [];
    if (pool.length === 0) {
        for (const r of rarities_1.RARITIES) {
            const p = byRarity.get(r);
            if (p && p.length > 0) {
                pool = p;
                break;
            }
        }
    }
    const card = pool[Math.floor(Math.random() * pool.length)];
    // On ajoute la carte à l'inventaire (sans toucher au stock).
    await User_1.User.updateOne({ discordId }, { $push: { cards: card.cardId } });
    await Transaction_1.Transaction.create({
        discordId,
        type: 'booster',
        amount: -booster_1.BOOSTER_PRICE,
        cardId: card.cardId,
    });
    return { status: 'ok', card, newBalance: charged.yumz };
}
