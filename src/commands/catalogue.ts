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

    // La recherche positionne sur la carte trouvée (toutes restent accessibles).
    let startIndex = 0;
    if (recherche) {
      startIndex = cards.findIndex((c) => matchesSearch(c, recherche));
      if (startIndex === -1) {
        await interaction.reply({
          content: '🔍 Aucune carte ne correspond à ta recherche.',
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
    }

    await browseCards(interaction, cards, { startIndex });
  },
};
