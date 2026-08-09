import {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  EmbedBuilder,
  MessageFlags,
  type ChatInputCommandInteraction,
} from 'discord.js';
import type { Command } from '../types';
import { Card } from '../database/models/Card';
import { getOrCreateUser } from '../database/models/User';
import { executeTrade, type TradeTerms } from '../services/trade';

/** Décrit ce qu'un côté offre : "🎴 Nom + 💰 X Yumz" ou "(rien)". */
function describeSide(cardName: string | null, yumz: number): string {
  const parts: string[] = [];
  if (cardName) parts.push(`🎴 ${cardName}`);
  if (yumz > 0) parts.push(`💰 ${yumz} Yumz`);
  return parts.length > 0 ? parts.join(' + ') : '*(rien)*';
}

/**
 * /echange <membre> [ma_carte] [sa_carte] [mes_yumz] [ses_yumz]
 * Propose un troc. L'échange n'a lieu que si la cible clique « Accepter ».
 * Les avoirs sont revérifiés au moment de l'acceptation.
 */
export const echange: Command = {
  data: new SlashCommandBuilder()
    .setName('echange')
    .setDescription('Propose un échange (cartes et/ou Yumz) à un membre.')
    .addUserOption((o) =>
      o.setName('membre').setDescription('Le membre avec qui échanger').setRequired(true),
    )
    .addStringOption((o) =>
      o.setName('ma_carte').setDescription('ID d’une carte que TU donnes'),
    )
    .addStringOption((o) =>
      o.setName('sa_carte').setDescription('ID d’une carte que tu VEUX de lui'),
    )
    .addIntegerOption((o) =>
      o.setName('mes_yumz').setDescription('Yumz que tu donnes').setMinValue(1),
    )
    .addIntegerOption((o) =>
      o.setName('ses_yumz').setDescription('Yumz que tu veux').setMinValue(1),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser('membre', true);
    const maCarteId = interaction.options.getString('ma_carte')?.trim() || null;
    const saCarteId = interaction.options.getString('sa_carte')?.trim() || null;
    const mesYumz = interaction.options.getInteger('mes_yumz') ?? 0;
    const sesYumz = interaction.options.getInteger('ses_yumz') ?? 0;

    if (target.bot) {
      await interaction.reply({ content: '🤖 Tu ne peux pas échanger avec un bot.', flags: MessageFlags.Ephemeral });
      return;
    }
    if (target.id === interaction.user.id) {
      await interaction.reply({ content: '🙂 Tu ne peux pas échanger avec toi-même.', flags: MessageFlags.Ephemeral });
      return;
    }
    if (!maCarteId && !saCarteId && mesYumz === 0 && sesYumz === 0) {
      await interaction.reply({
        content: '❔ Précise au moins un élément à échanger (une carte ou des Yumz).',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Les cartes citées doivent exister.
    const maCarte = maCarteId ? await Card.findOne({ cardId: maCarteId }) : null;
    if (maCarteId && !maCarte) {
      await interaction.reply({ content: `❓ Aucune carte \`${maCarteId}\`.`, flags: MessageFlags.Ephemeral });
      return;
    }
    const saCarte = saCarteId ? await Card.findOne({ cardId: saCarteId }) : null;
    if (saCarteId && !saCarte) {
      await interaction.reply({ content: `❓ Aucune carte \`${saCarteId}\`.`, flags: MessageFlags.Ephemeral });
      return;
    }

    // Vérif que le proposeur possède/peut au moment de proposer.
    const me = await getOrCreateUser(interaction.user.id);
    if (maCarteId && !me.cards.includes(maCarteId)) {
      await interaction.reply({ content: `❌ Tu ne possèdes pas la carte \`${maCarteId}\`.`, flags: MessageFlags.Ephemeral });
      return;
    }
    if (mesYumz > me.yumz) {
      await interaction.reply({ content: `❌ Tu n’as pas assez de Yumz (tu en offres ${mesYumz}, tu as ${me.yumz}).`, flags: MessageFlags.Ephemeral });
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('🔄 Proposition d’échange')
      .setDescription(`<@${interaction.user.id}> propose un échange à <@${target.id}>.`)
      .addFields(
        { name: `${interaction.user.username} donne`, value: describeSide(maCarte?.name ?? null, mesYumz), inline: true },
        { name: `${target.username} donne`, value: describeSide(saCarte?.name ?? null, sesYumz), inline: true },
      )
      .setFooter({ text: `Seul ${target.username} peut accepter · expire dans 2 min` });

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('trade_accept').setLabel('Accepter').setEmoji('✅').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('trade_decline').setLabel('Refuser').setEmoji('✖️').setStyle(ButtonStyle.Danger),
    );

    await interaction.reply({
      content: `<@${target.id}>`,
      embeds: [embed],
      components: [row],
      allowedMentions: { users: [target.id] },
    });
    const message = await interaction.fetchReply();

    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 120_000,
    });

    let settled = false;

    collector.on('collect', async (btn) => {
      // Refuser : le proposeur OU la cible.
      if (btn.customId === 'trade_decline') {
        if (btn.user.id !== target.id && btn.user.id !== interaction.user.id) {
          await btn.reply({ content: 'Cet échange ne te concerne pas.', flags: MessageFlags.Ephemeral });
          return;
        }
        settled = true;
        await btn.update({ content: '❌ Échange refusé.', embeds: [embed], components: [] });
        collector.stop();
        return;
      }

      // Accepter : uniquement la cible.
      if (btn.customId === 'trade_accept') {
        if (btn.user.id !== target.id) {
          await btn.reply({
            content: `Seul ${target.username} peut accepter cet échange.`,
            flags: MessageFlags.Ephemeral,
          });
          return;
        }

        await btn.deferUpdate();
        const terms: TradeTerms = {
          initiatorId: interaction.user.id,
          targetId: target.id,
          initiatorCard: maCarteId,
          initiatorYumz: mesYumz,
          targetCard: saCarteId,
          targetYumz: sesYumz,
        };
        const res = await executeTrade(terms);
        settled = true;

        if (res.status === 'ok') {
          await message.edit({ content: '✅ Échange conclu !', embeds: [embed], components: [] });
        } else {
          await message.edit({ content: `⚠️ Échange annulé : ${res.reason}.`, embeds: [embed], components: [] });
        }
        collector.stop();
        return;
      }
    });

    collector.on('end', async () => {
      if (!settled) {
        await message.edit({ content: '⌛ Proposition d’échange expirée.', components: [] }).catch(() => {});
      }
    });
  },
};
