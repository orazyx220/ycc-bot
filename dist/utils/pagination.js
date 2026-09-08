"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginateEmbeds = paginateEmbeds;
const discord_js_1 = require("discord.js");
/**
 * Affiche une liste d'Embeds "page par page", avec des boutons ◀ / ▶.
 * Réutilisable (ex: /inventaire). Seul l'auteur peut naviguer ; les boutons
 * sont désactivés après `timeoutMs` d'inactivité.
 */
async function paginateEmbeds(interaction, pages, { timeoutMs = 120_000 } = {}) {
    if (pages.length <= 1) {
        await interaction.reply({ embeds: pages.length === 1 ? [pages[0]] : [] });
        return;
    }
    let index = 0;
    const total = pages.length;
    const buildRow = (frozen) => new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId('page_prev')
        .setLabel('◀ Précédent')
        .setStyle(discord_js_1.ButtonStyle.Secondary)
        .setDisabled(frozen || index === 0), new discord_js_1.ButtonBuilder()
        .setCustomId('page_next')
        .setLabel('Suivant ▶')
        .setStyle(discord_js_1.ButtonStyle.Secondary)
        .setDisabled(frozen || index === total - 1));
    await interaction.reply({ embeds: [pages[index]], components: [buildRow(false)] });
    const message = await interaction.fetchReply();
    const collector = message.createMessageComponentCollector({
        componentType: discord_js_1.ComponentType.Button,
        time: timeoutMs,
    });
    collector.on('collect', async (button) => {
        if (button.user.id !== interaction.user.id) {
            await button.reply({
                content: 'Ces boutons ne sont pas pour toi 🙂 Lance la commande toi-même !',
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
            return;
        }
        if (button.customId === 'page_prev')
            index = Math.max(0, index - 1);
        else if (button.customId === 'page_next')
            index = Math.min(total - 1, index + 1);
        await button.update({ embeds: [pages[index]], components: [buildRow(false)] });
    });
    collector.on('end', async () => {
        await message.edit({ components: [buildRow(true)] }).catch(() => { });
    });
}
