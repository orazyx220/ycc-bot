import {
  SlashCommandBuilder,
  MessageFlags,
  type ChatInputCommandInteraction,
} from 'discord.js';
import type { Command } from '../types';
import { Card } from '../database/models/Card';
import { buildCardEmbed } from '../utils/cardEmbed';

/**
 * /carte <id> — affiche la fiche détaillée d'une carte (image en grand).
 */
export const carte: Command = {
  data: new SlashCommandBuilder()
    .setName('carte')
    .setDescription('Affiche le détail d’une carte.')
    .addStringOption((option) =>
      option
        .setName('id')
        .setDescription('L’identifiant de la carte (ex: dragon-epique)')
        .setRequired(true),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    // getString('id', true) : le "true" garantit qu'on reçoit bien une valeur.
    const id = interaction.options.getString('id', true).trim();

    const card = await Card.findOne({ cardId: id });

    if (!card) {
      await interaction.reply({
        content: `❓ Aucune carte avec l’ID \`${id}\`. Regarde \`/catalogue\` pour la liste.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.reply({ embeds: [buildCardEmbed(card)] });
  },
};
