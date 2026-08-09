import {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  MessageFlags,
  type ChatInputCommandInteraction,
} from 'discord.js';
import type { Command } from '../types';
import { Card } from '../database/models/Card';
import { RARITIES } from '../config/rarities';
import { buildCardEmbed } from '../utils/cardEmbed';
import { purchaseCard } from '../services/purchase';

/**
 * /boutique — feuillette les cartes en stock et achète directement celle
 * affichée, avec le bouton « 🛒 Acheter ». Achat sécurisé (logique atomique).
 * Navigation et achat réservés à l'auteur de la commande.
 */
export const boutique: Command = {
  data: new SlashCommandBuilder()
    .setName('boutique')
    .setDescription('Achète directement des cartes avec tes Yumz.'),

  async execute(interaction: ChatInputCommandInteraction) {
    const rank = new Map(RARITIES.map((r, i) => [r, i]));
    const cards = await Card.find({ remainingSupply: { $gt: 0 } });
    cards.sort(
      (a, b) =>
        (rank.get(b.rarity) ?? 0) - (rank.get(a.rarity) ?? 0) || b.price - a.price,
    );

    if (cards.length === 0) {
      await interaction.reply({ content: '🛒 La boutique est vide pour l’instant.' });
      return;
    }

    let index = 0;
    const total = cards.length;

    // Construit l'affichage de la carte courante + les 3 boutons.
    const render = (frozen = false) => {
      const card = cards[index]!;
      const soldOut = card.remainingSupply <= 0;
      const embed = buildCardEmbed(card).setFooter({
        text: `ID : ${card.cardId}  •  ${index + 1}/${total}`,
      });
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('shop_prev')
          .setLabel('◀')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(frozen || index === 0),
        new ButtonBuilder()
          .setCustomId('shop_buy')
          .setLabel(soldOut ? 'Épuisée' : `🛒 Acheter (${card.price})`)
          .setStyle(soldOut ? ButtonStyle.Secondary : ButtonStyle.Success)
          .setDisabled(frozen || soldOut),
        new ButtonBuilder()
          .setCustomId('shop_next')
          .setLabel('▶')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(frozen || index === total - 1),
      );
      return { embeds: [embed], components: [row] };
    };

    await interaction.reply(render());
    const message = await interaction.fetchReply();

    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 120_000,
    });

    collector.on('collect', async (btn) => {
      if (btn.user.id !== interaction.user.id) {
        await btn.reply({
          content: 'Cette boutique n’est pas la tienne 🙂 Lance `/boutique` toi-même !',
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      // Navigation
      if (btn.customId === 'shop_prev') {
        index = Math.max(0, index - 1);
        await btn.update(render());
        return;
      }
      if (btn.customId === 'shop_next') {
        index = Math.min(total - 1, index + 1);
        await btn.update(render());
        return;
      }

      // Achat de la carte affichée
      if (btn.customId === 'shop_buy') {
        await btn.deferReply({ flags: MessageFlags.Ephemeral });
        const card = cards[index]!;
        const result = await purchaseCard(interaction.user.id, card.cardId);

        switch (result.status) {
          case 'ok':
            await btn.editReply({
              content: `🎉 Acheté **${result.card.name}** #${result.serial}/${result.card.maxSupply} pour **${result.card.price}** Yumz. Solde : **${result.newBalance}**.`,
            });
            break;
          case 'insufficient':
            await btn.editReply({
              content: `❌ Pas assez de Yumz (il t’en faut **${result.price}**, tu as **${result.balance}**).`,
            });
            break;
          case 'soldout':
            await btn.editReply({ content: '⏳ Trop tard, cette carte est épuisée !' });
            break;
          case 'notfound':
            await btn.editReply({ content: '❓ Carte introuvable.' });
            break;
        }

        // On rafraîchit le stock affiché de la carte courante.
        const fresh = await Card.findOne({ cardId: card.cardId });
        if (fresh) cards[index] = fresh;
        await message.edit(render()).catch(() => {});
        return;
      }
    });

    collector.on('end', async () => {
      await message.edit(render(true)).catch(() => {});
    });
  },
};
