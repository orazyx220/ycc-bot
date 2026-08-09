"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.daily = void 0;
const discord_js_1 = require("discord.js");
const User_1 = require("../database/models/User");
const Transaction_1 = require("../database/models/Transaction");
const rewards_1 = require("../config/rewards");
const time_1 = require("../utils/time");
/**
 * /daily — donne 550 Yumz, une fois toutes les 24 h.
 *
 * Anti double-clic : au lieu de "lire puis écrire" (ce qui laisse une faille
 * si deux commandes arrivent en même temps), on fait UNE seule opération
 * atomique `findOneAndUpdate` qui n'agit QUE si le délai de 24 h est passé.
 * MongoDB garantit qu'une seule des deux requêtes concurrentes réussira.
 */
exports.daily = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('daily')
        .setDescription('Réclame tes 550 Yumz journaliers.'),
    async execute(interaction) {
        // On s'assure d'abord que le membre existe en base.
        await (0, User_1.getOrCreateUser)(interaction.user.id);
        const now = new Date();
        const cutoff = new Date(now.getTime() - time_1.DAY_MS); // "il y a 24 h"
        // On tente le crédit : réussit seulement si jamais réclamé,
        // OU si le dernier /daily date de plus de 24 h.
        const credited = await User_1.User.findOneAndUpdate({
            discordId: interaction.user.id,
            $or: [{ dailyLastClaim: null }, { dailyLastClaim: { $lte: cutoff } }],
        }, {
            $inc: { yumz: rewards_1.REWARDS.daily },
            $set: { dailyLastClaim: now },
        }, { returnDocument: 'after' });
        // Cas 1 : le crédit a réussi.
        if (credited) {
            await Transaction_1.Transaction.create({
                discordId: interaction.user.id,
                type: 'daily',
                amount: rewards_1.REWARDS.daily,
            });
            await interaction.reply(`🎁 **+${rewards_1.REWARDS.daily} Yumz** récupérés ! Ton nouveau solde : **${credited.yumz}** Yumz.\nReviens dans 24 h. ⏰`);
            return;
        }
        // Cas 2 : déjà réclamé récemment → on calcule le temps restant.
        const user = await (0, User_1.getOrCreateUser)(interaction.user.id);
        const lastClaim = user.dailyLastClaim?.getTime() ?? 0;
        const remaining = lastClaim + time_1.DAY_MS - now.getTime();
        await interaction.reply({
            content: `⏳ Tu as déjà réclamé ton /daily. Reviens dans **${(0, time_1.formatDuration)(remaining)}**.`,
            flags: discord_js_1.MessageFlags.Ephemeral, // message visible par toi seul
        });
    },
};
