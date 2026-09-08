import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';
import type { Command } from '../types';
import { Card } from '../database/models/Card';
import { RARITIES } from '../config/rarities';
import { browseCards } from '../utils/cardBrowser';

/**
 * /catalogue — parcourt les cartes : un menu déroulant pour choisir une carte
 * directement + les boutons ◀ / ▶ pour changer de page.
 */
export const catalogue: Command = {
  data: new SlashCommandBuilder()
    .setName('catalogue')
    .setDescription('Parcours les cartes de la collection (menu déroulant).'),

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

    await browseCards(interaction, cards);
  },
};
