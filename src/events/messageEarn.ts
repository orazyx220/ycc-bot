import type { Message } from 'discord.js';
import { computeMessageReward } from '../services/messageReward';
import { addYumz } from '../services/economy';
import { MESSAGE_EARN } from '../config/activity';

/**
 * Cooldown en mémoire : discordId → timestamp du dernier gain.
 * Simple et suffisant (se réinitialise au redémarrage, sans conséquence grave).
 */
const lastEarn = new Map<string, number>();

/**
 * Attribue des Yumz quand un membre écrit un message (activité écrite).
 * Ignore les bots, les MP, et respecte le cooldown de 30 s.
 */
export async function handleMessageForYumz(message: Message): Promise<void> {
  if (message.author.bot) return;
  if (!message.inGuild()) return;

  const content = message.content?.trim() ?? '';
  if (content.length === 0) return; // besoin de texte écrit (pas juste une image)

  // Cooldown : un seul gain par membre toutes les 30 s.
  const now = Date.now();
  const previous = lastEarn.get(message.author.id) ?? 0;
  if (now - previous < MESSAGE_EARN.cooldownMs) return;
  lastEarn.set(message.author.id, now);

  const roleIds = message.member
    ? [...message.member.roles.cache.keys()]
    : [];

  const reward = computeMessageReward(content, roleIds, message.channelId);
  if (reward > 0) {
    await addYumz(message.author.id, reward);
  }
}
