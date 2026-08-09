import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  EmbedBuilder,
  type ChatInputCommandInteraction,
} from 'discord.js';
import type { Command } from '../types';
import { User } from '../database/models/User';

/**
 * /give_all <montant> [raison] — (Admin) donne des Yumz à TOUS les membres
 * du serveur (bots exclus). Une confirmation est demandée car l'action est
 * massive. Idéal pour un cadeau d'ouverture.
 */
export const giveAll: Command = {
  data: new SlashCommandBuilder()
    .setName('give_all')
    .setDescription('(Admin) Donne des Yumz à TOUS les membres du serveur.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addIntegerOption((o) =>
      o
        .setName('montant')
        .setDescription('Yumz à donner à chaque membre')
        .setRequired(true)
        .setMinValue(1),
    )
    .addStringOption((o) => o.setName('raison').setDescription('Raison (facultatif)')),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({
        content: '🚫 Cette commande est réservée aux administrateurs.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    if (!interaction.inGuild() || !interaction.guild) {
      await interaction.reply({
        content: 'Cette commande s’utilise uniquement sur un serveur.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const montant = interaction.options.getInteger('montant', true);
    const raison = interaction.options.getString('raison') ?? undefined;

    // --- Confirmation (message éphémère, visible du seul admin) ---
    const embed = new EmbedBuilder()
      .setColor(0xf39c12)
      .setTitle('⚠️ Confirmation — don à tous les membres')
      .setDescription(
        `Tu vas donner **${montant} Yumz** à **~${interaction.guild.memberCount}** membres (bots exclus).\n` +
          (raison ? `📝 Raison : ${raison}\n` : '') +
          '\nCette action affecte **tout le monde**. Confirmer ?',
      );
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('giveall_confirm').setLabel('Confirmer').setEmoji('✅').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('giveall_cancel').setLabel('Annuler').setStyle(ButtonStyle.Secondary),
    );

    await interaction.reply({ embeds: [embed], components: [row], flags: MessageFlags.Ephemeral });
    const message = await interaction.fetchReply();

    try {
      const btn = await message.awaitMessageComponent({
        componentType: ComponentType.Button,
        time: 30_000,
        filter: (i) => i.user.id === interaction.user.id,
      });

      if (btn.customId === 'giveall_cancel') {
        await btn.update({ content: '❌ Distribution annulée.', embeds: [], components: [] });
        return;
      }

      // --- Confirmé : distribution ---
      await btn.update({ content: '⏳ Distribution en cours…', embeds: [], components: [] });

      const members = await interaction.guild.members.fetch();
      const humans = members.filter((m) => !m.user.bot);

      // Une seule écriture groupée (bulkWrite) pour créditer tout le monde.
      const ops = humans.map((m) => ({
        updateOne: {
          filter: { discordId: m.id },
          update: { $inc: { yumz: montant }, $setOnInsert: { discordId: m.id } },
          upsert: true,
        },
      }));
      if (ops.length > 0) await User.bulkWrite(ops);

      await interaction.editReply({
        content: `✅ **${montant} Yumz** offerts à **${humans.size}** membre(s) ! 🎉`,
      });
    } catch {
      // Timeout : personne n'a cliqué à temps.
      await interaction
        .editReply({ content: '⌛ Confirmation expirée — aucune distribution.', embeds: [], components: [] })
        .catch(() => {});
    }
  },
};
