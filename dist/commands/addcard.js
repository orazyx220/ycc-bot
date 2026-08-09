"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addcard = void 0;
const discord_js_1 = require("discord.js");
const Card_1 = require("../database/models/Card");
const rarities_1 = require("../config/rarities");
const cardEmbed_1 = require("../utils/cardEmbed");
const imageUrl_1 = require("../utils/imageUrl");
const messages_1 = require("../config/messages");
/**
 * Transforme un nom en identifiant "slug" : minuscules, sans accents,
 * espaces → tirets. Ex. : "Dragon de Feu" → "dragon-de-feu".
 */
function slugify(name) {
    const slug = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '') // enlève les accents
        .replace(/[^a-z0-9]+/g, '-') // tout le reste → tiret
        .replace(/^-+|-+$/g, '') // pas de tiret au début/fin
        .slice(0, 40);
    return slug || 'carte';
}
/** Garantit un cardId unique en base (ajoute -2, -3… en cas de doublon). */
async function uniqueCardId(base) {
    let candidate = base;
    let n = 2;
    while (await Card_1.Card.findOne({ cardId: candidate })) {
        candidate = `${base}-${n}`;
        n += 1;
    }
    return candidate;
}
/**
 * /addcard — (Admin) crée une nouvelle carte sans toucher au code.
 * L'admin renseigne : nom, rareté, description, image (à joindre), + prix/stock.
 * L'ID de la carte est généré automatiquement à partir du nom.
 */
exports.addcard = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('addcard')
        .setDescription('(Admin) Crée une nouvelle carte.')
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator)
        .addStringOption((o) => o.setName('nom').setDescription('Nom de la carte').setRequired(true).setMaxLength(100))
        .addStringOption((o) => o
        .setName('rarete')
        .setDescription('Rareté de la carte')
        .setRequired(true)
        .addChoices(...rarities_1.RARITIES.map((r) => ({ name: rarities_1.RARITY_INFO[r].label, value: r }))))
        .addStringOption((o) => o
        .setName('description')
        .setDescription('Texte d’ambiance de la carte')
        .setRequired(true)
        .setMaxLength(1000))
        .addStringOption((o) => o
        .setName('lien_image')
        .setDescription('Lien DIRECT .png — upload sur imgur.com puis clic-droit → Copier l’adresse de l’image')
        .setRequired(true))
        .addIntegerOption((o) => o
        .setName('prix')
        .setDescription('Prix en Yumz (défaut : 1000)')
        .setMinValue(0))
        .addIntegerOption((o) => o
        .setName('stock')
        .setDescription('Nombre d’exemplaires (défaut : 1 = unique)')
        .setMinValue(1)),
    async execute(interaction) {
        if (!interaction.memberPermissions?.has(discord_js_1.PermissionFlagsBits.Administrator)) {
            await interaction.reply({
                content: '🚫 Cette commande est réservée aux administrateurs.',
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
            return;
        }
        const nom = interaction.options.getString('nom', true).trim();
        const rarete = interaction.options.getString('rarete', true);
        const description = interaction.options.getString('description', true).trim();
        const lienImage = interaction.options.getString('lien_image', true).trim();
        const prix = interaction.options.getInteger('prix') ?? 1000;
        const stock = interaction.options.getInteger('stock') ?? 1;
        // L'image vient d'un lien permanent (obligatoire).
        if (!(0, imageUrl_1.isValidHttpUrl)(lienImage)) {
            await interaction.reply({
                content: '🔗 Le lien_image doit commencer par http:// ou https://.',
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
            return;
        }
        if (!(0, imageUrl_1.isDirectImageUrl)(lienImage)) {
            await interaction.reply({
                content: '🖼️ Ce lien n’est pas un lien **direct** vers une image (il doit finir par `.png`, `.jpg`, `.gif` ou `.webp`).\n\n' +
                    messages_1.IMGUR_GUIDE,
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
            return;
        }
        const imageUrl = lienImage;
        const cardId = await uniqueCardId(slugify(nom));
        const card = await Card_1.Card.create({
            cardId,
            name: nom,
            description,
            rarity: rarete,
            price: prix,
            imageUrl,
            maxSupply: stock,
            remainingSupply: stock,
        });
        await interaction.reply({
            content: `✅ Carte créée ! ID : \`${cardId}\` — visible dans \`/catalogue\` et \`/boutique\`.\n` +
                '💡 Astuce : pour la faire tomber en drop auto, ajoute-la à la réserve avec `/reserve add`.',
            embeds: [(0, cardEmbed_1.buildCardEmbed)(card)],
            flags: discord_js_1.MessageFlags.Ephemeral,
        });
    },
};
