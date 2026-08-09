"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.drop = void 0;
const discord_js_1 = require("discord.js");
const Card_1 = require("../database/models/Card");
const dropMessage_1 = require("../utils/dropMessage");
/**
 * /drop <id> — (Admin) poste une carte achetable dans le salon courant,
 * avec un bouton « Acheter ». La protection anti-concurrence est côté service
 * d'achat (voir services/purchase.ts).
 */
exports.drop = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('drop')
        .setDescription('(Admin) Poste une carte achetable dans ce salon.')
        .addStringOption((option) => option
        .setName('id')
        .setDescription('ID de la carte à droper (ex: ycc-originel)')
        .setRequired(true))
        // Masque la commande aux non-admins dans l'interface Discord.
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator),
    async execute(interaction) {
        // Sécurité en profondeur : on revérifie côté serveur (au cas où).
        if (!interaction.memberPermissions?.has(discord_js_1.PermissionFlagsBits.Administrator)) {
            await interaction.reply({
                content: '🚫 Cette commande est réservée aux administrateurs.',
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
            return;
        }
        const id = interaction.options.getString('id', true).trim();
        const card = await Card_1.Card.findOne({ cardId: id });
        if (!card) {
            await interaction.reply({
                content: `❓ Aucune carte avec l’ID \`${id}\`. Vois \`/catalogue\`.`,
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
            return;
        }
        if (card.remainingSupply <= 0) {
            await interaction.reply({
                content: `⚠️ La carte **${card.name}** est déjà épuisée, impossible de la droper.`,
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
            return;
        }
        // Message PUBLIC : tout le monde voit la carte et peut cliquer « Acheter ».
        await interaction.reply((0, dropMessage_1.buildDropComponents)(card));
    },
};
