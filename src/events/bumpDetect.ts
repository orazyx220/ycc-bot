import { ChannelType, type Message, type TextChannel } from 'discord.js';
import { giveBumpReward } from '../services/bump';
import { REWARDS } from '../config/rewards';
import { BUMP } from '../config/bump';

/**
 * Détecte un bump Disboard réussi et crédite automatiquement l'auteur du bump
 * (dans la limite de 3/jour). On reconnaît le succès via l'embed de confirmation.
 * Le message de récompense est posté dans le salon configuré (BUMP.rewardChannelId),
 * ou dans le salon du bump si aucun salon n'est configuré.
 */
export async function handleDisboardBump(message: Message): Promise<void> {
  if (message.author.id !== BUMP.disboardBotId) return;
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
  if (res.status !== 'ok') return;

  const content =
    `🎉 Merci <@${bumper.id}> pour le bump ! **+${REWARDS.bump} Yumz** ` +
    `(${res.count}/${REWARDS.bumpMaxPerDay} aujourd’hui).`;

  // Salon cible : celui configuré si valide, sinon le salon du bump.
  const configured = BUMP.rewardChannelId && !BUMP.rewardChannelId.startsWith('ID_');
  let target: TextChannel | null = null;
  if (configured) {
    const channel = await message.client.channels.fetch(BUMP.rewardChannelId).catch(() => null);
    if (channel && channel.type === ChannelType.GuildText) target = channel;
  }

  if (target) {
    await target.send(content).catch(() => {});
  } else {
    await message.channel.send(content).catch(() => {});
  }
}
