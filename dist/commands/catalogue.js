"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.catalogue = void 0;
const discord_js_1 = require("discord.js");
const Card_1 = require("../database/models/Card");
const rarities_1 = require("../config/rarities");
const cardBrowser_1 = require("../utils/cardBrowser");
/**
 * /catalogue — parcourt les cartes : un menu déroulant pour choisir une carte
 * directement + les boutons ◀ / ▶ pour changer de page.
 */
exports.catalogue = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('catalogue')
        .setDescription('Parcours les cartes de la collection (menu déroulant).'),
    async execute(interaction) {
        const rarityRank = new Map(rarities_1.RARITIES.map((r, i) => [r, i]));
        const cards = await Card_1.Card.find();
        cards.sort((a, b) => {
            const byRarity = (rarityRank.get(b.rarity) ?? 0) - (rarityRank.get(a.rarity) ?? 0);
            return byRarity !== 0 ? byRarity : b.price - a.price;
        });
        if (cards.length === 0) {
            await interaction.reply({
                content: '📭 Le catalogue est vide pour l’instant. Reviens bientôt !',
            });
            return;
        }
        await (0, cardBrowser_1.browseCards)(interaction, cards);
    },
};
