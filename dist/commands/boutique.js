"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.boutique = void 0;
const discord_js_1 = require("discord.js");
const Card_1 = require("../database/models/Card");
const rarities_1 = require("../config/rarities");
const cardBrowser_1 = require("../utils/cardBrowser");
const cardSearch_1 = require("../utils/cardSearch");
/**
 * /boutique [recherche] — parcourt les cartes en stock (menu déroulant + ◀ / ▶)
 * et achète celle affichée. L'option `recherche` (autocomplétée) filtre par nom/ID.
 */
exports.boutique = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('boutique')
        .setDescription('Achète des cartes avec tes Yumz (menu + recherche).')
        .addStringOption((o) => o
        .setName('recherche')
        .setDescription('Cherche une carte par nom/ID (tape pour voir les suggestions)')
        .setAutocomplete(true)),
    async autocomplete(interaction) {
        await (0, cardSearch_1.respondCardAutocomplete)(interaction, true);
    },
    async execute(interaction) {
        const recherche = interaction.options.getString('recherche') ?? '';
        const rank = new Map(rarities_1.RARITIES.map((r, i) => [r, i]));
        let cards = await Card_1.Card.find({ remainingSupply: { $gt: 0 } });
        if (recherche)
            cards = cards.filter((c) => (0, cardSearch_1.matchesSearch)(c, recherche));
        cards.sort((a, b) => (rank.get(b.rarity) ?? 0) - (rank.get(a.rarity) ?? 0) || b.price - a.price);
        if (cards.length === 0) {
            await interaction.reply({
                content: recherche
                    ? '🔍 Aucune carte en stock ne correspond à ta recherche.'
                    : '🛒 La boutique est vide pour l’instant.',
                flags: recherche ? discord_js_1.MessageFlags.Ephemeral : undefined,
            });
            return;
        }
        await (0, cardBrowser_1.browseCards)(interaction, cards, { buy: true });
    },
};
