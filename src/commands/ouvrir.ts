import {
  SlashCommandBuilder,
  EmbedBuilder,
  MessageFlags,
  type ChatInputCommandInteraction,
} from 'discord.js';
import type { Command } from '../types';
import { openBooster } from '../services/booster';
import { BOOSTER_PRICE } from '../config/booster';
import { rarityInfo } from '../config/rarities';

/**
 * /ouvrir — ouvre un booster (coûte des Yumz) et révèle une carte tirée
 * au hasard selon les probabilités de rareté.
 */
export const ouvrir: Command = {
  data: new SlashCommandBuilder()
    .setName('ouvrir')
    .setDescription(`Ouvre un booster (${BOOSTER_PRICE} Yumz) et tire une carte au hasard.`),

  async execute(interaction: ChatInputCommandInteraction) {
    const result = await openBooster(interaction.user.id);

    switch (result.status) {
      case 'insufficient':
        await interaction.reply({
          content: `❌ Il te faut **${result.price}** Yumz pour ouvrir un booster (tu as **${result.balance}**). Fais \`/daily\` !`,
          flags: MessageFlags.Ephemeral,
        });
        return;

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
