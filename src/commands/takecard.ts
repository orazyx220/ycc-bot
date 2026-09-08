import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
  type ChatInputCommandInteraction,
} from 'discord.js';
import type { Command } from '../types';
import { takeCard } from '../services/cardGrant';

/**
 * /takecard <membre> <id> [rendre_au_stock] — (Admin) retire un exemplaire
 * d'une carte de l'inventaire d'un membre. Par défaut, l'exemplaire est remis
 * dans le stock global (pour qu'une carte limitée reste ré-obtenable).
 */
export const takecard: Command = {
  data: new SlashCommandBuilder()
    .setName('takecard')
    .setDescription('(Admin) Retire une carte de l’inventaire d’un membre.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption((o) =>
      o.setName('membre').setDescription('Le membre à qui retirer la carte').setRequired(true),
    )
    .addStringOption((o) =>
      o.setName('id').setDescription('ID de la carte à retirer').setRequired(true),
    )
    .addBooleanOption((o) =>
      o
        .setName('rendre_au_stock')
        .setDescription('Remettre l’exemplaire dans le stock global (défaut : oui)'),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({
        content: '🚫 Cette commande est réservée aux administrateurs.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const target = interaction.options.getUser('membre', true);
    const id = interaction.options.getString('id', true).trim();
    const restock = interaction.options.getBoolean('rendre_au_stock') ?? true;

    const res = await takeCard(target.id, id, restock);

    if (res.status === 'notowned') {
      await interaction.reply({
        content: `❌ <@${target.id}> ne possède pas la carte \`${id}\`.`,
        flags: MessageFlags.Ephemeral,
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
