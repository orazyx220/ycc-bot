"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.boutique = void 0;
const discord_js_1 = require("discord.js");
const Card_1 = require("../database/models/Card");
const rarities_1 = require("../config/rarities");
const cardBrowser_1 = require("../utils/cardBrowser");
/**
 * /boutique — parcourt les cartes en stock (menu déroulant pour choisir) et
 * achète celle affichée avec le bouton « 🛒 Acheter ». Réservé à l'auteur.
 */
exports.boutique = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('boutique')
        .setDescription('Achète des cartes avec tes Yumz (menu déroulant).'),
    async execute(interaction) {
        const rank = new Map(rarities_1.RARITIES.map((r, i) => [r, i]));
        const cards = await Card_1.Card.find({ remainingSupply: { $gt: 0 } });
        cards.sort((a, b) => (rank.get(b.rarity) ?? 0) - (rank.get(a.rarity) ?? 0) || b.price - a.price);
        if (cards.length === 0) {
            await interaction.reply({ content: '🛒 La boutique est vide pour l’instant.' });
            return;
        }
        await (0, cardBrowser_1.browseCards)(interaction, cards, { buy: true });
    },
};
