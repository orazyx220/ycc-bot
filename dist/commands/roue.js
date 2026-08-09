"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roue = void 0;
const discord_js_1 = require("discord.js");
const wheel_1 = require("../services/wheel");
const time_1 = require("../utils/time");
/**
 * /roue — tourne la roue de la fortune (gratuit, une fois par 24 h).
 */
exports.roue = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('roue')
        .setDescription('Tourne la roue de la fortune (gratuit, 1×/jour) !'),
    async execute(interaction) {
        const res = await (0, wheel_1.spinWheel)(interaction.user.id);
        if (res.status === 'cooldown') {
            await interaction.reply({
                content: `🎡 Tu as déjà tourné la roue. Reviens dans **${(0, time_1.formatDuration)(res.remaining)}**.`,
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
            return;
        }
        const lines = res.outcomes.map((o) => `${o.emoji} **${o.label}** — ${o.detail}`);
        const gagne = res.outcomes.some((o) => o.label !== 'Rien...');
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(gagne ? 0x2ecc71 : 0x95a5a6)
            .setTitle('🎡 Roue de la fortune')
            .setDescription(lines.join('\n'))
            .setFooter({ text: `Solde : ${res.newBalance} Yumz` });
        await interaction.reply({ embeds: [embed] });
    },
};
