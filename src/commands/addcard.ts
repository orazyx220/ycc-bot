import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
  type ChatInputCommandInteraction,
} from 'discord.js';
import type { Command } from '../types';
import { Card } from '../database/models/Card';
import { RARITIES, RARITY_INFO, type Rarity } from '../config/rarities';
import { buildCardEmbed } from '../utils/cardEmbed';
import { isValidHttpUrl, isDirectImageUrl } from '../utils/imageUrl';

/**
 * Transforme un nom en identifiant "slug" : minuscules, sans accents,
 * espaces → tirets. Ex. : "Dragon de Feu" → "dragon-de-feu".
 */
function slugify(name: string): string {
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
async function uniqueCardId(base: string): Promise<string> {
  let candidate = base;
  let n = 2;
  while (await Card.findOne({ cardId: candidate })) {
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
export const addcard: Command = {
  data: new SlashCommandBuilder()
    .setName('addcard')
    .setDescription('(Admin) Crée une nouvelle carte.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((o) =>
      o.setName('nom').setDescription('Nom de la carte').setRequired(true).setMaxLength(100),
    )
    .addStringOption((o) =>
      o
        .setName('rarete')
        .setDescription('Rareté de la carte')
        .setRequired(true)
        .addChoices(...RARITIES.map((r) => ({ name: RARITY_INFO[r].label, value: r }))),
    )
    .addStringOption((o) =>
      o
        .setName('description')
        .setDescription('Texte d’ambiance de la carte')
        .setRequired(true)
        .setMaxLength(1000),
    )
    .addStringOption((o) =>
      o
        .setName('lien_image')
        .setDescription('Lien PERMANENT de l’image (ex: https://i.imgur.com/xxxx.png)')
        .setRequired(true),
    )
    .addIntegerOption((o) =>
      o
        .setName('prix')
        .setDescription('Prix en Yumz (défaut : 1000)')
        .setMinValue(0),
    )
    .addIntegerOption((o) =>
      o
        .setName('stock')
        .setDescription('Nombre d’exemplaires (défaut : 1 = unique)')
        .setMinValue(1),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({
        content: '🚫 Cette commande est réservée aux administrateurs.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const nom = interaction.options.getString('nom', true).trim();
    const rarete = interaction.options.getString('rarete', true) as Rarity;
    const description = interaction.options.getString('description', true).trim();
    const lienImage = interaction.options.getString('lien_image', true).trim();
    const prix = interaction.options.getInteger('prix') ?? 1000;
    const stock = interaction.options.getInteger('stock') ?? 1;

    // L'image vient d'un lien permanent (obligatoire).
    if (!isValidHttpUrl(lienImage)) {
      await interaction.reply({
        content: '🔗 Le lien_image doit commencer par http:// ou https://.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    if (!isDirectImageUrl(lienImage)) {
      await interaction.reply({
        content:
          '🖼️ Ce lien n’est pas un lien **direct** vers une image (il doit finir par `.png`, `.jpg`, `.gif` ou `.webp`).\n' +
          '👉 Sur Imgur : **clic droit sur l’image → « Copier l’adresse de l’image »** (tu obtiendras `https://i.imgur.com/….png`).\n' +
          'Le lien `imgur.com/a/…` est la *page*, pas l’image.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    const imageUrl = lienImage;

    const cardId = await uniqueCardId(slugify(nom));

    const card = await Card.create({
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
      content:
        `✅ Carte créée ! ID : \`${cardId}\` — visible dans \`/catalogue\` et \`/boutique\`.\n` +
        '💡 Astuce : pour la faire tomber en drop auto, ajoute-la à la réserve avec `/reserve add`.',
      embeds: [buildCardEmbed(card)],
      flags: MessageFlags.Ephemeral,
    });
  },
};
