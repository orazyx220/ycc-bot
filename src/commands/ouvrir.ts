import {
  SlashCommandBuilder,
  EmbedBuilder,
  MessageFlags,
  type ChatInputCommandInteraction,
} from 'discord.js';
import type { Command } from '../types';
import { openBooster } from '../services/booster';
import { BOOSTER_PRICE, BOOSTER_WEEKLY_LIMIT } from '../config/booster';
import { rarityInfo } from '../config/rarities';

/**
 * /ouvrir — ouvre un booster (coûte des Yumz) et révèle une carte tirée
 * au hasard selon les probabilités de rareté.
 */
export const ouvrir: Command = {
  data: new SlashCommandBuilder()
    .setName('ouvrir')
    .setDescription(
      `Ouvre un booster (${BOOSTER_PRICE} Yumz, max ${BOOSTER_WEEKLY_LIMIT}/semaine) et tire une carte.`,
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const result = await openBooster(interaction.user.id);

    switch (result.status) {
      case 'insufficient':
        await interaction.reply({
          content: `❌ Il te faut **${result.price}** Yumz pour ouvrir un booster (tu as **${result.balance}**). Fais \`/daily\` !`,
          flags: MessageFlags.Ephemeral,
        });
        return;

      case 'limited': {
        const unix = Math.floor(result.nextAt.getTime() / 1000);
        await interaction.reply({
          content:
            `⏳ Tu as atteint la limite de **${result.limit} boosters par semaine**.\n` +
            `Prochaine ouverture disponible <t:${unix}:R> (le <t:${unix}:F>).`,
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      case 'empty':
        await interaction.reply({
          content: '📭 Aucune carte n’existe encore. Reviens plus tard !',
          flags: MessageFlags.Ephemeral,
        });
        return;

      case 'ok': {
        const info = rarityInfo(result.card.rarity);
        const embed = new EmbedBuilder()
          .setColor(result.card.borderColor ?? info.color)
          .setTitle('🎴 Booster ouvert !')
          .setDescription(
            `Tu as tiré **${result.card.name}** ${info.emoji} *(${info.label})* !\n` +
              `💰 Solde restant : **${result.newBalance}** Yumz.`,
          )
          .setImage(result.card.imageUrl)
          .setFooter({ text: `ID : ${result.card.cardId}` });

        await interaction.reply({ embeds: [embed] });
        return;
      }
    }
  },
};
