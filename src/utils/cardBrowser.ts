import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  MessageFlags,
  type ChatInputCommandInteraction,
} from 'discord.js';
import { buildCardEmbed } from './cardEmbed';
import { rarityInfo } from '../config/rarities';
import { Card, type CardDoc } from '../database/models/Card';
import { purchaseCard } from '../services/purchase';
import { lockedMessage } from './requirements';

const PAGE = 25; // un menu déroulant Discord accepte 25 options max

/**
 * Affiche une collection de cartes : l'embed de la carte sélectionnée +
 * un MENU DÉROULANT pour en choisir une directement (25 par page, boutons
 * ◀ / ▶ pour changer de page) + un bouton d'achat optionnel.
 *
 * Pas de fenêtre/modal → aucun avertissement Discord. Réservé à l'auteur.
 */
export async function browseCards(
  interaction: ChatInputCommandInteraction,
  cards: CardDoc[],
  { buy = false }: { buy?: boolean } = {},
): Promise<void> {
  if (cards.length === 0) return; // l'appelant gère le cas vide

  let index = 0;
  const total = cards.length;
  const totalPages = Math.ceil(total / PAGE);

  const render = (frozen = false) => {
    const card = cards[index]!;
    const embed = buildCardEmbed(card).setFooter({ text: `${index + 1}/${total}` });

    // Fenêtre de 25 cartes contenant la carte affichée.
    const page = Math.floor(index / PAGE);
    const start = page * PAGE;
    const windowCards = cards.slice(start, start + PAGE);

    const select = new StringSelectMenuBuilder()
      .setCustomId('cb_select')
      .setPlaceholder(`Choisir une carte — page ${page + 1}/${totalPages}`)
      .setDisabled(frozen)
      .addOptions(
        windowCards.map((c, i) => {
          const info = rarityInfo(c.rarity);
          const gi = start + i;
          return {
            label: c.name.slice(0, 100),
            description: `${info.label} • ${c.price} Yumz`.slice(0, 100),
            value: String(gi),
            default: gi === index,
            emoji: info.emoji,
          };
        }),
      );

    const navButtons = [
      new ButtonBuilder()
        .setCustomId('cb_prev')
        .setLabel('◀')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(frozen || index === 0),
      new ButtonBuilder()
        .setCustomId('cb_next')
        .setLabel('▶')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(frozen || index === total - 1),
    ];
    if (buy) {
      navButtons.splice(
        1,
        0,
        new ButtonBuilder()
          .setCustomId('cb_buy')
          .setLabel(card.remainingSupply <= 0 ? 'Épuisée' : `🛒 Acheter (${card.price})`)
          .setStyle(card.remainingSupply <= 0 ? ButtonStyle.Secondary : ButtonStyle.Success)
          .setDisabled(frozen || card.remainingSupply <= 0),
      );
    }

    const selectRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
    const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(...navButtons);
    return { embeds: [embed], components: [selectRow, buttonRow] };
  };

  await interaction.reply(render());
  const message = await interaction.fetchReply();

  const collector = message.createMessageComponentCollector({ time: 120_000 });

  collector.on('collect', async (i) => {
    if (i.user.id !== interaction.user.id) {
      await i.reply({ content: 'Ce n’est pas ta commande 🙂', flags: MessageFlags.Ephemeral });
      return;
    }

    // Choix dans le menu déroulant → saute à la carte.
    if (i.isStringSelectMenu() && i.customId === 'cb_select') {
      const value = i.values[0];
      if (value !== undefined) index = Number(value);
      await i.update(render());
      return;
    }

    if (i.isButton()) {
      if (i.customId === 'cb_prev') {
        index = Math.max(0, index - 1);
        await i.update(render());
        return;
      }
      if (i.customId === 'cb_next') {
        index = Math.min(total - 1, index + 1);
        await i.update(render());
        return;
      }
      if (i.customId === 'cb_buy' && buy) {
        await i.deferReply({ flags: MessageFlags.Ephemeral });
        const card = cards[index]!;
        const result = await purchaseCard(interaction.user.id, card.cardId);
        switch (result.status) {
          case 'ok':
            await i.editReply({
              content: `🎉 Acheté **${result.card.name}** #${result.serial}/${result.card.maxSupply} pour **${result.card.price}** Yumz. Solde : **${result.newBalance}**.`,
            });
            break;
          case 'insufficient':
            await i.editReply({
              content: `❌ Pas assez de Yumz (il t’en faut **${result.price}**, tu as **${result.balance}**).`,
            });
            break;
          case 'locked':
            await i.editReply({ content: lockedMessage(result.requires, result.missing) });
            break;
          case 'soldout':
            await i.editReply({ content: '⏳ Trop tard, cette carte est épuisée !' });
            break;
          case 'notfound':
            await i.editReply({ content: '❓ Carte introuvable.' });
            break;
        }
        const fresh = await Card.findOne({ cardId: card.cardId });
        if (fresh) cards[index] = fresh;
        await message.edit(render()).catch(() => {});
        return;
      }
    }
  });

  collector.on('end', async () => {
    await message.edit(render(true)).catch(() => {});
  });
}
