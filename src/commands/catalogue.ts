import {
  SlashCommandBuilder,
  MessageFlags,
  type ChatInputCommandInteraction,
  type AutocompleteInteraction,
} from 'discord.js';
import type { Command } from '../types';
import { Card } from '../database/models/Card';
import { RARITIES, RARITY_INFO } from '../config/rarities';
import { buildCardEmbed } from '../utils/cardEmbed';
import { paginateEmbeds } from '../utils/pagination';
import { matchesSearch, respondCardAutocomplete } from '../utils/cardSearch';

/**
 * /catalogue [recherche] [rarete] — feuillette les cartes (image en grand),
 * avec les boutons ◀ / ▶. Les options permettent de filtrer par nom/ID et rareté.
 */
export const catalogue: Command = {
  data: new SlashCommandBuilder()
    .setName('catalogue')
    .setDescription('Feuillette les cartes de la collection (avec recherche).')
    .addStringOption((o) =>
      o.setName('recherche').setDescription('Filtrer par nom ou ID de carte').setAutocomplete(true),
    )
    .addStringOption((o) =>
      o
        .setName('rarete')
        .setDescription('Filtrer par rareté')
        .addChoices(...RARITIES.map((r) => ({ name: RARITY_INFO[r].label, value: r }))),
    ),

  async autocomplete(interaction: AutocompleteInteraction) {
    await respondCardAutocomplete(interaction, false);
  },

  async execute(interaction: ChatInputCommandInteraction) {
    const recherche = interaction.options.getString('recherche') ?? '';
    const rarete = interaction.options.getString('rarete');

    const rarityRank = new Map(RARITIES.map((r, i) => [r, i]));
    let cards = await Card.find();

    // Filtres (recherche texte + rareté).
    if (recherche) cards = cards.filter((c) => matchesSearch(c, recherche));
    if (rarete) cards = cards.filter((c) => c.rarity === rarete);

    // Tri : rareté (légendaire d'abord), puis prix décroissant.
    cards.sort((a, b) => {
      const byRarity = (rarityRank.get(b.rarity) ?? 0) - (rarityRank.get(a.rarity) ?? 0);
      return byRarity !== 0 ? byRarity : b.price - a.price;
    });

    if (cards.length === 0) {
      const filtre = recherche || rarete;
      await interaction.reply({
        content: filtre
          ? '🔍 Aucune carte ne correspond à ta recherche.'
          : '📭 Le catalogue est vide pour l’instant. Reviens bientôt !',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const pages = cards.map((card, i) =>
      buildCardEmbed(card).setFooter({
        text: `ID : ${card.cardId}  •  Page ${i + 1}/${cards.length}`,
      }),
    );

    await paginateEmbeds(interaction, pages);
  },
};
