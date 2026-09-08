"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.catalogue = void 0;
const discord_js_1 = require("discord.js");
const Card_1 = require("../database/models/Card");
const rarities_1 = require("../config/rarities");
const cardEmbed_1 = require("../utils/cardEmbed");
const pagination_1 = require("../utils/pagination");
/**
 * /catalogue — feuillette les cartes une par une (image en grand), avec les
 * boutons ◀ / ▶ et un bouton 🔍 pour rechercher une carte par nom/ID.
 */
exports.catalogue = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('catalogue')
        .setDescription('Feuillette les cartes de la collection (avec recherche 🔍).'),
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
        const pages = cards.map((card, i) => (0, cardEmbed_1.buildCardEmbed)(card).setFooter({
            text: `ID : ${card.cardId}  •  Page ${i + 1}/${cards.length}`,
        }));
        // Texte cherchable par carte : nom + ID + libellé de rareté.
        const searchKeys = cards.map((c) => `${c.name} ${c.cardId} ${(0, rarities_1.rarityInfo)(c.rarity).label}`);
        await (0, pagination_1.paginateEmbeds)(interaction, pages, { searchKeys });
    },
};
