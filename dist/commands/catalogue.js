"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.catalogue = void 0;
const discord_js_1 = require("discord.js");
const Card_1 = require("../database/models/Card");
const rarities_1 = require("../config/rarities");
const cardEmbed_1 = require("../utils/cardEmbed");
const pagination_1 = require("../utils/pagination");
/**
 * /catalogue — feuillette toutes les cartes une par une (image en grand),
 * avec les boutons ◀ / ▶. Pour ouvrir une carte précise : /carte <id>.
 */
exports.catalogue = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('catalogue')
        .setDescription('Feuillette toutes les cartes disponibles à la collection.'),
    async execute(interaction) {
        // On trie par rareté (légendaire d'abord), puis par prix décroissant :
        // les cartes les plus prestigieuses ouvrent le catalogue.
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
        // Une page = une carte. On ajoute un indicateur "Page x/n" dans le pied.
        const pages = cards.map((card, i) => (0, cardEmbed_1.buildCardEmbed)(card).setFooter({
            text: `ID : ${card.cardId}  •  Page ${i + 1}/${cards.length}`,
        }));
        await (0, pagination_1.paginateEmbeds)(interaction, pages);
    },
};
