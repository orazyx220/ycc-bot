import { MessageFlags, type ButtonInteraction } from 'discord.js';
import { claimFreeCard } from '../services/purchase';
import { refreshDropMessage } from '../utils/dropMessage';

const PREFIX = 'gift:';

/** Un customId de bouton cadeau ressemble à "gift:carte-mystere". */
export function isGiftButton(customId: string): boolean {
  return customId.startsWith(PREFIX);
}

/**
 * Gère un clic sur « Récupérer » (drop gratuit). Le premier à cliquer gagne
 * l'exemplaire (garanti par la réservation atomique dans claimFreeCard).
 */
export async function handleGiftButton(interaction: ButtonInteraction): Promise<void> {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const cardId = interaction.customId.slice(PREFIX.length);
  const result = await claimFreeCard(interaction.user.id, cardId);

  switch (result.status) {
    case 'ok':
      await interaction.editReply({
        content:
          `🎁 Tu as récupéré **${result.card.name}** — exemplaire **#${result.serial}/${result.card.maxSupply}**, ` +
          `gratuitement ! 🎉`,
      });
      await refreshDropMessage(interaction.message, cardId);
      return;

    case 'soldout':
      await interaction.editReply({ content: '⏳ Trop tard, cette carte a déjà été récupérée !' });
      await refreshDropMessage(interaction.message, cardId);
      return;

    case 'notfound':
      await interaction.editReply({ content: '❓ Cette carte n’existe plus.' });
      return;
  }
}
