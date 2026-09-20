import {
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type Client,
  type TextChannel,
} from 'discord.js';
import { DROPS, YUMZ_DROP } from '../config/drops';

/** Le salon de drop est-il configuré ? (même salon que les cartes) */
function dropChannelConfigured(): boolean {
  return DROPS.channelId.length > 0 && !DROPS.channelId.startsWith('ID_');
}

/** Délai aléatoire (ms) avant le prochain drop de Yumz. */
function randomInterval(): number {
  const { minIntervalMs, maxIntervalMs } = YUMZ_DROP;
  return Math.floor(Math.random() * (maxIntervalMs - minIntervalMs + 1)) + minIntervalMs;
}

/** Montant aléatoire, biaisé vers le bas (grosses sommes rares). */
function randomAmount(): number {
  const { minAmount, maxAmount } = YUMZ_DROP;
  const skew = Math.random() * Math.random(); // proche de 0 la plupart du temps
  return Math.floor(minAmount + skew * (maxAmount - minAmount));
}

/** Poste un drop de Yumz : premier à cliquer « Récupérer » gagne. */
async function dropOnce(client: Client): Promise<void> {
  const channel = await client.channels.fetch(DROPS.channelId).catch(() => null);
  if (!channel || channel.type !== ChannelType.GuildText) return;

  const amount = randomAmount();
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`yumzclaim:${amount}`)
      .setLabel(`Récupérer ${amount} Yumz`)
      .setEmoji('💰')
      .setStyle(ButtonStyle.Success),
  );

  await (channel as TextChannel)
    .send({
      content: `💰 **Une pluie de Yumz !** Premier à cliquer remporte **${amount} Yumz** !`,
      components: [row],
    })
    .catch((error) => console.error('Échec de l’envoi du drop de Yumz :', error));
}

/**
 * Démarre la boucle de drops de Yumz (timer aléatoire reprogrammé après chaque
 * drop). À appeler une fois, quand le bot est prêt.
 */
export function startYumzDrops(client: Client): void {
  if (!dropChannelConfigured()) return; // même condition que les drops de cartes

  const scheduleNext = (): void => {
    setTimeout(async () => {
      try {
        await dropOnce(client);
      } catch (error) {
        console.error('Erreur pendant un drop de Yumz :', error);
      }
      scheduleNext();
    }, randomInterval());
  };

  scheduleNext();
  console.log('💰 Drops de Yumz activés.');
}
