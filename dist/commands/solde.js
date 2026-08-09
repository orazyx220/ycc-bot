"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.solde = void 0;
const discord_js_1 = require("discord.js");
const User_1 = require("../database/models/User");
/**
 * /solde [membre] — affiche le solde de Yumz. Sans argument : le tien.
 */
exports.solde = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('solde')
        .setDescription('Affiche ton solde de Yumz (ou celui d’un membre).')
        .addUserOption((o) => o.setName('membre').setDescription('Le membre dont voir le solde (toi par défaut)')),
    async execute(interaction) {
        const target = interaction.options.getUser('membre') ?? interaction.user;
        const isSelf = target.id === interaction.user.id;
        const user = await (0, User_1.getOrCreateUser)(target.id);
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(0xf1c40f) // jaune "pièce"
            .setAuthor({
            name: target.username,
            iconURL: target.displayAvatarURL(),
        })
            .setTitle(isSelf ? '💰 Ton porte-monnaie' : `💰 Porte-monnaie de ${target.username}`)
            .setDescription(`${isSelf ? 'Tu possèdes' : 'Ce membre possède'} **${user.yumz}** Yumz.`)
            .setFooter({ text: `${user.cards.length} carte(s) en collection` });
        await interaction.reply({ embeds: [embed] });
    },
};
