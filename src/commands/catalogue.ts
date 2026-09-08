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
 * /catalogue [recherche] — parcourt les cartes avec un menu déroulant (◀ / ▶
 * pour changer de lot). L'option `recherche` (autocomplétée) filtre par nom/ID.
 */
export const catalogue: Command = {
  data: new SlashCommandBuilder()
    .setName('catalogue')
    .setDescription('Parcours les cartes de la collection (menu + recherche).')
    .addStringOption((o) =>
      o
        .setName('recherche')
        .setDescription('Cherche une carte par nom/ID (tape pour voir les suggestions)')
        .setAutocomplete(true),
    ),

  async autocomplete(interaction: AutocompleteInteraction) {
    await respondCardAutocomplete(interaction, false);
  },

  async execute(interaction: ChatInputCommandInteraction) {
    const recherche = interaction.options.getString('recherche') ?? '';

    const rarityRank = new Map(RARITIES.map((r, i) => [r, i]));
    let cards = await Card.find();
    if (recherche) cards = cards.filter((c) => matchesSearch(c, recherche));
    cards.sort((a, b) => {
      const byRarity = (rarityRank.get(b.rarity) ?? 0) - (rarityRank.get(a.rarity) ?? 0);
      return byRarity !== 0 ? byRarity : b.price - a.price;
    });

    if (cards.length === 0) {
      await interaction.reply({
        content: recherche
          ? '🔍 Aucune carte ne correspond à ta recherche.'
          : '📭 Le catalogue est vide pour l’instant. Reviens bientôt !',
        flags: recherche ? MessageFlags.Ephemeral : undefined,
      });
      return;
    }

    await browseCards(interaction, cards);
  },
};
