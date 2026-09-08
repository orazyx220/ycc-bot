"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.catalogue = void 0;
const discord_js_1 = require("discord.js");
const Card_1 = require("../database/models/Card");
const rarities_1 = require("../config/rarities");
const cardEmbed_1 = require("../utils/cardEmbed");
const pagination_1 = require("../utils/pagination");
const cardSearch_1 = require("../utils/cardSearch");
/**
 * /catalogue [recherche] [rarete] — feuillette les cartes (image en grand),
 * avec les boutons ◀ / ▶. Les options permettent de filtrer par nom/ID et rareté.
 */
exports.catalogue = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('catalogue')
        .setDescription('Feuillette les cartes de la collection (avec recherche).')
        .addStringOption((o) => o.setName('recherche').setDescription('Filtrer par nom ou ID de carte').setAutocomplete(true))
        .addStringOption((o) => o
        .setName('rarete')
        .setDescription('Filtrer par rareté')
        .addChoices(...rarities_1.RARITIES.map((r) => ({ name: rarities_1.RARITY_INFO[r].label, value: r })))),
    async autocomplete(interaction) {
        await (0, cardSearch_1.respondCardAutocomplete)(interaction, false);
    },
    async execute(interaction) {
        const recherche = interaction.options.getString('recherche') ?? '';
        const rarete = interaction.options.getString('rarete');
        const rarityRank = new Map(rarities_1.RARITIES.map((r, i) => [r, i]));
        let cards = await Card_1.Card.find();
        // Filtres (recherche texte + rareté).
        if (recherche)
            cards = cards.filter((c) => (0, cardSearch_1.matchesSearch)(c, recherche));
        if (rarete)
            cards = cards.filter((c) => c.rarity === rarete);
        // Tri : rareté (légendaire d'abord), puis prix décroissant.
        cards.sort((a, b) => {
            const byRarity = (rarityRank.get(b.rarity) ?? 0) - (rarityRank.get(a.rarity) ?? 0);
            return byRarity !== 0 ? byRarity : b.price - a.price;
        });
        if (cards.length === 0) {
            const filtre = recherche || rarete;
            await interaction.reply({
                content: filtre
                    ? '🔍 Aucune carte ne correspond à ta recherche.'
                    : '📭 Le catalogue est vide pour l’instant. Reviens bientôt !',
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
            return;
        }
        const pages = cards.map((card, i) => (0, cardEmbed_1.buildCardEmbed)(card).setFooter({
            text: `ID : ${card.cardId}  •  Page ${i + 1}/${cards.length}`,
        }));
        await (0, pagination_1.paginateEmbeds)(interaction, pages);
    },
};
