import { EmbedBuilder } from 'discord.js';
import { rarityInfo } from '../config/rarities';
import type { CardDoc } from '../database/models/Card';

/**
 * Construit l'Embed "fiche carte" : image en grand, bordure colorée selon
 * la rareté, prix et disponibilité. Réutilisé partout pour un rendu cohérent.
 */
export function buildCardEmbed(card: CardDoc): EmbedBuilder {
  const info = rarityInfo(card.rarity);

  const dispo =
    card.remainingSupply > 0
      ? `${card.remainingSupply}/${card.maxSupply}`
      : '❌ Épuisée';

  return new EmbedBuilder()
    .setColor(card.borderColor ?? info.color) // couleur perso, sinon celle de la rareté
    .setTitle(`${info.emoji} ${card.name}`)
    // La description ne s'affiche que si elle est renseignée.
    .setDescription(card.description && card.description.length > 0 ? card.description : null)
    .setImage(card.imageUrl)
    .addFields(
      { name: 'Rareté', value: info.label, inline: true },
      { name: 'Prix', value: `💰 ${card.price} Yumz`, inline: true },
      { name: 'Disponibles', value: dispo, inline: true },
    )
    .setFooter({ text: `ID : ${card.cardId}` });
}
