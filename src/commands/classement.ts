import {
  SlashCommandBuilder,
  EmbedBuilder,
  type ChatInputCommandInteraction,
} from 'discord.js';
import type { Command } from '../types';
import { User, getOrCreateUser } from '../database/models/User';

const TOP_SIZE = 10;
const MEDALS = ['🥇', '🥈', '🥉'];

/**
 * /classement — affiche le top des membres par solde de Yumz,
 * plus le rang personnel de celui qui lance la commande.
 */
export const classement: Command = {
  data: new SlashCommandBuilder()
    .setName('classement')
    .setDescription('Affiche le top des membres les plus riches en Yumz.'),

  async execute(interaction: ChatInputCommandInteraction) {
    const top = await User.find({ yumz: { $gt: 0 } })
      .sort({ yumz: -1 })
      .limit(TOP_SIZE);

    if (top.length === 0) {
      await interaction.reply({
        content: '📊 Personne n’a encore de Yumz. Sois le premier avec `/daily` !',
      });
      return;
    }

    // Une ligne par membre : médaille pour le podium, sinon le rang.
    const lines = top.map((u, i) => {
      const rank = MEDALS[i] ?? `**${i + 1}.**`;
      return `${rank} <@${u.discordId}> — 💰 **${u.yumz}** Yumz`;
    });

    // Rang personnel = nombre de membres strictement au-dessus + 1.
    const me = await getOrCreateUser(interaction.user.id);
    const higher = await User.countDocuments({ yumz: { $gt: me.yumz } });
    const myRank = higher + 1;

    const embed = new EmbedBuilder()
      .setColor(0xf1c40f)
      .setTitle('🏆 Classement des Yumz')
      .setDescription(lines.join('\n'))
      .setFooter({ text: `Ton rang : #${myRank} · ${me.yumz} Yumz` });

    await interaction.reply({ embeds: [embed], allowedMentions: { users: [] } });
  },
};
