import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
  type ChatInputCommandInteraction,
} from 'discord.js';
import type { Command } from '../types';
import { Card } from '../database/models/Card';
import { User } from '../database/models/User';

/**
 * /delcard <id> — (Admin) supprime définitivement une carte.
 * Retire aussi ses exemplaires des inventaires des membres, pour ne pas
 * laisser de références orphelines. Idéal pour nettoyer des cartes de test.
 */
export const delcard: Command = {
  data: new SlashCommandBuilder()
    .setName('delcard')
    .setDescription('(Admin) Supprime une carte.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((o) =>
      o.setName('id').setDescription('ID de la carte à supprimer').setRequired(true),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({
        content: '🚫 Cette commande est réservée aux administrateurs.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const id = interaction.options.getString('id', true).trim();
    const card = await Card.findOne({ cardId: id });
    if (!card) {
      await interaction.reply({
        content: `❓ Aucune carte avec l’ID \`${id}\`.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await Card.deleteOne({ cardId: id });
    const pulled = await User.updateMany({ cards: id }, { $pull: { cards: id } });

    await interaction.reply({
      content:
        `🗑️ Carte **${card.name}** (\`${id}\`) supprimée.\n` +
        `Retirée aussi de **${pulled.modifiedCount}** inventaire(s).`,
      flags: MessageFlags.Ephemeral,
    });
  },
};
