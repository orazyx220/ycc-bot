"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isYumzClaim = isYumzClaim;
exports.handleYumzClaim = handleYumzClaim;
const discord_js_1 = require("discord.js");
const economy_1 = require("../services/economy");
const Transaction_1 = require("../database/models/Transaction");
const PREFIX = 'yumzclaim:';
/** IDs des messages de drop déjà récupérés (anti double-récupération). */
const claimedDrops = new Set();
function isYumzClaim(customId) {
    return customId.startsWith(PREFIX);
}
/**
 * Gère un clic sur « Récupérer » d'un drop de Yumz. Le premier à cliquer gagne.
 * L'anti-concurrence repose sur un Set en mémoire : la vérification + l'ajout
 * sont SYNCHRONES (avant tout await), donc deux clics simultanés ne peuvent pas
 * gagner tous les deux (Node est mono-thread).
 */
async function handleYumzClaim(interaction) {
    const dropId = interaction.message.id;
    if (claimedDrops.has(dropId)) {
        await interaction.reply({
            content: '⏳ Trop tard, ces Yumz ont déjà été récupérés !',
            flags: discord_js_1.MessageFlags.Ephemeral,
        });
        return;
    }
    claimedDrops.add(dropId); // réservé immédiatement (avant tout await)
    const amount = Number.parseInt(interaction.customId.slice(PREFIX.length), 10) || 0;
    await (0, economy_1.addYumz)(interaction.user.id, amount);
    await Transaction_1.Transaction.create({ discordId: interaction.user.id, type: 'yumz_drop', amount });
    await interaction.reply({
        content: `💰 Tu as récupéré **${amount} Yumz** ! 🎉`,
        flags: discord_js_1.MessageFlags.Ephemeral,
    });
    // Met à jour le message : gagnant affiché + bouton retiré.
    await interaction.message
        .edit({
        content: `💰 **Pluie de Yumz** — **${amount} Yumz** récupérés par <@${interaction.user.id}> ! 🎉`,
        components: [],
    })
        .catch(() => { });
}
