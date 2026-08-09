"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.daily = void 0;
const discord_js_1 = require("discord.js");
const User_1 = require("../database/models/User");
const Transaction_1 = require("../database/models/Transaction");
const rewards_1 = require("../config/rewards");
const time_1 = require("../utils/time");
/**
 * /daily — donne des Yumz une fois toutes les 24 h, avec un BONUS DE STREAK :
 *   - base 550 Yumz,
 *   - +10 par jour consécutif,
 *   - plafonné à 1000/jour,
 *   - si tu rates un jour (plus de 48 h sans /daily), le streak repart à 0.
 *
 * Anti double-clic : la mise à jour finale est ATOMIQUE et conditionnée au
 * délai de 24 h — un seul crédit passe même en cas de clics simultanés.
 */
exports.daily = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('daily')
        .setDescription('Réclame tes Yumz journaliers (bonus de streak !).'),
    async execute(interaction) {
        const user = await (0, User_1.getOrCreateUser)(interaction.user.id);
        const now = Date.now();
        const last = user.dailyLastClaim?.getTime() ?? null;
        // Déjà réclamé il y a moins de 24 h → on refuse et on indique le délai.
        if (last !== null && now - last < time_1.DAY_MS) {
            const remaining = last + time_1.DAY_MS - now;
            await interaction.reply({
                content: `⏳ Tu as déjà réclamé ton \`/daily\`. Reviens dans **${(0, time_1.formatDuration)(remaining)}**.`,
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
            return;
        }
        // Consécutif si le dernier /daily date de moins de 48 h ; sinon le streak repart.
        const consecutive = last !== null && now - last < 2 * time_1.DAY_MS;
        const newStreak = consecutive ? user.dailyStreak + 1 : 1;
        const reward = Math.min(rewards_1.REWARDS.daily + (newStreak - 1) * rewards_1.REWARDS.dailyStreakBonus, rewards_1.REWARDS.dailyMax);
        // Crédit ATOMIQUE : ne passe que si toujours éligible (anti double-clic).
        const cutoff = new Date(now - time_1.DAY_MS);
        const credited = await User_1.User.findOneAndUpdate({
            discordId: interaction.user.id,
            $or: [{ dailyLastClaim: null }, { dailyLastClaim: { $lte: cutoff } }],
        }, {
            $inc: { yumz: reward },
            $set: { dailyLastClaim: new Date(now), dailyStreak: newStreak },
        }, { returnDocument: 'after' });
        if (!credited) {
            // Course perdue (double-clic) : quelqu'un a déjà réclamé à l'instant.
            await interaction.reply({
                content: '⏳ Tu as déjà réclamé ton `/daily` à l’instant.',
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
            return;
        }
        await Transaction_1.Transaction.create({
            discordId: interaction.user.id,
            type: 'daily',
            amount: reward,
        });
        const atMax = reward >= rewards_1.REWARDS.dailyMax;
        const bonus = reward - rewards_1.REWARDS.daily;
        const bonusText = bonus > 0 ? ` (dont **+${bonus}** de streak)` : '';
        const maxText = atMax ? ' 🔝 *(plafond atteint !)*' : '';
        await interaction.reply(`🎁 **+${reward} Yumz**${bonusText} !  🔥 Streak : **${newStreak} jour(s)**${maxText}\n` +
            `Nouveau solde : **${credited.yumz}** Yumz. Reviens dans 24 h pour continuer ta série ! ⏰`);
    },
};
