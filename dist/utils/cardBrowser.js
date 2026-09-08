"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.browseCards = browseCards;
const discord_js_1 = require("discord.js");
const cardEmbed_1 = require("./cardEmbed");
const rarities_1 = require("../config/rarities");
const Card_1 = require("../database/models/Card");
const purchase_1 = require("../services/purchase");
const requirements_1 = require("./requirements");
const PAGE = 25; // un menu déroulant Discord accepte 25 options max
/**
 * Affiche une collection de cartes : l'embed de la carte sélectionnée +
 * un MENU DÉROULANT pour en choisir une directement (25 par page, boutons
 * ◀ / ▶ pour changer de page) + un bouton d'achat optionnel.
 *
 * Pas de fenêtre/modal → aucun avertissement Discord. Réservé à l'auteur.
 */
async function browseCards(interaction, cards, { buy = false, startIndex = 0 } = {}) {
    if (cards.length === 0)
        return; // l'appelant gère le cas vide
    // On démarre sur la carte demandée (ex: résultat de recherche), sinon la 1re.
    let index = Math.min(Math.max(0, startIndex), cards.length - 1);
    const total = cards.length;
    const totalPages = Math.ceil(total / PAGE);
    // Cache des embeds : chaque carte n'est construite qu'une seule fois, puis
    // réutilisée à chaque retour dessus (navigation plus fluide).
    const embedCache = new Array(total);
    const getEmbed = (i) => {
        let e = embedCache[i];
        if (!e) {
            e = (0, cardEmbed_1.buildCardEmbed)(cards[i]).setFooter({ text: `${i + 1}/${total}` });
            embedCache[i] = e;
        }
        return e;
    };
    const render = (frozen = false) => {
        const card = cards[index];
        const embed = getEmbed(index);
        // Fenêtre de 25 cartes contenant la carte affichée.
        const page = Math.floor(index / PAGE);
        const start = page * PAGE;
        const windowCards = cards.slice(start, start + PAGE);
        const select = new discord_js_1.StringSelectMenuBuilder()
            .setCustomId('cb_select')
            .setPlaceholder(`Choisir une carte — page ${page + 1}/${totalPages}`)
            .setDisabled(frozen)
            .addOptions(windowCards.map((c, i) => {
            const info = (0, rarities_1.rarityInfo)(c.rarity);
            const gi = start + i;
            return {
                label: c.name.slice(0, 100),
                description: `${info.label} • ${c.price} Yumz`.slice(0, 100),
                value: String(gi),
                default: gi === index,
                emoji: info.emoji,
            };
        }));
        const navButtons = [
            new discord_js_1.ButtonBuilder()
                .setCustomId('cb_prev')
                .setLabel('◀')
                .setStyle(discord_js_1.ButtonStyle.Secondary)
                .setDisabled(frozen || page === 0),
            new discord_js_1.ButtonBuilder()
                .setCustomId('cb_next')
                .setLabel('▶')
                .setStyle(discord_js_1.ButtonStyle.Secondary)
                .setDisabled(frozen || page === totalPages - 1),
        ];
        if (buy) {
            navButtons.splice(1, 0, new discord_js_1.ButtonBuilder()
                .setCustomId('cb_buy')
                .setLabel(card.remainingSupply <= 0 ? 'Épuisée' : `🛒 Acheter (${card.price})`)
                .setStyle(card.remainingSupply <= 0 ? discord_js_1.ButtonStyle.Secondary : discord_js_1.ButtonStyle.Success)
                .setDisabled(frozen || card.remainingSupply <= 0));
        }
        const selectRow = new discord_js_1.ActionRowBuilder().addComponents(select);
        const buttonRow = new discord_js_1.ActionRowBuilder().addComponents(...navButtons);
        return { embeds: [embed], components: [selectRow, buttonRow] };
    };
    await interaction.reply(render());
    const message = await interaction.fetchReply();
    const collector = message.createMessageComponentCollector({ time: 120_000 });
    collector.on('collect', async (i) => {
        if (i.user.id !== interaction.user.id) {
            await i.reply({ content: 'Ce n’est pas ta commande 🙂', flags: discord_js_1.MessageFlags.Ephemeral });
            return;
        }
        // Choix dans le menu déroulant → saute à la carte.
        if (i.isStringSelectMenu() && i.customId === 'cb_select') {
            const value = i.values[0];
            if (value !== undefined)
                index = Number(value);
            await i.update(render());
            return;
        }
        if (i.isButton()) {
            if (i.customId === 'cb_prev') {
                // On recule d'un LOT de 25 (et on sélectionne la 1re carte du lot).
                const p = Math.max(0, Math.floor(index / PAGE) - 1);
                index = p * PAGE;
                await i.update(render());
                return;
            }
            if (i.customId === 'cb_next') {
                // On avance d'un LOT de 25.
                const p = Math.min(totalPages - 1, Math.floor(index / PAGE) + 1);
                index = p * PAGE;
                await i.update(render());
                return;
            }
            if (i.customId === 'cb_buy' && buy) {
                await i.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
                const card = cards[index];
                const result = await (0, purchase_1.purchaseCard)(interaction.user.id, card.cardId);
                switch (result.status) {
                    case 'ok':
                        await i.editReply({
                            content: `🎉 Acheté **${result.card.name}** #${result.serial}/${result.card.maxSupply} pour **${result.card.price}** Yumz. Solde : **${result.newBalance}**.`,
                        });
                        break;
                    case 'insufficient':
                        await i.editReply({
                            content: `❌ Pas assez de Yumz (il t’en faut **${result.price}**, tu as **${result.balance}**).`,
                        });
                        break;
                    case 'locked':
                        await i.editReply({ content: (0, requirements_1.lockedMessage)(result.requires, result.missing) });
                        break;
                    case 'soldout':
                        await i.editReply({ content: '⏳ Trop tard, cette carte est épuisée !' });
                        break;
                    case 'notfound':
                        await i.editReply({ content: '❓ Carte introuvable.' });
                        break;
                }
                const fresh = await Card_1.Card.findOne({ cardId: card.cardId });
                if (fresh) {
                    cards[index] = fresh;
                    embedCache[index] = undefined; // stock changé → on reconstruira l'embed
                }
                await message.edit(render()).catch(() => { });
                return;
            }
        }
    });
    collector.on('end', async () => {
        await message.edit(render(true)).catch(() => { });
    });
}
