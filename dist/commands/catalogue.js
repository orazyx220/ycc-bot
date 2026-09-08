"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.catalogue = void 0;
const discord_js_1 = require("discord.js");
const Card_1 = require("../database/models/Card");
const rarities_1 = require("../config/rarities");
const cardBrowser_1 = require("../utils/cardBrowser");
const cardSearch_1 = require("../utils/cardSearch");
/**
 * /catalogue [recherche] — parcourt les cartes avec un menu déroulant (◀ / ▶
 * pour changer de lot). L'option `recherche` (autocomplétée) filtre par nom/ID.
 */
exports.catalogue = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('catalogue')
        .setDescription('Parcours les cartes de la collection (menu + recherche).')
        .addStringOption((o) => o
        .setName('recherche')
        .setDescription('Cherche une carte par nom/ID (tape pour voir les suggestions)')
        .setAutocomplete(true)),
    async autocomplete(interaction) {
        await (0, cardSearch_1.respondCardAutocomplete)(interaction, false);
    },
    async execute(interaction) {
        const recherche = interaction.options.getString('recherche') ?? '';
        const rarityRank = new Map(rarities_1.RARITIES.map((r, i) => [r, i]));
        let cards = await Card_1.Card.find();
        if (recherche)
            cards = cards.filter((c) => (0, cardSearch_1.matchesSearch)(c, recherche));
        cards.sort((a, b) => {
            const byRarity = (rarityRank.get(b.rarity) ?? 0) - (rarityRank.get(a.rarity) ?? 0);
            return byRarity !== 0 ? byRarity : b.price - a.price;
        });
        if (cards.length === 0) {
            await interaction.reply({
                content: recherche
                    ? '🔍 Aucune carte ne correspond à ta recherche.'
                    : '📭 Le catalogue est vide pour l’instant. Reviens bientôt !',
                flags: recherche ? discord_js_1.MessageFlags.Ephemeral : undefined,
            });
            return;
        }
        await (0, cardBrowser_1.browseCards)(interaction, cards);
    },
};
