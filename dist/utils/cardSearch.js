"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchesSearch = matchesSearch;
exports.respondCardAutocomplete = respondCardAutocomplete;
const Card_1 = require("../database/models/Card");
const rarities_1 = require("../config/rarities");
/**
 * Vrai si la carte correspond au texte cherché (nom, ID ou libellé de rareté),
 * insensible à la casse. Une recherche vide correspond à tout.
 */
function matchesSearch(card, query) {
    const q = query.trim().toLowerCase();
    if (!q)
        return true;
    return (card.name.toLowerCase().includes(q) ||
        card.cardId.toLowerCase().includes(q) ||
        (0, rarities_1.rarityInfo)(card.rarity).label.toLowerCase().includes(q));
}
/**
 * Suggestions d'autocomplétion de l'option "recherche" : propose les cartes
 * dont le nom/ID contient le texte tapé (max 25). `onlyInStock` limite aux
 * cartes disponibles (pour la boutique).
 */
async function respondCardAutocomplete(interaction, onlyInStock = false) {
    const focused = interaction.options.getFocused().toLowerCase();
    const filter = onlyInStock ? { remainingSupply: { $gt: 0 } } : {};
    const cards = await Card_1.Card.find(filter).limit(300);
    const results = cards
        .filter((c) => c.name.toLowerCase().includes(focused) || c.cardId.toLowerCase().includes(focused))
        .slice(0, 25)
        .map((c) => ({ name: `${c.name} (${c.cardId})`.slice(0, 100), value: c.name.slice(0, 100) }));
    await interaction.respond(results);
}
