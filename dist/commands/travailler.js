"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.travailler = void 0;
const discord_js_1 = require("discord.js");
const User_1 = require("../database/models/User");
const Transaction_1 = require("../database/models/Transaction");
const work_1 = require("../config/work");
const time_1 = require("../utils/time");
/**
 * /travailler — petit gain de Yumz aléatoire, avec un cooldown (1 h).
 * Anti double-clic : mise à jour atomique conditionnée au cooldown.
 */
exports.travailler = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('travailler')
        .setDescription('Travaille pour gagner quelques Yumz (toutes les heures).'),
    async execute(interaction) {
        const user = await (0, User_1.getOrCreateUser)(interaction.user.id);
        const now = Date.now();
        const last = user.workLastClaim?.getTime() ?? null;
        if (last !== null && now - last < work_1.WORK.cooldownMs) {
            const remaining = last + work_1.WORK.cooldownMs - now;
            await interaction.reply({
                content: `😴 Tu es fatigué·e. Reviens travailler dans **${(0, time_1.formatDuration)(remaining)}**.`,
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
            return;
        }
        const reward = Math.floor(Math.random() * (work_1.WORK.max - work_1.WORK.min + 1)) + work_1.WORK.min;
        const cutoff = new Date(now - work_1.WORK.cooldownMs);
        const credited = await User_1.User.findOneAndUpdate({
            discordId: interaction.user.id,
            $or: [{ workLastClaim: null }, { workLastClaim: { $lte: cutoff } }],
        }, { $inc: { yumz: reward }, $set: { workLastClaim: new Date(now) } }, { returnDocument: 'after' });
        if (!credited) {
            await interaction.reply({
                content: '😴 Tu viens déjà de travailler.',
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
            return;
        }
        await Transaction_1.Transaction.create({ discordId: interaction.user.id, type: 'work', amount: reward });
        const scenario = work_1.WORK_MESSAGES[Math.floor(Math.random() * work_1.WORK_MESSAGES.length)];
        await interaction.reply(`${scenario}\n💰 Tu gagnes **+${reward} Yumz** ! Nouveau solde : **${credited.yumz}** Yumz.`);
    },
};
