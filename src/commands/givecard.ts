import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
  type ChatInputCommandInteraction,
} from 'discord.js';
import type { Command } from '../types';
import { claimFreeCard } from '../services/purchase';
import { mintBonusCard } from '../services/cardGrant';

/**
 * /givecard <membre> <id> [bonus] — (Admin) offre une carte à un membre.
 * - Par défaut : prend un exemplaire sur le stock (respecte l'unicité).
 * - bonus:true : crée un exemplaire HORS stock (dépasse la limite) — exception.
 */
export const givecard: Command = {
  data: new SlashCommandBuilder()
    .setName('givecard')
    .setDescription('(Admin) Offre une carte à un membre.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption((o) =>
      o.setName('membre').setDescription('Le membre à qui offrir la carte').setRequired(true),
    )
    .addStringOption((o) =>
      o.setName('id').setDescription('ID de la carte').setRequired(true),
    )
    .addBooleanOption((o) =>
      o
        .setName('bonus')
        .setDescription('Créer un exemplaire BONUS sans toucher au stock (dépasse la limite)'),
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
    const bonus = interaction.options.getBoolean('bonus') ?? false;

    if (target.bot) {
      await interaction.reply({
        content: '🤖 Tu ne peux pas offrir de carte à un bot.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Cas "bonus" : exemplaire hors stock (exception assumée).
    if (bonus) {
      const res = await mintBonusCard(target.id, id);
      if (res.status === 'notfound') {
        await interaction.reply({
          content: `❓ Aucune carte avec l’ID \`${id}\`.`,
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      await interaction.reply({
        content: `🎁 Exemplaire **bonus** de **${res.card.name}** offert à <@${target.id}> (hors stock).`,
        allowedMentions: { users: [] },
      });
      return;
    }

    // Cas normal : on prend un exemplaire sur le stock.
    const res = await claimFreeCard(target.id, id, 'admin_give_card');
    switch (res.status) {
      case 'ok':
        await interaction.reply({
          content: `🎁 **${res.card.name}** — exemplaire **#${res.serial}/${res.card.maxSupply}** offert à <@${target.id}> !`,
          allowedMentions: { users: [] },
        });
        return;
      case 'soldout':
        await interaction.reply({
          content: `⚠️ La carte \`${id}\` est épuisée. Utilise \`bonus: true\` pour forcer un exemplaire hors stock.`,
          flags: MessageFlags.Ephemeral,
        });
        return;
      case 'notfound':
        await interaction.reply({
          content: `❓ Aucune carte avec l’ID \`${id}\`.`,
          flags: MessageFlags.Ephemeral,
        });
        return;
    }
  },
};
