import {
  SlashCommandBuilder,
  EmbedBuilder,
  type ChatInputCommandInteraction,
} from 'discord.js';
import type { Command } from '../types';
import { getOrCreateUser } from '../database/models/User';

/**
 * /solde [membre] — affiche le solde de Yumz. Sans argument : le tien.
 */
export const solde: Command = {
  data: new SlashCommandBuilder()
    .setName('solde')
    .setDescription('Affiche ton solde de Yumz (ou celui d’un membre).')
    .addUserOption((o) =>
      o.setName('membre').setDescription('Le membre dont voir le solde (toi par défaut)'),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser('membre') ?? interaction.user;
    const isSelf = target.id === interaction.user.id;
    const user = await getOrCreateUser(target.id);

    const embed = new EmbedBuilder()
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
