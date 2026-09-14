"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearcards = void 0;
const discord_js_1 = require("discord.js");
const cardGrant_1 = require("../services/cardGrant");
/**
 * /clearcards <membre> [rendre_au_stock] — (Admin) vide TOUT l'inventaire de
 * cartes d'un membre. Par défaut, les exemplaires sont remis dans le stock.
 * (Pour vider TOUT le serveur : /reset cible:inventaires.)
 */
exports.clearcards = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('clearcards')
        .setDescription('(Admin) Vide tout l’inventaire de cartes d’un membre.')
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator)
        .addUserOption((o) => o.setName('membre').setDescription('Le membre dont vider l’inventaire').setRequired(true))
        .addBooleanOption((o) => o
        .setName('rendre_au_stock')
        .setDescription('Remettre les exemplaires dans le stock (défaut : oui)')),
    async execute(interaction) {
        if (!interaction.memberPermissions?.has(discord_js_1.PermissionFlagsBits.Administrator)) {
            await interaction.reply({
                content: '🚫 Cette commande est réservée aux administrateurs.',
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
            return;
        }
        const target = interaction.options.getUser('membre', true);
        const restock = interaction.options.getBoolean('rendre_au_stock') ?? true;
        const res = await (0, cardGrant_1.clearInventory)(target.id, restock);
        if (res.removed === 0) {
            await interaction.reply({
                content: `ℹ️ <@${target.id}> n’a aucune carte.`,
                flags: discord_js_1.MessageFlags.Ephemeral,
                allowedMentions: { users: [] },
            });
            return;
        }
        const stockText = res.restocked ? ' (remises dans le stock)' : '';
        await interaction.reply({
            content: `🗑️ **${res.removed}** carte(s) retirée(s) de l’inventaire de <@${target.id}>${stockText}.`,
            allowedMentions: { users: [] },
        });
    },
};
