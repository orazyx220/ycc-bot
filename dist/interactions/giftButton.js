"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isGiftButton = isGiftButton;
exports.handleGiftButton = handleGiftButton;
const discord_js_1 = require("discord.js");
const purchase_1 = require("../services/purchase");
const dropMessage_1 = require("../utils/dropMessage");
const PREFIX = 'gift:';
/** Un customId de bouton cadeau ressemble à "gift:carte-mystere". */
function isGiftButton(customId) {
    return customId.startsWith(PREFIX);
}
/**
 * Gère un clic sur « Récupérer » (drop gratuit). Le premier à cliquer gagne
 * l'exemplaire (garanti par la réservation atomique dans claimFreeCard).
 */
async function handleGiftButton(interaction) {
    await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
    const cardId = interaction.customId.slice(PREFIX.length);
    const result = await (0, purchase_1.claimFreeCard)(interaction.user.id, cardId);
    switch (result.status) {
        case 'ok':
            await interaction.editReply({
                content: `🎁 Tu as récupéré **${result.card.name}** — exemplaire **#${result.serial}/${result.card.maxSupply}**, ` +
                    `gratuitement ! 🎉`,
            });
            await (0, dropMessage_1.refreshDropMessage)(interaction.message, cardId);
            return;
        case 'soldout':
            await interaction.editReply({ content: '⏳ Trop tard, cette carte a déjà été récupérée !' });
            await (0, dropMessage_1.refreshDropMessage)(interaction.message, cardId);
            return;
        case 'notfound':
            await interaction.editReply({ content: '❓ Cette carte n’existe plus.' });
            return;
    }
}
