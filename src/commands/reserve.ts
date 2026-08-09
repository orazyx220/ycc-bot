import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
  type ChatInputCommandInteraction,
} from 'discord.js';
import type { Command } from '../types';
import { Card } from '../database/models/Card';

/**
 * /reserve — (Admin) gère la réserve de cartes des drops automatiques.
 *   /reserve add <id> <mode>  → met la carte en réserve (mode achat ou cadeau)
 *   /reserve remove <id>      → retire la carte de la réserve
 *   /reserve list             → liste la réserve
 */
export const reserve: Command = {
  data: new SlashCommandBuilder()
    .setName('reserve')
    .setDescription('(Admin) Gère la réserve de cartes pour les drops automatiques.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((s) =>
      s
        .setName('add')
        .setDescription('Ajoute une carte à la réserve')
        .addStringOption((o) =>
          o.setName('id').setDescription('ID de la carte').setRequired(true),
        )
        .addStringOption((o) =>
          o
            .setName('mode')
            .setDescription('Comment on l’obtient au drop')
            .setRequired(true)
            .addChoices(
              { name: 'Achat (coûte des Yumz)', value: 'buy' },
              { name: 'Cadeau (gratuit)', value: 'gift' },
            ),
        ),
    )
    .addSubcommand((s) =>
      s
        .setName('remove')
        .setDescription('Retire une carte de la réserve')
        .addStringOption((o) =>
          o.setName('id').setDescription('ID de la carte').setRequired(true),
        ),
    )
    .addSubcommand((s) => s.setName('list').setDescription('Liste la réserve de drops auto')),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({
        content: '🚫 Cette commande est réservée aux administrateurs.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const sub = interaction.options.getSubcommand();

    if (sub === 'list') {
      const cards = await Card.find({ autoDrop: true });
      if (cards.length === 0) {
        await interaction.reply({
          content: '📭 La réserve de drops auto est vide. Ajoute-en avec `/reserve add`.',
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      const lines = cards.map(
        (c) =>
          `\`${c.cardId}\` — **${c.name}** · ${c.dropMode === 'gift' ? '🎁 cadeau' : '🛒 achat'} · reste ${c.remainingSupply}/${c.maxSupply}`,
      );
      await interaction.reply({
        content: `🎁 **Réserve de drops automatiques :**\n${lines.join('\n')}`,
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

    if (sub === 'add') {
      const mode = interaction.options.getString('mode', true) as 'buy' | 'gift';
      card.autoDrop = true;
      card.dropMode = mode;
      await card.save();
      await interaction.reply({
        content: `✅ **${card.name}** ajoutée à la réserve (${mode === 'gift' ? '🎁 cadeau' : '🛒 achat'}).`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // sub === 'remove'
    card.autoDrop = false;
    await card.save();
    await interaction.reply({
      content: `✅ **${card.name}** retirée de la réserve.`,
      flags: MessageFlags.Ephemeral,
    });
  },
};
