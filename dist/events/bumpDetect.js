"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleDisboardBump = handleDisboardBump;
const discord_js_1 = require("discord.js");
const bump_1 = require("../services/bump");
const rewards_1 = require("../config/rewards");
const bump_2 = require("../config/bump");
/**
 * Détecte un bump Disboard réussi et crédite automatiquement l'auteur du bump
 * (dans la limite de 3/jour). On reconnaît le succès via l'embed de confirmation.
 * Le message de récompense est posté dans le salon configuré (BUMP.rewardChannelId),
 * ou dans le salon du bump si aucun salon n'est configuré.
 */
async function handleDisboardBump(message) {
    if (message.author.id !== bump_2.BUMP.disboardBotId)
        return;
    if (!message.inGuild())
        return;
    const embed = message.embeds[0];
    if (!embed)
        return;
    // Message de succès Disboard (EN "Bump done!" / FR "Bump effectué" / 👍).
    const desc = (embed.description ?? '').toLowerCase();
    const isSuccess = desc.includes('bump done') ||
        desc.includes('bump effectu') ||
        desc.includes('👍') ||
        desc.includes(':thumbsup:');
    if (!isSuccess)
        return;
    // Qui a lancé /bump ? (métadonnées de l'interaction slash de Disboard)
    const bumper = message.interactionMetadata?.user;
    if (!bumper || bumper.bot)
        return;
    const res = await (0, bump_1.giveBumpReward)(bumper.id);
    if (res.status !== 'ok')
        return;
    const content = `🎉 Merci <@${bumper.id}> pour le bump ! **+${rewards_1.REWARDS.bump} Yumz** ` +
        `(${res.count}/${rewards_1.REWARDS.bumpMaxPerDay} aujourd’hui).`;
    // Salon cible : celui configuré si valide, sinon le salon du bump.
    const configured = bump_2.BUMP.rewardChannelId && !bump_2.BUMP.rewardChannelId.startsWith('ID_');
    let target = null;
    if (configured) {
        const channel = await message.client.channels.fetch(bump_2.BUMP.rewardChannelId).catch(() => null);
        if (channel && channel.type === discord_js_1.ChannelType.GuildText)
            target = channel;
    }
    if (target) {
        await target.send(content).catch(() => { });
    }
    else {
        await message.channel.send(content).catch(() => { });
    }
}
