import {
  SlashCommandBuilder,
  MessageFlags,
  type ChatInputCommandInteraction,
} from 'discord.js';
import type { Command } from '../types';
import { User, getOrCreateUser } from '../database/models/User';
import { Transaction } from '../database/models/Transaction';
import { WORK, WORK_MESSAGES } from '../config/work';
import { formatDuration } from '../utils/time';

/**
 * /travailler — petit gain de Yumz aléatoire, avec un cooldown (1 h).
 * Anti double-clic : mise à jour atomique conditionnée au cooldown.
 */
export const travailler: Command = {
  data: new SlashCommandBuilder()
    .setName('travailler')
    .setDescription('Travaille pour gagner quelques Yumz (toutes les heures).'),

  async execute(interaction: ChatInputCommandInteraction) {
    const user = await getOrCreateUser(interaction.user.id);
    const now = Date.now();
    const last = user.workLastClaim?.getTime() ?? null;

    if (last !== null && now - last < WORK.cooldownMs) {
      const remaining = last + WORK.cooldownMs - now;
      await interaction.reply({
        content: `😴 Tu es fatigué·e. Reviens travailler dans **${formatDuration(remaining)}**.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const reward = Math.floor(Math.random() * (WORK.max - WORK.min + 1)) + WORK.min;
    const cutoff = new Date(now - WORK.cooldownMs);

    const credited = await User.findOneAndUpdate(
      {
        discordId: interaction.user.id,
        $or: [{ workLastClaim: null }, { workLastClaim: { $lte: cutoff } }],
      },
      { $inc: { yumz: reward }, $set: { workLastClaim: new Date(now) } },
      { returnDocument: 'after' },
    );

    if (!credited) {
      await interaction.reply({
        content: '😴 Tu viens déjà de travailler.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await Transaction.create({ discordId: interaction.user.id, type: 'work', amount: reward });

    const scenario = WORK_MESSAGES[Math.floor(Math.random() * WORK_MESSAGES.length)];
    await interaction.reply(
      `${scenario}\n💰 Tu gagnes **+${reward} Yumz** ! Nouveau solde : **${credited.yumz}** Yumz.`,
    );
  },
};
