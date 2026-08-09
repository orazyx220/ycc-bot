import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type Message,
} from 'discord.js';
import { buildCardEmbed } from './cardEmbed';
import { Card, type CardDoc } from '../database/models/Card';

/**
 * Construit le contenu d'un message de drop : Embed de la carte + un bouton.
 * - Mode 'gift' : bouton bleu « 🎁 Récupérer (gratuit) » → customId `gift:<id>`.
 * - Mode 'buy'  : bouton vert « 🛒 Acheter pour X Yumz » → customId `buy:<id>`.
 * - Épuisée     : bouton gris désactivé « ❌ Épuisée ».
 *
 * Le `customId` encode l'ID de la carte, donc le bouton reste fonctionnel
 * même après un redémarrage du bot.
 */
export function buildDropComponents(card: CardDoc) {
  const soldOut = card.remainingSupply <= 0;
  const isGift = card.dropMode === 'gift';

  const button = new ButtonBuilder()
    .setCustomId(`${isGift ? 'gift' : 'buy'}:${card.cardId}`)
    .setDisabled(soldOut);

  if (soldOut) {
    button.setLabel('Épuisée').setEmoji('❌').setStyle(ButtonStyle.Secondary);
  } else if (isGift) {
    button.setLabel('Récupérer (gratuit)').setEmoji('🎁').setStyle(ButtonStyle.Primary);
  } else {
    button.setLabel(`Acheter pour ${card.price} Yumz`).setEmoji('🛒').setStyle(ButtonStyle.Success);
  }

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);
  return { embeds: [buildCardEmbed(card)], components: [row] };
}

/**
 * Recharge la carte depuis la base et met à jour le message de drop d'origine
 * (compteur de stock + état du bouton). Partagé par l'achat et le cadeau.
 */
export async function refreshDropMessage(message: Message, cardId: string): Promise<void> {
  const fresh = await Card.findOne({ cardId });
  if (!fresh) return;
  await message.edit(buildDropComponents(fresh)).catch(() => {
    // Message supprimé/trop ancien : on ignore, ce n'est pas bloquant.
  });
}
