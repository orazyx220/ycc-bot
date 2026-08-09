"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inventaire = void 0;
const discord_js_1 = require("discord.js");
const User_1 = require("../database/models/User");
const Card_1 = require("../database/models/Card");
const rarities_1 = require("../config/rarities");
const pagination_1 = require("../utils/pagination");
/**
 * /inventaire [membre] — feuillette les cartes possédées (image en grand),
 * avec la quantité de chaque carte. Sans argument : ton propre inventaire.
 */
exports.inventaire = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('inventaire')
        .setDescription('Affiche tes cartes (ou celles d’un membre).')
        .addUserOption((option) => option
        .setName('membre')
        .setDescription('Le membre dont voir l’inventaire (toi par défaut)')
        .setRequired(false)),
    async execute(interaction) {
        const target = interaction.options.getUser('membre') ?? interaction.user;
        const isSelf = target.id === interaction.user.id;
        const user = await (0, User_1.getOrCreateUser)(target.id);
        if (user.cards.length === 0) {
            await interaction.reply({
                content: isSelf
                    ? '🗃️ Ton inventaire est vide. Achète des cartes lors d’un `/drop` !'
                    : `🗃️ ${target.username} n’a encore aucune carte.`,
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
            return;
        }
        // On compte combien d'exemplaires de chaque carte le membre possède.
        const counts = new Map();
        for (const id of user.cards)
            counts.set(id, (counts.get(id) ?? 0) + 1);
        // On récupère les métadonnées des cartes possédées, en une seule requête.
        const cards = await Card_1.Card.find({ cardId: { $in: [...counts.keys()] } });
        const cardById = new Map(cards.map((c) => [c.cardId, c]));
        // Tri : rareté (légendaire d'abord), puis nom.
        const rarityRank = new Map(rarities_1.RARITIES.map((r, i) => [r, i]));
        const owned = [...counts.keys()]
            .map((id) => cardById.get(id))
            .filter((c) => Boolean(c))
            .sort((a, b) => (rarityRank.get(b.rarity) ?? 0) - (rarityRank.get(a.rarity) ?? 0) ||
            a.name.localeCompare(b.name));
        const total = owned.length;
        const pages = owned.map((card, i) => {
            const info = (0, rarities_1.rarityInfo)(card.rarity);
            const qty = counts.get(card.cardId) ?? 1;
            return new discord_js_1.EmbedBuilder()
                .setColor(card.borderColor ?? info.color)
                .setAuthor({
                name: `Collection de ${target.username}`,
                iconURL: target.displayAvatarURL(),
            })
                .setTitle(`${info.emoji} ${card.name}`)
                .setImage(card.imageUrl)
                .addFields({ name: 'Rareté', value: info.label, inline: true }, { name: 'Possédées', value: `×${qty}`, inline: true })
                .setFooter({ text: `ID : ${card.cardId}  •  ${i + 1}/${total}` });
        });
        await (0, pagination_1.paginateEmbeds)(interaction, pages);
    },
};
