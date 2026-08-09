import { ChannelType, type Client, type TextChannel } from 'discord.js';
import { Card } from '../database/models/Card';
import { DROPS } from '../config/drops';
import { buildDropComponents } from '../utils/dropMessage';

/** Vrai si le salon de drop n'a pas encore été configuré. */
function dropChannelConfigured(): boolean {
  return DROPS.channelId.length > 0 && !DROPS.channelId.startsWith('ID_');
}

/** Délai aléatoire (ms) avant le prochain drop, dans l'intervalle configuré. */
function randomInterval(): number {
  const { minIntervalMs, maxIntervalMs } = DROPS;
  return Math.floor(Math.random() * (maxIntervalMs - minIntervalMs + 1)) + minIntervalMs;
}

/** Déclenche UN drop : choisit une carte de la réserve et la poste. */
async function dropOnce(client: Client): Promise<void> {
  // Cartes en réserve encore en stock.
  const pool = await Card.find({ autoDrop: true, remainingSupply: { $gt: 0 } });
  if (pool.length === 0) return;

  const card = pool[Math.floor(Math.random() * pool.length)]!;

  const channel = await client.channels.fetch(DROPS.channelId).catch(() => null);
  if (!channel || channel.type !== ChannelType.GuildText) return;

  await (channel as TextChannel)
    .send({ content: '🎲 **Un drop sauvage apparaît !**', ...buildDropComponents(card) })
    .catch((error) => console.error('Échec de l’envoi du drop auto :', error));
}

/**
 * Démarre la boucle de drops automatiques : on reprogramme un timer aléatoire
 * après chaque drop. À appeler une fois, quand le bot est prêt.
 */
export function startAutoDrops(client: Client): void {
  if (!dropChannelConfigured()) {
    console.log('ℹ️ Drops automatiques désactivés (channelId non configuré dans src/config/drops.ts).');
    return;
  }

  const scheduleNext = (): void => {
    const delay = randomInterval();
    setTimeout(async () => {
      try {
        await dropOnce(client);
      } catch (error) {
        console.error('Erreur pendant un drop automatique :', error);
      }
      scheduleNext(); // on programme le suivant
    }, delay);
  };

  scheduleNext();
  console.log('🎁 Drops automatiques activés.');
}
