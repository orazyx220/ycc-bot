"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.takeYumz = void 0;
const discord_js_1 = require("discord.js");
const economy_1 = require("../services/economy");
/**
 * /take_yumz <membre> <montant> [raison] — (Admin) retire des Yumz à un membre.
 * Le montant est positif (= ce qu'on retire). Le solde ne descend jamais sous 0.
 */
exports.takeYumz = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('take_yumz')
        .setDescription('(Admin) Retire des Yumz à un membre.')
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator)
        .addUserOption((o) => o.setName('membre').setDescription('Le membre concerné').setRequired(true))
        .addIntegerOption((o) => o.setName('montant').setDescription('Yumz à retirer').setRequired(true).setMinValue(1))
        .addStringOption((o) => o.setName('raison').setDescription('Raison (facultatif)').setRequired(false)),
    async execute(interaction) {
        if (!interaction.memberPermissions?.has(discord_js_1.PermissionFlagsBits.Administrator)) {
            await interaction.reply({
                content: '🚫 Cette commande est réservée aux administrateurs.',
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
            return;
        }
        const target = interaction.options.getUser('membre', true);
        const montant = interaction.options.getInteger('montant', true);
        const raison = interaction.options.getString('raison') ?? undefined;
        const newBalance = await (0, economy_1.grantYumz)(target.id, -montant, 'admin_take_yumz', raison);
        await interaction.reply({
            content: `➖ **${montant} Yumz** retirés à <@${target.id}>. Nouveau solde : **${newBalance}** Yumz.` +
                (raison ? `\n📝 Raison : ${raison}` : ''),
            allowedMentions: { users: [] },
        });
    },
};
