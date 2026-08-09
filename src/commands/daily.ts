import {
  SlashCommandBuilder,
  MessageFlags,
  type ChatInputCommandInteraction,
} from 'discord.js';
import type { Command } from '../types';
import { User, getOrCreateUser } from '../database/models/User';
import { Transaction } from '../database/models/Transaction';
import { REWARDS } from '../config/rewards';
import { DAY_MS, formatDuration } from '../utils/time';

/**
 * /daily — donne 550 Yumz, une fois toutes les 24 h.
 *
 * Anti double-clic : au lieu de "lire puis écrire" (ce qui laisse une faille
 * si deux commandes arrivent en même temps), on fait UNE seule opération
 * atomique `findOneAndUpdate` qui n'agit QUE si le délai de 24 h est passé.
 * MongoDB garantit qu'une seule des deux requêtes concurrentes réussira.
 */
export const daily: Command = {
  data: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Réclame tes 550 Yumz journaliers.'),

  async execute(interaction: ChatInputCommandInteraction) {
    // On s'assure d'abord que le membre existe en base.
    await getOrCreateUser(interaction.user.id);

    const now = new Date();
    const cutoff = new Date(now.getTime() - DAY_MS); // "il y a 24 h"

    // On tente le crédit : réussit seulement si jamais réclamé,
    // OU si le dernier /daily date de plus de 24 h.
    const credited = await User.findOneAndUpdate(
      {
        discordId: interaction.user.id,
        $or: [{ dailyLastClaim: null }, { dailyLastClaim: { $lte: cutoff } }],
      },
      {
        $inc: { yumz: REWARDS.daily },
        $set: { dailyLastClaim: now },
      },
      { returnDocument: 'after' }, // renvoie le document APRÈS mise à jour
    );

    // Cas 1 : le crédit a réussi.
    if (credited) {
      await Transaction.create({
        discordId: interaction.user.id,
        type: 'daily',
        amount: REWARDS.daily,
      });
      await interaction.reply(
        `🎁 **+${REWARDS.daily} Yumz** récupérés ! Ton nouveau solde : **${credited.yumz}** Yumz.\nReviens dans 24 h. ⏰`,
      );
      return;
    }

    // Cas 2 : déjà réclamé récemment → on calcule le temps restant.
    const user = await getOrCreateUser(interaction.user.id);
    const lastClaim = user.dailyLastClaim?.getTime() ?? 0;
    const remaining = lastClaim + DAY_MS - now.getTime();

    await interaction.reply({
      content: `⏳ Tu as déjà réclamé ton /daily. Reviens dans **${formatDuration(remaining)}**.`,
      flags: MessageFlags.Ephemeral, // message visible par toi seul
    });
  },
};
