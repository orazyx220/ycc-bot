import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';
import type { Command } from '../types';
import { Card } from '../database/models/Card';
import { RARITIES, rarityInfo } from '../config/rarities';
import { buildCardEmbed } from '../utils/cardEmbed';
import { paginateEmbeds } from '../utils/pagination';

/**
 * /catalogue — feuillette les cartes une par une (image en grand), avec les
 * boutons ◀ / ▶ et un bouton 🔍 pour rechercher une carte par nom/ID.
 */
export const catalogue: Command = {
  data: new SlashCommandBuilder()
    .setName('catalogue')
    .setDescription('Feuillette les cartes de la collection (avec recherche 🔍).'),

  async execute(interaction: ChatInputCommandInteraction) {
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

    const pages = cards.map((card, i) =>
      buildCardEmbed(card).setFooter({
        text: `ID : ${card.cardId}  •  Page ${i + 1}/${cards.length}`,
      }),
    );
    // Texte cherchable par carte : nom + ID + libellé de rareté.
    const searchKeys = cards.map((c) => `${c.name} ${c.cardId} ${rarityInfo(c.rarity).label}`);

    await paginateEmbeds(interaction, pages, { searchKeys });
  },
};
