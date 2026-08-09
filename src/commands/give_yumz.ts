import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
  type ChatInputCommandInteraction,
} from 'discord.js';
import type { Command } from '../types';
import { grantYumz } from '../services/economy';

/**
 * /give_yumz <membre> <montant> [raison] — (Admin) crédite ou débite des Yumz.
 * Montant négatif = on retire. Sert aussi à corriger un solde à la main.
 */
export const giveYumz: Command = {
  data: new SlashCommandBuilder()
    .setName('give_yumz')
    .setDescription('(Admin) Donne ou retire des Yumz à un membre.')
    .addUserOption((o) =>
      o.setName('membre').setDescription('Le membre concerné').setRequired(true),
    )
    .addIntegerOption((o) =>
      o
        .setName('montant')
        .setDescription('Montant à donner (négatif pour retirer)')
        .setRequired(true),
    )
    .addStringOption((o) =>
      o.setName('raison').setDescription('Raison (facultatif)').setRequired(false),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({
        content: '🚫 Cette commande est réservée aux administrateurs.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const target = interaction.options.getUser('membre', true);
    const montant = interaction.options.getInteger('montant', true);
    const raison = interaction.options.getString('raison') ?? undefined;

    if (montant === 0) {
      await interaction.reply({
        content: '❔ Le montant doit être différent de 0.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const newBalance = await grantYumz(target.id, montant, 'admin_give', raison);
    const signe = montant > 0 ? `+${montant}` : `${montant}`;

    await interaction.reply({
      content:
        `✅ **${signe} Yumz** pour <@${target.id}>. Nouveau solde : **${newBalance}** Yumz.` +
        (raison ? `\n📝 Raison : ${raison}` : ''),
      allowedMentions: { users: [] }, // on n'envoie pas de ping
    });
  },
};
