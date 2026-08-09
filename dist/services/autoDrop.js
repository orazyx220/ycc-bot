"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startAutoDrops = startAutoDrops;
const discord_js_1 = require("discord.js");
const Card_1 = require("../database/models/Card");
const drops_1 = require("../config/drops");
const dropMessage_1 = require("../utils/dropMessage");
/** Vrai si le salon de drop n'a pas encore été configuré. */
function dropChannelConfigured() {
    return drops_1.DROPS.channelId.length > 0 && !drops_1.DROPS.channelId.startsWith('ID_');
}
/** Délai aléatoire (ms) avant le prochain drop, dans l'intervalle configuré. */
function randomInterval() {
    const { minIntervalMs, maxIntervalMs } = drops_1.DROPS;
    return Math.floor(Math.random() * (maxIntervalMs - minIntervalMs + 1)) + minIntervalMs;
}
/** Déclenche UN drop : choisit une carte de la réserve et la poste. */
async function dropOnce(client) {
    // Cartes en réserve encore en stock.
    const pool = await Card_1.Card.find({ autoDrop: true, remainingSupply: { $gt: 0 } });
    if (pool.length === 0)
        return;
    const card = pool[Math.floor(Math.random() * pool.length)];
    const channel = await client.channels.fetch(drops_1.DROPS.channelId).catch(() => null);
    if (!channel || channel.type !== discord_js_1.ChannelType.GuildText)
        return;
    await channel
        .send({ content: '🎲 **Un drop sauvage apparaît !**', ...(0, dropMessage_1.buildDropComponents)(card) })
        .catch((error) => console.error('Échec de l’envoi du drop auto :', error));
}
/**
 * Démarre la boucle de drops automatiques : on reprogramme un timer aléatoire
 * après chaque drop. À appeler une fois, quand le bot est prêt.
 */
function startAutoDrops(client) {
    if (!dropChannelConfigured()) {
        console.log('ℹ️ Drops automatiques désactivés (channelId non configuré dans src/config/drops.ts).');
        return;
    }
    const scheduleNext = () => {
        const delay = randomInterval();
        setTimeout(async () => {
            try {
                await dropOnce(client);
            }
            catch (error) {
                console.error('Erreur pendant un drop automatique :', error);
            }
            scheduleNext(); // on programme le suivant
        }, delay);
    };
    scheduleNext();
    console.log('🎁 Drops automatiques activés.');
}
