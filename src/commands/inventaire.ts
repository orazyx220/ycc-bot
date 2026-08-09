import {
  SlashCommandBuilder,
  EmbedBuilder,
  MessageFlags,
  type ChatInputCommandInteraction,
} from 'discord.js';
import type { Command } from '../types';
import { getOrCreateUser } from '../database/models/User';
import { Card, type CardDoc } from '../database/models/Card';
import { RARITIES, rarityInfo } from '../config/rarities';
import { paginateEmbeds } from '../utils/pagination';

/**
 * /inventaire [membre] — feuillette les cartes possédées (image en grand),
 * avec la quantité de chaque carte. Sans argument : ton propre inventaire.
 */
export const inventaire: Command = {
  data: new SlashCommandBuilder()
    .setName('inventaire')
    .setDescription('Affiche tes cartes (ou celles d’un membre).')
    .addUserOption((option) =>
      option
        .setName('membre')
        .setDescription('Le membre dont voir l’inventaire (toi par défaut)')
        .setRequired(false),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser('membre') ?? interaction.user;
    const isSelf = target.id === interaction.user.id;
    const user = await getOrCreateUser(target.id);

    if (user.cards.length === 0) {
      await interaction.reply({
        content: isSelf
          ? '🗃️ Ton inventaire est vide. Achète des cartes lors d’un `/drop` !'
          : `🗃️ ${target.username} n’a encore aucune carte.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // On compte combien d'exemplaires de chaque carte le membre possède.
    const counts = new Map<string, number>();
    for (const id of user.cards) counts.set(id, (counts.get(id) ?? 0) + 1);

    // On récupère les métadonnées des cartes possédées, en une seule requête.
    const cards = await Card.find({ cardId: { $in: [...counts.keys()] } });
    const cardById = new Map(cards.map((c) => [c.cardId, c]));

    // Tri : rareté (légendaire d'abord), puis nom.
    const rarityRank = new Map(RARITIES.map((r, i) => [r, i]));
    const owned = [...counts.keys()]
      .map((id) => cardById.get(id))
      .filter((c): c is CardDoc => Boolean(c))
      .sort(
        (a, b) =>
          (rarityRank.get(b.rarity) ?? 0) - (rarityRank.get(a.rarity) ?? 0) ||
          a.name.localeCompare(b.name),
      );

    const total = owned.length;
    const pages = owned.map((card, i) => {
      const info = rarityInfo(card.rarity);
      const qty = counts.get(card.cardId) ?? 1;
      return new EmbedBuilder()
        .setColor(card.borderColor ?? info.color)
        .setAuthor({
          name: `Collection de ${target.username}`,
          iconURL: target.displayAvatarURL(),
        })
        .setTitle(`${info.emoji} ${card.name}`)
        .setImage(card.imageUrl)
        .addFields(
          { name: 'Rareté', value: info.label, inline: true },
          { name: 'Possédées', value: `×${qty}`, inline: true },
        )
        .setFooter({ text: `ID : ${card.cardId}  •  ${i + 1}/${total}` });
    });

    await paginateEmbeds(interaction, pages);
  },
};
