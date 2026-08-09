import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';
import type { Command } from '../types';
import { Card } from '../database/models/Card';
import { RARITIES } from '../config/rarities';
import { buildCardEmbed } from '../utils/cardEmbed';
import { paginateEmbeds } from '../utils/pagination';

/**
 * /catalogue — feuillette toutes les cartes une par une (image en grand),
 * avec les boutons ◀ / ▶. Pour ouvrir une carte précise : /carte <id>.
 */
export const catalogue: Command = {
  data: new SlashCommandBuilder()
    .setName('catalogue')
    .setDescription('Feuillette toutes les cartes disponibles à la collection.'),

  async execute(interaction: ChatInputCommandInteraction) {
    // On trie par rareté (légendaire d'abord), puis par prix décroissant :
    // les cartes les plus prestigieuses ouvrent le catalogue.
    const rarityRank = new Map(RARITIES.map((r, i) => [r, i]));
    const cards = await Card.find();
    cards.sort((a, b) => {
      const byRarity = (rarityRank.get(b.rarity) ?? 0) - (rarityRank.get(a.rarity) ?? 0);
      return byRarity !== 0 ? byRarity : b.price - a.price;
    });

    if (cards.length === 0) {
      await interaction.reply({
        content: '📭 Le catalogue est vide pour l’instant. Reviens bientôt !',
      });
      return;
    }

    // Une page = une carte. On ajoute un indicateur "Page x/n" dans le pied.
    const pages = cards.map((card, i) =>
      buildCardEmbed(card).setFooter({
        text: `ID : ${card.cardId}  •  Page ${i + 1}/${cards.length}`,
      }),
    );

    await paginateEmbeds(interaction, pages);
  },
};
