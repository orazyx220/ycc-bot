"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildDropComponents = buildDropComponents;
exports.refreshDropMessage = refreshDropMessage;
const discord_js_1 = require("discord.js");
const cardEmbed_1 = require("./cardEmbed");
const Card_1 = require("../database/models/Card");
/**
 * Construit le contenu d'un message de drop : Embed de la carte + un bouton.
 * - Mode 'gift' : bouton bleu « 🎁 Récupérer (gratuit) » → customId `gift:<id>`.
 * - Mode 'buy'  : bouton vert « 🛒 Acheter pour X Yumz » → customId `buy:<id>`.
 * - Épuisée     : bouton gris désactivé « ❌ Épuisée ».
 *
 * Le `customId` encode l'ID de la carte, donc le bouton reste fonctionnel
 * même après un redémarrage du bot.
 */
function buildDropComponents(card) {
    const soldOut = card.remainingSupply <= 0;
    const isGift = card.dropMode === 'gift';
    const button = new discord_js_1.ButtonBuilder()
        .setCustomId(`${isGift ? 'gift' : 'buy'}:${card.cardId}`)
        .setDisabled(soldOut);
    if (soldOut) {
        button.setLabel('Épuisée').setEmoji('❌').setStyle(discord_js_1.ButtonStyle.Secondary);
    }
    else if (isGift) {
        button.setLabel('Récupérer (gratuit)').setEmoji('🎁').setStyle(discord_js_1.ButtonStyle.Primary);
    }
    else {
        button.setLabel(`Acheter pour ${card.price} Yumz`).setEmoji('🛒').setStyle(discord_js_1.ButtonStyle.Success);
    }
    const row = new discord_js_1.ActionRowBuilder().addComponents(button);
    return { embeds: [(0, cardEmbed_1.buildCardEmbed)(card)], components: [row] };
}
/**
 * Recharge la carte depuis la base et met à jour le message de drop d'origine
 * (compteur de stock + état du bouton). Partagé par l'achat et le cadeau.
 */
async function refreshDropMessage(message, cardId) {
    const fresh = await Card_1.Card.findOne({ cardId });
    if (!fresh)
        return;
    await message.edit(buildDropComponents(fresh)).catch(() => {
        // Message supprimé/trop ancien : on ignore, ce n'est pas bloquant.
    });
}
