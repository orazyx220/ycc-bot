"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reward = void 0;
const discord_js_1 = require("discord.js");
const User_1 = require("../database/models/User");
const economy_1 = require("../services/economy");
const rewards_1 = require("../config/rewards");
/** Date du jour au format 'AAAA-MM-JJ' (UTC), pour le compteur de bumps. */
function todayKey() {
    return new Date().toISOString().slice(0, 10);
}
/**
 * /reward — (Admin) attribue une récompense en appliquant automatiquement
 * le barème des Yumz. Sous-commandes :
 *   /reward bump  <membre>            → 500  (max 3/jour)
 *   /reward boost <membre>            → 5000 (1 mois de boost)
 *   /reward voice <membre>            → 2000 (succès vocal)
 *   /reward level <membre> <niveau>   → niveau×100+500 (paliers 10→100)
 */
exports.reward = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('reward')
        .setDescription('(Admin) Attribue une récompense selon le barème YCC.')
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator)
        .addSubcommand((s) => s
        .setName('bump')
        .setDescription('500 Yumz (max 3 fois par jour)')
        .addUserOption((o) => o.setName('membre').setDescription('Membre').setRequired(true)))
        .addSubcommand((s) => s
        .setName('boost')
        .setDescription('5000 Yumz (1 mois de boost du serveur)')
        .addUserOption((o) => o.setName('membre').setDescription('Membre').setRequired(true)))
        .addSubcommand((s) => s
        .setName('voice')
        .setDescription('2000 Yumz (succès vocal global)')
        .addUserOption((o) => o.setName('membre').setDescription('Membre').setRequired(true)))
        .addSubcommand((s) => s
        .setName('level')
        .setDescription('Succès de niveau (paliers 10, 20, … 100)')
        .addUserOption((o) => o.setName('membre').setDescription('Membre').setRequired(true))
        .addIntegerOption((o) => o
        .setName('niveau')
        .setDescription('Palier atteint (10, 20, 30, … 100)')
        .setRequired(true)
        .setMinValue(10)
        .setMaxValue(100))),
    async execute(interaction) {
        if (!interaction.memberPermissions?.has(discord_js_1.PermissionFlagsBits.Administrator)) {
            await interaction.reply({
                content: '🚫 Cette commande est réservée aux administrateurs.',
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
            return;
        }
        const sub = interaction.options.getSubcommand();
        const target = interaction.options.getUser('membre', true);
        // --- Cas particulier : le niveau doit être un palier de 10 ---
        if (sub === 'level') {
            const niveau = interaction.options.getInteger('niveau', true);
            if (niveau % 10 !== 0) {
                await interaction.reply({
                    content: '❔ Le niveau doit être un palier de 10 (10, 20, 30, … 100).',
                    flags: discord_js_1.MessageFlags.Ephemeral,
                });
                return;
            }
            const gain = (0, rewards_1.levelReward)(niveau);
            const solde = await (0, economy_1.grantYumz)(target.id, gain, 'level', `niveau ${niveau}`);
            await interaction.reply({
                content: `🏆 Succès **niveau ${niveau}** : **+${gain} Yumz** pour <@${target.id}>. Solde : **${solde}**.`,
                allowedMentions: { users: [] },
            });
            return;
        }
        // --- Cas particulier : le bump est limité à 3 par jour ---
        if (sub === 'bump') {
            const today = todayKey();
            const user = await (0, User_1.getOrCreateUser)(target.id);
            const dejaFait = user.bumpCountDate === today ? user.bumpCountToday : 0;
            if (dejaFait >= rewards_1.REWARDS.bumpMaxPerDay) {
                await interaction.reply({
                    content: `⛔ <@${target.id}> a déjà atteint la limite de **${rewards_1.REWARDS.bumpMaxPerDay} bumps** aujourd’hui.`,
                    flags: discord_js_1.MessageFlags.Ephemeral,
                    allowedMentions: { users: [] },
                });
                return;
            }
            await User_1.User.updateOne({ discordId: target.id }, { $set: { bumpCountDate: today, bumpCountToday: dejaFait + 1 } });
            const solde = await (0, economy_1.grantYumz)(target.id, rewards_1.REWARDS.bump, 'bump');
            await interaction.reply({
                content: `📈 Bump **${dejaFait + 1}/${rewards_1.REWARDS.bumpMaxPerDay}** : **+${rewards_1.REWARDS.bump} Yumz** pour <@${target.id}>. Solde : **${solde}**.`,
                allowedMentions: { users: [] },
            });
            return;
        }
        // --- Cas simples : boost / voice ---
        const gain = sub === 'boost' ? rewards_1.REWARDS.boostMonth : rewards_1.REWARDS.voice;
        const libelle = sub === 'boost' ? 'Boost du serveur' : 'Succès vocal';
        const solde = await (0, economy_1.grantYumz)(target.id, gain, sub);
        await interaction.reply({
            content: `✨ **${libelle}** : **+${gain} Yumz** pour <@${target.id}>. Solde : **${solde}**.`,
            allowedMentions: { users: [] },
        });
    },
};
