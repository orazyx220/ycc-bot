import {
  SlashCommandBuilder,
  MessageFlags,
  type ChatInputCommandInteraction,
} from 'discord.js';
import type { Command } from '../types';
import { transferCard } from '../services/cardGrant';

/**
 * /donner <membre> <id> — donne une de TES cartes à un autre membre.
 * La carte quitte ton inventaire pour rejoindre le sien (stock global inchangé).
 */
export const donner: Command = {
  data: new SlashCommandBuilder()
    .setName('donner')
    .setDescription('Donne une de tes cartes à un membre.')
    .addUserOption((o) =>
      o.setName('membre').setDescription('Le membre à qui donner la carte').setRequired(true),
    )
    .addStringOption((o) =>
      o.setName('id').setDescription('ID de la carte à donner').setRequired(true),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser('membre', true);
    const id = interaction.options.getString('id', true).trim();

    if (target.bot) {
      await interaction.reply({
        content: '🤖 Tu ne peux pas donner une carte à un bot.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    if (target.id === interaction.user.id) {
      await interaction.reply({
        content: '🙂 Tu ne peux pas te donner une carte à toi-même.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const res = await transferCard(interaction.user.id, target.id, id);
    switch (res.status) {
      case 'notfound':
        await interaction.reply({
          content: `❓ Aucune carte avec l’ID \`${id}\`.`,
          flags: MessageFlags.Ephemeral,
        });
        return;
      case 'notowned':
        await interaction.reply({
          content: `❌ Tu ne possèdes pas la carte \`${id}\`. Vois ton \`/inventaire\`.`,
          flags: MessageFlags.Ephemeral,
        });
        return;
      case 'ok':
        await interaction.reply({
          content: `🎁 <@${interaction.user.id}> a donné **${res.card.name}** à <@${target.id}> !`,
          allowedMentions: { users: [] },
        });
        return;
    }
  },
};
