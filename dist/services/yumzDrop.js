"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startYumzDrops = startYumzDrops;
const discord_js_1 = require("discord.js");
const drops_1 = require("../config/drops");
/** Le salon de drop est-il configuré ? (même salon que les cartes) */
function dropChannelConfigured() {
    return drops_1.DROPS.channelId.length > 0 && !drops_1.DROPS.channelId.startsWith('ID_');
}
/** Délai aléatoire (ms) avant le prochain drop de Yumz. */
function randomInterval() {
    const { minIntervalMs, maxIntervalMs } = drops_1.YUMZ_DROP;
    return Math.floor(Math.random() * (maxIntervalMs - minIntervalMs + 1)) + minIntervalMs;
}
/** Montant aléatoire, biaisé vers le bas (grosses sommes rares). */
function randomAmount() {
    const { minAmount, maxAmount } = drops_1.YUMZ_DROP;
    const skew = Math.random() * Math.random(); // proche de 0 la plupart du temps
    return Math.floor(minAmount + skew * (maxAmount - minAmount));
}
/** Poste un drop de Yumz : premier à cliquer « Récupérer » gagne. */
async function dropOnce(client) {
    const channel = await client.channels.fetch(drops_1.DROPS.channelId).catch(() => null);
    if (!channel || channel.type !== discord_js_1.ChannelType.GuildText)
        return;
    const amount = randomAmount();
    const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId(`yumzclaim:${amount}`)
        .setLabel(`Récupérer ${amount} Yumz`)
        .setEmoji('💰')
        .setStyle(discord_js_1.ButtonStyle.Success));
    await channel
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
function startYumzDrops(client) {
    if (!dropChannelConfigured())
        return; // même condition que les drops de cartes
    const scheduleNext = () => {
        setTimeout(async () => {
            try {
                await dropOnce(client);
            }
            catch (error) {
                console.error('Erreur pendant un drop de Yumz :', error);
            }
            scheduleNext();
        }, randomInterval());
    };
    scheduleNext();
    console.log('💰 Drops de Yumz activés.');
}
