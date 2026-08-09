import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
  type ChatInputCommandInteraction,
} from 'discord.js';
import type { Command } from '../types';
import { Card } from '../database/models/Card';
import { buildDropComponents } from '../utils/dropMessage';

/**
 * /drop <id> — (Admin) poste une carte achetable dans le salon courant,
 * avec un bouton « Acheter ». La protection anti-concurrence est côté service
 * d'achat (voir services/purchase.ts).
 */
export const drop: Command = {
  data: new SlashCommandBuilder()
    .setName('drop')
    .setDescription('(Admin) Poste une carte achetable dans ce salon.')
    .addStringOption((option) =>
      option
        .setName('id')
        .setDescription('ID de la carte à droper (ex: ycc-originel)')
        .setRequired(true),
    )
    // Masque la commande aux non-admins dans l'interface Discord.
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction: ChatInputCommandInteraction) {
    // Sécurité en profondeur : on revérifie côté serveur (au cas où).
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
        content: `❓ Aucune carte avec l’ID \`${id}\`. Vois \`/catalogue\`.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (card.remainingSupply <= 0) {
      await interaction.reply({
        content: `⚠️ La carte **${card.name}** est déjà épuisée, impossible de la droper.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Message PUBLIC : tout le monde voit la carte et peut cliquer « Acheter ».
    await interaction.reply(buildDropComponents(card));
  },
};
