"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parier = void 0;
const discord_js_1 = require("discord.js");
const games_1 = require("../config/games");
const games_2 = require("../services/games");
/** Option "mise" commune aux 3 jeux. */
function miseOption(o) {
    return o
        .setName('mise')
        .setDescription(`Yumz à parier (${games_1.GAMES.minBet}–${games_1.GAMES.maxBet})`)
        .setRequired(true)
        .setMinValue(games_1.GAMES.minBet)
        .setMaxValue(games_1.GAMES.maxBet);
}
/**
 * /parier — mini-jeux de pari :
 *   /parier pileouface <mise> <choix>
 *   /parier des <mise>
 *   /parier machine <mise>
 */
exports.parier = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('parier')
        .setDescription('Mini-jeux de pari : mise tes Yumz et tente ta chance !')
        .addSubcommand((s) => s
        .setName('pileouface')
        .setDescription('Pile ou face — double ta mise ou perds tout.')
        .addIntegerOption(miseOption)
        .addStringOption((o) => o
        .setName('choix')
        .setDescription('Ton pari')
        .setRequired(true)
        .addChoices({ name: 'Pile', value: 'pile' }, { name: 'Face', value: 'face' })))
        .addSubcommand((s) => s
        .setName('des')
        .setDescription('Dés — ton dé contre celui du bot, le plus haut gagne.')
        .addIntegerOption(miseOption))
        .addSubcommand((s) => s
        .setName('machine')
        .setDescription('Machine à sous — aligne les symboles pour gagner gros.')
        .addIntegerOption(miseOption)),
    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const bet = interaction.options.getInteger('mise', true);
        // --- Pile ou face ---
        if (sub === 'pileouface') {
            const choix = interaction.options.getString('choix', true);
            const res = await (0, games_2.playCoinflip)(interaction.user.id, bet, choix);
            if (res.status === 'insufficient') {
                await interaction.reply({ content: `❌ Pas assez de Yumz (tu as **${res.balance}**).`, flags: discord_js_1.MessageFlags.Ephemeral });
                return;
            }
            const emoji = res.result === 'pile' ? '🪙' : '💿';
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(res.win ? 0x2ecc71 : 0xe74c3c)
                .setTitle(`${emoji} Pile ou face — ${res.result.toUpperCase()}`)
                .setDescription(res.win
                ? `🎉 Gagné ! **+${res.bet} Yumz**.`
                : `😢 Perdu... **-${res.bet} Yumz**.`)
                .setFooter({ text: `Solde : ${res.newBalance} Yumz` });
            await interaction.reply({ embeds: [embed] });
            return;
        }
        // --- Dés ---
        if (sub === 'des') {
            const res = await (0, games_2.playDice)(interaction.user.id, bet);
            if (res.status === 'insufficient') {
                await interaction.reply({ content: `❌ Pas assez de Yumz (tu as **${res.balance}**).`, flags: discord_js_1.MessageFlags.Ephemeral });
                return;
            }
            const verdict = res.outcome === 'win' ? `🎉 Gagné ! **+${res.bet} Yumz**.` :
                res.outcome === 'tie' ? '🤝 Égalité — mise remboursée.' :
                    `😢 Perdu... **-${res.bet} Yumz**.`;
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(res.outcome === 'win' ? 0x2ecc71 : res.outcome === 'tie' ? 0xf1c40f : 0xe74c3c)
                .setTitle('🎲 Lancer de dés')
                .setDescription(`Toi : **${res.player}**  vs  Bot : **${res.bot}**\n${verdict}`)
                .setFooter({ text: `Solde : ${res.newBalance} Yumz` });
            await interaction.reply({ embeds: [embed] });
            return;
        }
        // --- Machine à sous ---
        if (sub === 'machine') {
            const res = await (0, games_2.playSlots)(interaction.user.id, bet);
            if (res.status === 'insufficient') {
                await interaction.reply({ content: `❌ Pas assez de Yumz (tu as **${res.balance}**).`, flags: discord_js_1.MessageFlags.Ephemeral });
                return;
            }
            const verdict = res.won > 0
                ? `🎉 Gagné ! Mise **${res.bet}** × **${res.multiplier}** = tu récupères **${res.won} Yumz** (gain net **+${res.won - res.bet}**).`
                : `😢 Perdu... **-${res.bet} Yumz**.`;
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(res.won > 0 ? 0x2ecc71 : 0xe74c3c)
                .setTitle('🎰 Machine à sous')
                .setDescription(`[ ${res.reels.join(' | ')} ]\n${verdict}`)
                .setFooter({ text: `Solde : ${res.newBalance} Yumz` });
            await interaction.reply({ embeds: [embed] });
            return;
        }
    },
};
