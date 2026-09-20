import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
  type ChatInputCommandInteraction,
} from 'discord.js';
import type { Command } from '../types';
import { grantYumz } from '../services/economy';

/**
 * /take_yumz <membre> <montant> [raison] — (Admin) retire des Yumz à un membre.
 * Le montant est positif (= ce qu'on retire). Le solde ne descend jamais sous 0.
 */
export const takeYumz: Command = {
  data: new SlashCommandBuilder()
    .setName('take_yumz')
    .setDescription('(Admin) Retire des Yumz à un membre.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption((o) =>
      o.setName('membre').setDescription('Le membre concerné').setRequired(true),
    )
    .addIntegerOption((o) =>
      o.setName('montant').setDescription('Yumz à retirer').setRequired(true).setMinValue(1),
    )
    .addStringOption((o) =>
      o.setName('raison').setDescription('Raison (facultatif)').setRequired(false),
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
    const montant = interaction.options.getInteger('montant', true);
    const raison = interaction.options.getString('raison') ?? undefined;

    const newBalance = await grantYumz(target.id, -montant, 'admin_take_yumz', raison);

    await interaction.reply({
      content:
        `➖ **${montant} Yumz** retirés à <@${target.id}>. Nouveau solde : **${newBalance}** Yumz.` +
        (raison ? `\n📝 Raison : ${raison}` : ''),
      allowedMentions: { users: [] },
    });
  },
};
