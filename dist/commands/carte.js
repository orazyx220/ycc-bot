"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.carte = void 0;
const discord_js_1 = require("discord.js");
const Card_1 = require("../database/models/Card");
const cardEmbed_1 = require("../utils/cardEmbed");
const cardSearch_1 = require("../utils/cardSearch");
/**
 * /carte <id> — affiche la fiche détaillée d'une carte (image en grand).
 */
exports.carte = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('carte')
        .setDescription('Affiche le détail d’une carte.')
        .addStringOption((option) => option
        .setName('id')
        .setDescription('La carte (tape son nom)')
        .setRequired(true)
        .setAutocomplete(true)),
    async autocomplete(interaction) {
        await (0, cardSearch_1.respondCardIdAutocomplete)(interaction);
    },
    async execute(interaction) {
        // getString('id', true) : le "true" garantit qu'on reçoit bien une valeur.
        const id = interaction.options.getString('id', true).trim();
        const card = await Card_1.Card.findOne({ cardId: id });
        if (!card) {
            await interaction.reply({
                content: `❓ Aucune carte avec l’ID \`${id}\`. Regarde \`/catalogue\` pour la liste.`,
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
            return;
        }
        await interaction.reply({ embeds: [(0, cardEmbed_1.buildCardEmbed)(card)] });
    },
};
