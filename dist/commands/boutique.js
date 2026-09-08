"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.boutique = void 0;
const discord_js_1 = require("discord.js");
const Card_1 = require("../database/models/Card");
const rarities_1 = require("../config/rarities");
const cardEmbed_1 = require("../utils/cardEmbed");
const purchase_1 = require("../services/purchase");
const requirements_1 = require("../utils/requirements");
/**
 * /boutique — feuillette les cartes en stock et achète celle affichée avec le
 * bouton « 🛒 Acheter ». Un bouton 🔍 ouvre une fenêtre de recherche pour sauter
 * à une carte par nom/ID. Navigation, achat et recherche réservés à l'auteur.
 */
exports.boutique = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('boutique')
        .setDescription('Achète des cartes avec tes Yumz (recherche 🔍 intégrée).'),
    async execute(interaction) {
        const rank = new Map(rarities_1.RARITIES.map((r, i) => [r, i]));
        const cards = await Card_1.Card.find({ remainingSupply: { $gt: 0 } });
        cards.sort((a, b) => (rank.get(b.rarity) ?? 0) - (rank.get(a.rarity) ?? 0) || b.price - a.price);
        if (cards.length === 0) {
            await interaction.reply({ content: '🛒 La boutique est vide pour l’instant.' });
            return;
        }
        let index = 0;
        const total = cards.length;
        // Construit l'affichage de la carte courante + les boutons.
        const render = (frozen = false) => {
            const card = cards[index];
            const soldOut = card.remainingSupply <= 0;
            const embed = (0, cardEmbed_1.buildCardEmbed)(card).setFooter({
                text: `ID : ${card.cardId}  •  ${index + 1}/${total}`,
            });
            const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
                .setCustomId('shop_prev')
                .setLabel('◀')
                .setStyle(discord_js_1.ButtonStyle.Secondary)
                .setDisabled(frozen || index === 0), new discord_js_1.ButtonBuilder()
                .setCustomId('shop_search')
                .setEmoji('🔍')
                .setStyle(discord_js_1.ButtonStyle.Primary)
                .setDisabled(frozen), new discord_js_1.ButtonBuilder()
                .setCustomId('shop_buy')
                .setLabel(soldOut ? 'Épuisée' : `🛒 Acheter (${card.price})`)
                .setStyle(soldOut ? discord_js_1.ButtonStyle.Secondary : discord_js_1.ButtonStyle.Success)
                .setDisabled(frozen || soldOut), new discord_js_1.ButtonBuilder()
                .setCustomId('shop_next')
                .setLabel('▶')
                .setStyle(discord_js_1.ButtonStyle.Secondary)
                .setDisabled(frozen || index === total - 1));
            return { embeds: [embed], components: [row] };
        };
        await interaction.reply(render());
        const message = await interaction.fetchReply();
        const collector = message.createMessageComponentCollector({
            componentType: discord_js_1.ComponentType.Button,
            time: 120_000,
        });
        collector.on('collect', async (btn) => {
            if (btn.user.id !== interaction.user.id) {
                await btn.reply({
                    content: 'Cette boutique n’est pas la tienne 🙂 Lance `/boutique` toi-même !',
                    flags: discord_js_1.MessageFlags.Ephemeral,
                });
                return;
            }
            // Navigation
            if (btn.customId === 'shop_prev') {
                index = Math.max(0, index - 1);
                await btn.update(render());
                return;
            }
            if (btn.customId === 'shop_next') {
                index = Math.min(total - 1, index + 1);
                await btn.update(render());
                return;
            }
            // Recherche : fenêtre (modal) → saute à la carte trouvée
            if (btn.customId === 'shop_search') {
                const modal = new discord_js_1.ModalBuilder().setCustomId('shop_search_modal').setTitle('🔍 Rechercher une carte');
                const input = new discord_js_1.TextInputBuilder()
                    .setCustomId('q')
                    .setLabel('Nom ou ID de la carte')
                    .setStyle(discord_js_1.TextInputStyle.Short)
                    .setRequired(true)
                    .setMaxLength(100);
                modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(input));
                await btn.showModal(modal);
                const submitted = await btn
                    .awaitModalSubmit({
                    time: 60_000,
                    filter: (i) => i.customId === 'shop_search_modal' && i.user.id === interaction.user.id,
                })
                    .catch(() => null);
                if (!submitted)
                    return;
                const q = submitted.fields.getTextInputValue('q').trim().toLowerCase();
                const found = cards.findIndex((c) => c.name.toLowerCase().includes(q) || c.cardId.toLowerCase().includes(q));
                if (found === -1) {
                    await submitted.reply({ content: `🔍 Aucune carte en stock ne correspond à « ${q} ».`, flags: discord_js_1.MessageFlags.Ephemeral });
                    return;
                }
                index = found;
                if (submitted.isFromMessage()) {
                    await submitted.update(render());
                }
                else {
                    await message.edit(render());
                    await submitted.reply({ content: '✅', flags: discord_js_1.MessageFlags.Ephemeral }).catch(() => { });
                }
                return;
            }
            // Achat de la carte affichée
            if (btn.customId === 'shop_buy') {
                await btn.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
                const card = cards[index];
                const result = await (0, purchase_1.purchaseCard)(interaction.user.id, card.cardId);
                switch (result.status) {
                    case 'ok':
                        await btn.editReply({
                            content: `🎉 Acheté **${result.card.name}** #${result.serial}/${result.card.maxSupply} pour **${result.card.price}** Yumz. Solde : **${result.newBalance}**.`,
                        });
                        break;
                    case 'insufficient':
                        await btn.editReply({
                            content: `❌ Pas assez de Yumz (il t’en faut **${result.price}**, tu as **${result.balance}**).`,
                        });
                        break;
                    case 'locked':
                        await btn.editReply({ content: (0, requirements_1.lockedMessage)(result.requires, result.missing) });
                        break;
                    case 'soldout':
                        await btn.editReply({ content: '⏳ Trop tard, cette carte est épuisée !' });
                        break;
                    case 'notfound':
                        await btn.editReply({ content: '❓ Carte introuvable.' });
                        break;
                }
                const fresh = await Card_1.Card.findOne({ cardId: card.cardId });
                if (fresh)
                    cards[index] = fresh;
                await message.edit(render()).catch(() => { });
                return;
            }
        });
        collector.on('end', async () => {
            await message.edit(render(true)).catch(() => { });
        });
    },
};
