import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';
import type { Command } from '../types';
import { Card } from '../database/models/Card';
import { RARITIES } from '../config/rarities';
import { browseCards } from '../utils/cardBrowser';

/**
 * /boutique — parcourt les cartes en stock (menu déroulant pour choisir) et
 * achète celle affichée avec le bouton « 🛒 Acheter ». Réservé à l'auteur.
 */
export const boutique: Command = {
  data: new SlashCommandBuilder()
    .setName('boutique')
    .setDescription('Achète des cartes avec tes Yumz (menu déroulant).'),

  async execute(interaction: ChatInputCommandInteraction) {
    const rank = new Map(RARITIES.map((r, i) => [r, i]));
    const cards = await Card.find({ remainingSupply: { $gt: 0 } });
    cards.sort(
      (a, b) => (rank.get(b.rarity) ?? 0) - (rank.get(a.rarity) ?? 0) || b.price - a.price,
    );

    if (cards.length === 0) {
      await interaction.reply({ content: '🛒 La boutique est vide pour l’instant.' });
      return;
    }

    await browseCards(interaction, cards, { buy: true });
  },
};
