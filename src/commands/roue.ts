import {
  SlashCommandBuilder,
  EmbedBuilder,
  MessageFlags,
  type ChatInputCommandInteraction,
} from 'discord.js';
import type { Command } from '../types';
import { spinWheel } from '../services/wheel';
import { formatDuration } from '../utils/time';

/**
 * /roue — tourne la roue de la fortune (gratuit, une fois par 24 h).
 */
export const roue: Command = {
  data: new SlashCommandBuilder()
    .setName('roue')
    .setDescription('Tourne la roue de la fortune (gratuit, 1×/jour) !'),

  async execute(interaction: ChatInputCommandInteraction) {
    const res = await spinWheel(interaction.user.id);

    if (res.status === 'cooldown') {
      await interaction.reply({
        content: `🎡 Tu as déjà tourné la roue. Reviens dans **${formatDuration(res.remaining)}**.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const lines = res.outcomes.map((o) => `${o.emoji} **${o.label}** — ${o.detail}`);
    const gagne = res.outcomes.some((o) => o.label !== 'Rien...');

    const embed = new EmbedBuilder()
      .setColor(gagne ? 0x2ecc71 : 0x95a5a6)
      .setTitle('🎡 Roue de la fortune')
      .setDescription(lines.join('\n'))
      .setFooter({ text: `Solde : ${res.newBalance} Yumz` });

    await interaction.reply({ embeds: [embed] });
  },
};
