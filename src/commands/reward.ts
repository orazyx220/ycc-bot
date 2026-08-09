import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
  type ChatInputCommandInteraction,
} from 'discord.js';
import type { Command } from '../types';
import { User, getOrCreateUser } from '../database/models/User';
import { grantYumz } from '../services/economy';
import { REWARDS, levelReward } from '../config/rewards';

/** Date du jour au format 'AAAA-MM-JJ' (UTC), pour le compteur de bumps. */
function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * /reward — (Admin) attribue une récompense en appliquant automatiquement
 * le barème des Yumz. Sous-commandes :
 *   /reward bump  <membre>            → 500  (max 3/jour)
 *   /reward boost <membre>            → 5000 (1 mois de boost)
 *   /reward voice <membre>            → 2000 (succès vocal)
 *   /reward level <membre> <niveau>   → niveau×100+500 (paliers 10→100)
 */
export const reward: Command = {
  data: new SlashCommandBuilder()
    .setName('reward')
    .setDescription('(Admin) Attribue une récompense selon le barème YCC.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((s) =>
      s
        .setName('bump')
        .setDescription('500 Yumz (max 3 fois par jour)')
        .addUserOption((o) => o.setName('membre').setDescription('Membre').setRequired(true)),
    )
    .addSubcommand((s) =>
      s
        .setName('boost')
        .setDescription('5000 Yumz (1 mois de boost du serveur)')
        .addUserOption((o) => o.setName('membre').setDescription('Membre').setRequired(true)),
    )
    .addSubcommand((s) =>
      s
        .setName('voice')
        .setDescription('2000 Yumz (succès vocal global)')
        .addUserOption((o) => o.setName('membre').setDescription('Membre').setRequired(true)),
    )
    .addSubcommand((s) =>
      s
        .setName('level')
        .setDescription('Succès de niveau (paliers 10, 20, … 100)')
        .addUserOption((o) => o.setName('membre').setDescription('Membre').setRequired(true))
        .addIntegerOption((o) =>
          o
            .setName('niveau')
            .setDescription('Palier atteint (10, 20, 30, … 100)')
            .setRequired(true)
            .setMinValue(10)
            .setMaxValue(100),
        ),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({
        content: '🚫 Cette commande est réservée aux administrateurs.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const sub = interaction.options.getSubcommand();
    const target = interaction.options.getUser('membre', true);

    // --- Cas particulier : le niveau doit être un palier de 10 ---
    if (sub === 'level') {
      const niveau = interaction.options.getInteger('niveau', true);
      if (niveau % 10 !== 0) {
        await interaction.reply({
          content: '❔ Le niveau doit être un palier de 10 (10, 20, 30, … 100).',
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      const gain = levelReward(niveau);
      const solde = await grantYumz(target.id, gain, 'level', `niveau ${niveau}`);
      await interaction.reply({
        content: `🏆 Succès **niveau ${niveau}** : **+${gain} Yumz** pour <@${target.id}>. Solde : **${solde}**.`,
        allowedMentions: { users: [] },
      });
      return;
    }

    // --- Cas particulier : le bump est limité à 3 par jour ---
    if (sub === 'bump') {
      const today = todayKey();
      const user = await getOrCreateUser(target.id);
      const dejaFait = user.bumpCountDate === today ? user.bumpCountToday : 0;

      if (dejaFait >= REWARDS.bumpMaxPerDay) {
        await interaction.reply({
          content: `⛔ <@${target.id}> a déjà atteint la limite de **${REWARDS.bumpMaxPerDay} bumps** aujourd’hui.`,
          flags: MessageFlags.Ephemeral,
          allowedMentions: { users: [] },
        });
        return;
      }

      await User.updateOne(
        { discordId: target.id },
        { $set: { bumpCountDate: today, bumpCountToday: dejaFait + 1 } },
      );
      const solde = await grantYumz(target.id, REWARDS.bump, 'bump');
      await interaction.reply({
        content: `📈 Bump **${dejaFait + 1}/${REWARDS.bumpMaxPerDay}** : **+${REWARDS.bump} Yumz** pour <@${target.id}>. Solde : **${solde}**.`,
        allowedMentions: { users: [] },
      });
      return;
    }

    // --- Cas simples : boost / voice ---
    const gain = sub === 'boost' ? REWARDS.boostMonth : REWARDS.voice;
    const libelle = sub === 'boost' ? 'Boost du serveur' : 'Succès vocal';
    const solde = await grantYumz(target.id, gain, sub);
    await interaction.reply({
      content: `✨ **${libelle}** : **+${gain} Yumz** pour <@${target.id}>. Solde : **${solde}**.`,
      allowedMentions: { users: [] },
    });
  },
};
