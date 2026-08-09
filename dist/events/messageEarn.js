"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleMessageForYumz = handleMessageForYumz;
const messageReward_1 = require("../services/messageReward");
const economy_1 = require("../services/economy");
const activity_1 = require("../config/activity");
/**
 * Cooldown en mémoire : discordId → timestamp du dernier gain.
 * Simple et suffisant (se réinitialise au redémarrage, sans conséquence grave).
 */
const lastEarn = new Map();
/**
 * Attribue des Yumz quand un membre écrit un message (activité écrite).
 * Ignore les bots, les MP, et respecte le cooldown de 30 s.
 */
async function handleMessageForYumz(message) {
    if (message.author.bot)
        return;
    if (!message.inGuild())
        return;
    const content = message.content?.trim() ?? '';
    if (content.length === 0)
        return; // besoin de texte écrit (pas juste une image)
    // Cooldown : un seul gain par membre toutes les 30 s.
    const now = Date.now();
    const previous = lastEarn.get(message.author.id) ?? 0;
    if (now - previous < activity_1.MESSAGE_EARN.cooldownMs)
        return;
    lastEarn.set(message.author.id, now);
    const roleIds = message.member
        ? [...message.member.roles.cache.keys()]
        : [];
    const reward = (0, messageReward_1.computeMessageReward)(content, roleIds, message.channelId);
    if (reward > 0) {
        await (0, economy_1.addYumz)(message.author.id, reward);
    }
}
