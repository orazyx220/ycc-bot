import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
  type ChatInputCommandInteraction,
} from 'discord.js';
import type { Command } from '../types';
import { clearInventory } from '../services/cardGrant';

/**
 * /clearcards <membre> [rendre_au_stock] — (Admin) vide TOUT l'inventaire de
 * cartes d'un membre. Par défaut, les exemplaires sont remis dans le stock.
 * (Pour vider TOUT le serveur : /reset cible:inventaires.)
 */
export const clearcards: Command = {
  data: new SlashCommandBuilder()
    .setName('clearcards')
    .setDescription('(Admin) Vide tout l’inventaire de cartes d’un membre.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption((o) =>
      o.setName('membre').setDescription('Le membre dont vider l’inventaire').setRequired(true),
    )
    .addBooleanOption((o) =>
      o
        .setName('rendre_au_stock')
        .setDescription('Remettre les exemplaires dans le stock (défaut : oui)'),
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
    const restock = interaction.options.getBoolean('rendre_au_stock') ?? true;

    const res = await clearInventory(target.id, restock);

    if (res.removed === 0) {
      await interaction.reply({
        content: `ℹ️ <@${target.id}> n’a aucune carte.`,
        flags: MessageFlags.Ephemeral,
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
