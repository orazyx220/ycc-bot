import { MessageFlags, type ButtonInteraction } from 'discord.js';
import { purchaseCard } from '../services/purchase';
import { refreshDropMessage } from '../utils/dropMessage';

const PREFIX = 'buy:';

/** Un customId de bouton d'achat ressemble à "buy:ycc-originel". */
export function isBuyButton(customId: string): boolean {
  return customId.startsWith(PREFIX);
}

/**
 * Gère un clic sur « Acheter ». Réponse EPHEMERAL (visible du seul acheteur),
 * puis rafraîchit le message de drop (stock + bouton).
 */
export async function handleBuyButton(interaction: ButtonInteraction): Promise<void> {
  // On accuse réception tout de suite (Discord exige une réponse < 3 s).
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const cardId = interaction.customId.slice(PREFIX.length);
  const result = await purchaseCard(interaction.user.id, cardId);

  switch (result.status) {
    case 'ok':
      await interaction.editReply({
        content:
          `🎉 Tu as acheté **${result.card.name}** — exemplaire **#${result.serial}/${result.card.maxSupply}** ` +
          `pour **${result.card.price}** Yumz !\nNouveau solde : **${result.newBalance}** Yumz.`,
      });
      await refreshDropMessage(interaction.message, cardId);
      return;

    case 'soldout':
      await interaction.editReply({ content: '⏳ Trop tard, cette carte a déjà été achetée !' });
      await refreshDropMessage(interaction.message, cardId);
      return;

    case 'insufficient':
      await interaction.editReply({
        content:
          `❌ Pas assez de Yumz. Il t’en faut **${result.price}**, tu as **${result.balance}**. ` +
          `Récupère-en avec \`/daily\` ou en discutant !`,
      });
      return;

    case 'notfound':
      await interaction.editReply({ content: '❓ Cette carte n’existe plus.' });
      return;
  }
}
