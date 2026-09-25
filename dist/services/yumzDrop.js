"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startYumzDrops = startYumzDrops;
const discord_js_1 = require("discord.js");
const drops_1 = require("../config/drops");
/** Le salon de drop est-il configuré ? (même salon que les cartes) */
function dropChannelConfigured() {
    return drops_1.DROPS.channelId.length > 0 && !drops_1.DROPS.channelId.startsWith('ID_');
}
/**
 * Délai aléatoire (ms) avant le prochain drop de Yumz.
 * On utilise une loi EXPONENTIELLE (processus de Poisson) : elle est « sans
 * mémoire », donc le prochain drop est totalement imprévisible — souvent court,
 * parfois très long. On borne juste les extrêmes pour rester raisonnable.
 */
function randomInterval() {
    const { minIntervalMs, maxIntervalMs, meanIntervalMs } = drops_1.YUMZ_DROP;
    const raw = -meanIntervalMs * Math.log(1 - Math.random());
    return Math.min(maxIntervalMs, Math.max(minIntervalMs, Math.floor(raw)));
}
/** Montant aléatoire : on tire un palier selon les poids, puis un montant dedans. */
function randomAmount() {
    const tiers = drops_1.YUMZ_DROP.tiers;
    const total = tiers.reduce((sum, t) => sum + t.weight, 0);
    let r = Math.random() * total;
    for (const t of tiers) {
        r -= t.weight;
        if (r < 0)
            return Math.floor(t.min + Math.random() * (t.max - t.min));
    }
    const last = tiers[tiers.length - 1];
    return Math.floor(last.min + Math.random() * (last.max - last.min));
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
                // Parfois, aucun drop : silence total (effet « rien du tout »).
                if (Math.random() >= drops_1.YUMZ_DROP.skipChance) {
                    await dropOnce(client);
                }
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
