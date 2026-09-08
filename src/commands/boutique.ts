import {
  SlashCommandBuilder,
  MessageFlags,
  type ChatInputCommandInteraction,
  type AutocompleteInteraction,
} from 'discord.js';
import type { Command } from '../types';
import { Card } from '../database/models/Card';
import { RARITIES } from '../config/rarities';
import { browseCards } from '../utils/cardBrowser';
import { matchesSearch, respondCardAutocomplete } from '../utils/cardSearch';

/**
 * /boutique [recherche] — parcourt les cartes en stock (menu déroulant + ◀ / ▶)
 * et achète celle affichée. L'option `recherche` (autocomplétée) filtre par nom/ID.
 */
export const boutique: Command = {
  data: new SlashCommandBuilder()
    .setName('boutique')
    .setDescription('Achète des cartes avec tes Yumz (menu + recherche).')
    .addStringOption((o) =>
      o
        .setName('recherche')
        .setDescription('Cherche une carte par nom/ID (tape pour voir les suggestions)')
        .setAutocomplete(true),
    ),

  async autocomplete(interaction: AutocompleteInteraction) {
    await respondCardAutocomplete(interaction, true);
  },

  async execute(interaction: ChatInputCommandInteraction) {
    const recherche = interaction.options.getString('recherche') ?? '';

    const rank = new Map(RARITIES.map((r, i) => [r, i]));
    const cards = await Card.find({ remainingSupply: { $gt: 0 } });
    cards.sort(
      (a, b) => (rank.get(b.rarity) ?? 0) - (rank.get(a.rarity) ?? 0) || b.price - a.price,
    );

    if (cards.length === 0) {
      await interaction.reply({ content: '🛒 La boutique est vide pour l’instant.' });
      return;
    }

    // La recherche positionne sur la carte trouvée (toutes restent accessibles).
    let startIndex = 0;
    if (recherche) {
      startIndex = cards.findIndex((c) => matchesSearch(c, recherche));
      if (startIndex === -1) {
        await interaction.reply({
          content: '🔍 Aucune carte en stock ne correspond à ta recherche.',
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
    }

    await browseCards(interaction, cards, { buy: true, startIndex });
  },
};
