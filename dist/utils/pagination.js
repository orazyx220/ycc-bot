"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginateEmbeds = paginateEmbeds;
const discord_js_1 = require("discord.js");
/**
 * Affiche une liste d'Embeds "page par page", avec des boutons ◀ / ▶ et,
 * si `searchKeys` est fourni, un bouton 🔍 qui ouvre une fenêtre de recherche
 * (modal) pour sauter directement à une carte par nom/ID.
 *
 * `searchKeys[i]` = texte cherchable de la page i (ex: "Nom id rareté").
 */
async function paginateEmbeds(interaction, pages, { timeoutMs = 120_000, searchKeys } = {}) {
    // Cas simple : 0 ou 1 page → pas besoin de boutons.
    if (pages.length <= 1) {
        await interaction.reply({ embeds: pages.length === 1 ? [pages[0]] : [] });
        return;
    }
    let index = 0;
    const total = pages.length;
    const canSearch = Array.isArray(searchKeys) && searchKeys.length === total;
    // Construit la rangée de boutons ; `frozen` = tout désactivé (fin de vie).
    const buildRow = (frozen) => {
        const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId('page_prev')
            .setLabel('◀')
            .setStyle(discord_js_1.ButtonStyle.Secondary)
            .setDisabled(frozen || index === 0));
        if (canSearch) {
            row.addComponents(new discord_js_1.ButtonBuilder()
                .setCustomId('page_search')
                .setLabel('Rechercher')
                .setEmoji('🔍')
                .setStyle(discord_js_1.ButtonStyle.Primary)
                .setDisabled(frozen));
        }
        row.addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId('page_next')
            .setLabel('▶')
            .setStyle(discord_js_1.ButtonStyle.Secondary)
            .setDisabled(frozen || index === total - 1));
        return row;
    };
    await interaction.reply({ embeds: [pages[index]], components: [buildRow(false)] });
    const message = await interaction.fetchReply();
    const collector = message.createMessageComponentCollector({
        componentType: discord_js_1.ComponentType.Button,
        time: timeoutMs,
    });
    collector.on('collect', async (button) => {
        // Seul l'auteur de la commande peut naviguer/chercher.
        if (button.user.id !== interaction.user.id) {
            await button.reply({
                content: 'Ces boutons ne sont pas pour toi 🙂 Lance la commande toi-même !',
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
            return;
        }
        // --- Recherche : on ouvre une fenêtre (modal) ---
        if (button.customId === 'page_search' && canSearch) {
            const modal = new discord_js_1.ModalBuilder().setCustomId('page_search_modal').setTitle('🔍 Rechercher une carte');
            const input = new discord_js_1.TextInputBuilder()
                .setCustomId('q')
                .setLabel('Nom ou ID de la carte')
                .setStyle(discord_js_1.TextInputStyle.Short)
                .setRequired(true)
                .setMaxLength(100);
            modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(input));
            await button.showModal(modal);
            const submitted = await button
                .awaitModalSubmit({
                time: 60_000,
                filter: (i) => i.customId === 'page_search_modal' && i.user.id === interaction.user.id,
            })
                .catch(() => null);
            if (!submitted)
                return; // fenêtre fermée / expirée
            const q = submitted.fields.getTextInputValue('q').trim().toLowerCase();
            const found = searchKeys.findIndex((k) => k.toLowerCase().includes(q));
            if (found === -1) {
                await submitted.reply({ content: `🔍 Aucune carte ne correspond à « ${q} ».`, flags: discord_js_1.MessageFlags.Ephemeral });
                return;
            }
            index = found;
            if (submitted.isFromMessage()) {
                await submitted.update({ embeds: [pages[index]], components: [buildRow(false)] });
            }
            else {
                await message.edit({ embeds: [pages[index]], components: [buildRow(false)] });
                await submitted.reply({ content: '✅', flags: discord_js_1.MessageFlags.Ephemeral }).catch(() => { });
            }
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
