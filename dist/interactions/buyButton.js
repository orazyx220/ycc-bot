"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isBuyButton = isBuyButton;
exports.handleBuyButton = handleBuyButton;
const discord_js_1 = require("discord.js");
const purchase_1 = require("../services/purchase");
const dropMessage_1 = require("../utils/dropMessage");
const PREFIX = 'buy:';
/** Un customId de bouton d'achat ressemble à "buy:ycc-originel". */
function isBuyButton(customId) {
    return customId.startsWith(PREFIX);
}
/**
 * Gère un clic sur « Acheter ». Réponse EPHEMERAL (visible du seul acheteur),
 * puis rafraîchit le message de drop (stock + bouton).
 */
async function handleBuyButton(interaction) {
    // On accuse réception tout de suite (Discord exige une réponse < 3 s).
    await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
    const cardId = interaction.customId.slice(PREFIX.length);
    const result = await (0, purchase_1.purchaseCard)(interaction.user.id, cardId);
    switch (result.status) {
        case 'ok':
            await interaction.editReply({
                content: `🎉 Tu as acheté **${result.card.name}** — exemplaire **#${result.serial}/${result.card.maxSupply}** ` +
                    `pour **${result.card.price}** Yumz !\nNouveau solde : **${result.newBalance}** Yumz.`,
            });
            await (0, dropMessage_1.refreshDropMessage)(interaction.message, cardId);
            return;
        case 'soldout':
            await interaction.editReply({ content: '⏳ Trop tard, cette carte a déjà été achetée !' });
            await (0, dropMessage_1.refreshDropMessage)(interaction.message, cardId);
            return;
        case 'insufficient':
            await interaction.editReply({
                content: `❌ Pas assez de Yumz. Il t’en faut **${result.price}**, tu as **${result.balance}**. ` +
                    `Récupère-en avec \`/daily\` ou en discutant !`,
            });
            return;
        case 'notfound':
            await interaction.editReply({ content: '❓ Cette carte n’existe plus.' });
            return;
    }
}
