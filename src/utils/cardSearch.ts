import type { AutocompleteInteraction } from 'discord.js';
import { Card, type CardDoc } from '../database/models/Card';
import { rarityInfo } from '../config/rarities';

/**
 * Vrai si la carte correspond au texte cherché (nom, ID ou libellé de rareté),
 * insensible à la casse. Une recherche vide correspond à tout.
 */
export function matchesSearch(card: CardDoc, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    card.name.toLowerCase().includes(q) ||
    card.cardId.toLowerCase().includes(q) ||
    rarityInfo(card.rarity).label.toLowerCase().includes(q)
  );
}

/**
 * Suggestions d'autocomplétion de l'option "recherche" : propose les cartes
 * dont le nom/ID contient le texte tapé (max 25). `onlyInStock` limite aux
 * cartes disponibles (pour la boutique).
 */
export async function respondCardAutocomplete(
  interaction: AutocompleteInteraction,
  onlyInStock = false,
): Promise<void> {
  const focused = interaction.options.getFocused().toLowerCase();
  const filter = onlyInStock ? { remainingSupply: { $gt: 0 } } : {};
  const cards = await Card.find(filter).limit(300);

  const results = cards
    .filter(
      (c) => c.name.toLowerCase().includes(focused) || c.cardId.toLowerCase().includes(focused),
    )
    .slice(0, 25)
    .map((c) => ({ name: `${c.name} (${c.cardId})`.slice(0, 100), value: c.name.slice(0, 100) }));

  await interaction.respond(results);
}
