"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ouvrir = void 0;
const discord_js_1 = require("discord.js");
const booster_1 = require("../services/booster");
const booster_2 = require("../config/booster");
const rarities_1 = require("../config/rarities");
/**
 * /ouvrir — ouvre un booster (coûte des Yumz) et révèle une carte tirée
 * au hasard selon les probabilités de rareté.
 */
exports.ouvrir = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('ouvrir')
        .setDescription(`Ouvre un booster (${booster_2.BOOSTER_PRICE} Yumz) et tire une carte au hasard.`),
    async execute(interaction) {
        const result = await (0, booster_1.openBooster)(interaction.user.id);
        switch (result.status) {
            case 'insufficient':
                await interaction.reply({
                    content: `❌ Il te faut **${result.price}** Yumz pour ouvrir un booster (tu as **${result.balance}**). Fais \`/daily\` !`,
                    flags: discord_js_1.MessageFlags.Ephemeral,
                });
                return;
            case 'empty':
                await interaction.reply({
                    content: '📭 Aucune carte n’existe encore. Reviens plus tard !',
                    flags: discord_js_1.MessageFlags.Ephemeral,
                });
                return;
            case 'ok': {
                const info = (0, rarities_1.rarityInfo)(result.card.rarity);
                const embed = new discord_js_1.EmbedBuilder()
                    .setColor(result.card.borderColor ?? info.color)
                    .setTitle('🎴 Booster ouvert !')
                    .setDescription(`Tu as tiré **${result.card.name}** ${info.emoji} *(${info.label})* !\n` +
                    `💰 Solde restant : **${result.newBalance}** Yumz.`)
                    .setImage(result.card.imageUrl)
                    .setFooter({ text: `ID : ${result.card.cardId}` });
                await interaction.reply({ embeds: [embed] });
                return;
            }
        }
    },
};
