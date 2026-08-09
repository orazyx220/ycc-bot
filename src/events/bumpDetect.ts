import type { Message } from 'discord.js';
import { giveBumpReward } from '../services/bump';
import { REWARDS } from '../config/rewards';

/** ID du bot Disboard (celui qui confirme les bumps). */
const DISBOARD_BOT_ID = '302050872383242240';

/**
 * Détecte un bump Disboard réussi et crédite automatiquement l'auteur du bump
 * (dans la limite de 3/jour). On reconnaît le succès via l'embed de confirmation.
 */
export async function handleDisboardBump(message: Message): Promise<void> {
  if (message.author.id !== DISBOARD_BOT_ID) return;
  if (!message.inGuild()) return;

  const embed = message.embeds[0];
  if (!embed) return;

  // Message de succès Disboard (EN "Bump done!" / FR "Bump effectué" / 👍).
  const desc = (embed.description ?? '').toLowerCase();
  const isSuccess =
    desc.includes('bump done') ||
    desc.includes('bump effectu') ||
    desc.includes('👍') ||
    desc.includes(':thumbsup:');
  if (!isSuccess) return;

  // Qui a lancé /bump ? (métadonnées de l'interaction slash de Disboard)
  const bumper = message.interactionMetadata?.user;
  if (!bumper || bumper.bot) return;

  const res = await giveBumpReward(bumper.id);
  if (res.status === 'ok') {
    await message.channel
      .send(
        `🎉 Merci <@${bumper.id}> pour le bump ! **+${REWARDS.bump} Yumz** ` +
          `(${res.count}/${REWARDS.bumpMaxPerDay} aujourd’hui).`,
      )
      .catch(() => {});
  }
}
