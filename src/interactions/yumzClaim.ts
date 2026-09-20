import { MessageFlags, type ButtonInteraction } from 'discord.js';
import { addYumz } from '../services/economy';
import { Transaction } from '../database/models/Transaction';

const PREFIX = 'yumzclaim:';

/** IDs des messages de drop déjà récupérés (anti double-récupération). */
const claimedDrops = new Set<string>();

export function isYumzClaim(customId: string): boolean {
  return customId.startsWith(PREFIX);
}

/**
 * Gère un clic sur « Récupérer » d'un drop de Yumz. Le premier à cliquer gagne.
 * L'anti-concurrence repose sur un Set en mémoire : la vérification + l'ajout
 * sont SYNCHRONES (avant tout await), donc deux clics simultanés ne peuvent pas
 * gagner tous les deux (Node est mono-thread).
 */
export async function handleYumzClaim(interaction: ButtonInteraction): Promise<void> {
  const dropId = interaction.message.id;

  if (claimedDrops.has(dropId)) {
    await interaction.reply({
      content: '⏳ Trop tard, ces Yumz ont déjà été récupérés !',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }
  claimedDrops.add(dropId); // réservé immédiatement (avant tout await)

  const amount = Number.parseInt(interaction.customId.slice(PREFIX.length), 10) || 0;
  await addYumz(interaction.user.id, amount);
  await Transaction.create({ discordId: interaction.user.id, type: 'yumz_drop', amount });

  await interaction.reply({
    content: `💰 Tu as récupéré **${amount} Yumz** ! 🎉`,
    flags: MessageFlags.Ephemeral,
  });

  // Met à jour le message : gagnant affiché + bouton retiré.
  await interaction.message
    .edit({
      content: `💰 **Pluie de Yumz** — **${amount} Yumz** récupérés par <@${interaction.user.id}> ! 🎉`,
      components: [],
    })
    .catch(() => {});
}
