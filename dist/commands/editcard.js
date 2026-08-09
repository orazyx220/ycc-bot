"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.editcard = void 0;
const discord_js_1 = require("discord.js");
const Card_1 = require("../database/models/Card");
const rarities_1 = require("../config/rarities");
const cardEmbed_1 = require("../utils/cardEmbed");
const imageUrl_1 = require("../utils/imageUrl");
const messages_1 = require("../config/messages");
/**
 * /editcard <id> [champs…] — (Admin) modifie une carte existante.
 * Seuls les champs renseignés sont changés. L'ID de la carte ne change jamais
 * (pour ne pas casser les inventaires qui la référencent).
 * `restock` ajoute des exemplaires (au stock total ET au stock disponible).
 */
exports.editcard = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('editcard')
        .setDescription('(Admin) Modifie une carte existante.')
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator)
        .addStringOption((o) => o.setName('id').setDescription('ID de la carte à modifier').setRequired(true))
        .addStringOption((o) => o.setName('nom').setDescription('Nouveau nom').setMaxLength(100))
        .addStringOption((o) => o
        .setName('rarete')
        .setDescription('Nouvelle rareté')
        .addChoices(...rarities_1.RARITIES.map((r) => ({ name: rarities_1.RARITY_INFO[r].label, value: r }))))
        .addStringOption((o) => o.setName('description').setDescription('Nouvelle description').setMaxLength(1000))
        .addStringOption((o) => o.setName('lien_image').setDescription('Nouveau lien direct .png (voir /help pour la méthode Imgur)'))
        .addIntegerOption((o) => o.setName('prix').setDescription('Nouveau prix en Yumz').setMinValue(0))
        .addIntegerOption((o) => o
        .setName('restock')
        .setDescription('Ajoute N exemplaires (stock total + disponible)')
        .setMinValue(1)),
    async execute(interaction) {
        if (!interaction.memberPermissions?.has(discord_js_1.PermissionFlagsBits.Administrator)) {
            await interaction.reply({
                content: '🚫 Cette commande est réservée aux administrateurs.',
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
            return;
        }
        const id = interaction.options.getString('id', true).trim();
        const card = await Card_1.Card.findOne({ cardId: id });
        if (!card) {
            await interaction.reply({
                content: `❓ Aucune carte avec l’ID \`${id}\`.`,
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
            return;
        }
        const changes = [];
        const nom = interaction.options.getString('nom');
        if (nom) {
            card.name = nom.trim();
            changes.push('nom');
        }
        const rarete = interaction.options.getString('rarete');
        if (rarete) {
            card.rarity = rarete;
            changes.push('rareté');
        }
        const description = interaction.options.getString('description');
        if (description !== null) {
            card.description = description.trim();
            changes.push('description');
        }
        const lienImage = interaction.options.getString('lien_image');
        if (lienImage) {
            const url = lienImage.trim();
            if (!(0, imageUrl_1.isValidHttpUrl)(url) || !(0, imageUrl_1.isDirectImageUrl)(url)) {
                await interaction.reply({
                    content: '🖼️ Le `lien_image` doit être un lien **direct** vers une image (…/xxx.png).\n\n' +
                        messages_1.IMGUR_GUIDE,
                    flags: discord_js_1.MessageFlags.Ephemeral,
                });
                return;
            }
            card.imageUrl = url;
            changes.push('image');
        }
        const prix = interaction.options.getInteger('prix');
        if (prix !== null) {
            card.price = prix;
            changes.push('prix');
        }
        const restock = interaction.options.getInteger('restock');
        if (restock !== null) {
            card.maxSupply += restock;
            card.remainingSupply += restock;
            changes.push(`+${restock} stock`);
        }
        if (changes.length === 0) {
            await interaction.reply({
                content: 'ℹ️ Rien à modifier : renseigne au moins un champ à changer.',
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
            return;
        }
        await card.save();
        await interaction.reply({
            content: `✅ Carte \`${id}\` modifiée (${changes.join(', ')}).`,
            embeds: [(0, cardEmbed_1.buildCardEmbed)(card)],
            flags: discord_js_1.MessageFlags.Ephemeral,
        });
    },
};
