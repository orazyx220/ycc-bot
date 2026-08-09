"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.delcard = void 0;
const discord_js_1 = require("discord.js");
const Card_1 = require("../database/models/Card");
const User_1 = require("../database/models/User");
/**
 * /delcard <id> — (Admin) supprime définitivement une carte.
 * Retire aussi ses exemplaires des inventaires des membres, pour ne pas
 * laisser de références orphelines. Idéal pour nettoyer des cartes de test.
 */
exports.delcard = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('delcard')
        .setDescription('(Admin) Supprime une carte.')
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator)
        .addStringOption((o) => o.setName('id').setDescription('ID de la carte à supprimer').setRequired(true)),
    async execute(interaction) {
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
                content: `❓ Aucune carte avec l’ID \`${id}\`.`,
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
            return;
        }
        await Card_1.Card.deleteOne({ cardId: id });
        const pulled = await User_1.User.updateMany({ cards: id }, { $pull: { cards: id } });
        await interaction.reply({
            content: `🗑️ Carte **${card.name}** (\`${id}\`) supprimée.\n` +
                `Retirée aussi de **${pulled.modifiedCount}** inventaire(s).`,
            flags: discord_js_1.MessageFlags.Ephemeral,
        });
    },
};
