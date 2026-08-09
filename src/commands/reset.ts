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
import { Card } from '../database/models/Card';
import { Transaction } from '../database/models/Transaction';

type Cible = 'soldes' | 'inventaires' | 'cooldowns' | 'stock_cartes' | 'tout';

const LABELS: Record<Cible, string> = {
  soldes: 'les soldes de Yumz (→ 0)',
  inventaires: 'les inventaires de cartes (→ vidés)',
  cooldowns: 'les cooldowns & streaks (daily / travailler / roue / bump)',
  stock_cartes: 'le stock des cartes (→ rempli à fond)',
  tout: 'TOUT : soldes, inventaires, cooldowns, stock des cartes et journal des transactions',
};

/** Exécute la remise à zéro demandée. */
async function runReset(cible: Cible): Promise<void> {
  if (cible === 'soldes' || cible === 'tout') {
    await User.updateMany({}, { $set: { yumz: 0 } });
  }
  if (cible === 'inventaires' || cible === 'tout') {
    await User.updateMany({}, { $set: { cards: [] } });
  }
  if (cible === 'cooldowns' || cible === 'tout') {
    await User.updateMany(
      {},
      {
        $set: {
          dailyLastClaim: null,
          dailyStreak: 0,
          workLastClaim: null,
          wheelLastSpin: null,
          bumpCountToday: 0,
          bumpCountDate: null,
        },
      },
    );
  }
  if (cible === 'stock_cartes' || cible === 'tout') {
    // Pipeline d'agrégation : remainingSupply = maxSupply pour chaque carte.
    await Card.updateMany({}, [{ $set: { remainingSupply: '$maxSupply' } }]);
  }
  if (cible === 'tout') {
    await Transaction.deleteMany({});
  }
}

/**
 * /reset <cible> — (Admin) remet à zéro une partie (ou tout) de l'économie.
 * ⚠️ Irréversible. Une confirmation est demandée. Pensé pour le jour du lancement.
 */
export const reset: Command = {
  data: new SlashCommandBuilder()
    .setName('reset')
    .setDescription('(Admin) Remet à zéro l’économie (⚠️ irréversible).')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((o) =>
      o
        .setName('cible')
        .setDescription('Ce que tu veux remettre à zéro')
        .setRequired(true)
        .addChoices(
          { name: 'Soldes (Yumz → 0)', value: 'soldes' },
          { name: 'Inventaires (cartes → vidés)', value: 'inventaires' },
          { name: 'Cooldowns & streaks', value: 'cooldowns' },
          { name: 'Stock des cartes (→ rempli)', value: 'stock_cartes' },
          { name: 'TOUT (lancement)', value: 'tout' },
        ),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({
        content: '🚫 Cette commande est réservée aux administrateurs.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const cible = interaction.options.getString('cible', true) as Cible;

    const embed = new EmbedBuilder()
      .setColor(0xe74c3c)
      .setTitle('⚠️ Confirmation — RESET')
      .setDescription(
        `Tu vas remettre à zéro **${LABELS[cible]}**.\n\n` +
          '🛑 **Cette action est IRRÉVERSIBLE** et affecte **tous les membres**. Confirmer ?',
      );
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('reset_confirm').setLabel('Oui, tout remettre à zéro').setEmoji('⚠️').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('reset_cancel').setLabel('Annuler').setStyle(ButtonStyle.Secondary),
    );

    await interaction.reply({ embeds: [embed], components: [row], flags: MessageFlags.Ephemeral });
    const message = await interaction.fetchReply();

    try {
      const btn = await message.awaitMessageComponent({
        componentType: ComponentType.Button,
        time: 30_000,
        filter: (i) => i.user.id === interaction.user.id,
      });

      if (btn.customId === 'reset_cancel') {
        await btn.update({ content: '❌ Reset annulé.', embeds: [], components: [] });
        return;
      }

      await btn.update({ content: '⏳ Remise à zéro en cours…', embeds: [], components: [] });
      await runReset(cible);
      await interaction.editReply({ content: `✅ Reset effectué : **${LABELS[cible]}**.` });
    } catch {
      await interaction
        .editReply({ content: '⌛ Confirmation expirée — aucun reset effectué.', embeds: [], components: [] })
        .catch(() => {});
    }
  },
};
