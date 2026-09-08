"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.takecard = void 0;
const discord_js_1 = require("discord.js");
const cardGrant_1 = require("../services/cardGrant");
/**
 * /takecard <membre> <id> [rendre_au_stock] — (Admin) retire un exemplaire
 * d'une carte de l'inventaire d'un membre. Par défaut, l'exemplaire est remis
 * dans le stock global (pour qu'une carte limitée reste ré-obtenable).
 */
exports.takecard = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('takecard')
        .setDescription('(Admin) Retire une carte de l’inventaire d’un membre.')
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator)
        .addUserOption((o) => o.setName('membre').setDescription('Le membre à qui retirer la carte').setRequired(true))
        .addStringOption((o) => o.setName('id').setDescription('ID de la carte à retirer').setRequired(true))
        .addBooleanOption((o) => o
        .setName('rendre_au_stock')
        .setDescription('Remettre l’exemplaire dans le stock global (défaut : oui)')),
    async execute(interaction) {
        if (!interaction.memberPermissions?.has(discord_js_1.PermissionFlagsBits.Administrator)) {
            await interaction.reply({
                content: '🚫 Cette commande est réservée aux administrateurs.',
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
            return;
        }
        const target = interaction.options.getUser('membre', true);
        const id = interaction.options.getString('id', true).trim();
        const restock = interaction.options.getBoolean('rendre_au_stock') ?? true;
        const res = await (0, cardGrant_1.takeCard)(target.id, id, restock);
        if (res.status === 'notowned') {
            await interaction.reply({
                content: `❌ <@${target.id}> ne possède pas la carte \`${id}\`.`,
                flags: discord_js_1.MessageFlags.Ephemeral,
                allowedMentions: { users: [] },
            });
            return;
        }
        const nom = res.card ? res.card.name : id;
        const stockText = res.restocked ? ' (remise dans le stock)' : '';
        await interaction.reply({
            content: `🗑️ **${nom}** retirée de l’inventaire de <@${target.id}>${stockText}.`,
            allowedMentions: { users: [] },
        });
    },
};
