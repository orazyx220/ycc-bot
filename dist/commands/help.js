"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.help = void 0;
const discord_js_1 = require("discord.js");
const messages_1 = require("../config/messages");
/** Commandes visibles par tout le monde. */
const MEMBER_COMMANDS = [
    { name: '/help', desc: 'Affiche cette aide.', example: '/help' },
    { name: '/ping', desc: 'Vérifie que le bot répond.', example: '/ping' },
    { name: '/daily', desc: 'Réclame tes 550 Yumz du jour (1×/24 h).', example: '/daily' },
    { name: '/solde', desc: 'Ton solde de Yumz (ou celui d’un membre).', example: '/solde membre:@Ami' },
    { name: '/catalogue', desc: 'Feuillette toutes les cartes.', example: '/catalogue' },
    { name: '/carte', desc: 'Détail d’une carte précise.', example: '/carte id:dragon-epique' },
    { name: '/boutique', desc: 'Achète des cartes avec tes Yumz.', example: '/boutique' },
    { name: '/inventaire', desc: 'Voir tes cartes (ou celles d’un membre).', example: '/inventaire' },
    { name: '/classement', desc: 'Top des membres les plus riches.', example: '/classement' },
    { name: '/donner', desc: 'Offre une de tes cartes à un membre.', example: '/donner membre:@Ami id:yumz-bleu' },
    { name: '/echange', desc: 'Propose un troc de cartes et/ou Yumz.', example: '/echange membre:@Ami ma_carte:yumz-bleu sa_carte:carte-neon' },
];
/** Commandes réservées aux administrateurs. */
const ADMIN_COMMANDS = [
    { name: '/drop', desc: 'Poste une carte à acheter/gagner.', example: '/drop id:ycc-originel' },
    { name: '/give_yumz', desc: 'Donne ou retire des Yumz.', example: '/give_yumz membre:@Ami montant:1000' },
    { name: '/reward', desc: 'Récompenses du barème (bump/boost/voice/level).', example: '/reward level membre:@Ami niveau:50' },
    { name: '/addcard', desc: 'Crée une nouvelle carte.', example: '/addcard nom:Dragon rarete:Légendaire description:... lien_image:https://i.imgur.com/x.png' },
    { name: '/editcard', desc: 'Modifie une carte existante.', example: '/editcard id:dragon-epique prix:3000' },
    { name: '/delcard', desc: 'Supprime une carte.', example: '/delcard id:dragon-epique' },
    { name: '/givecard', desc: 'Offre une carte à un membre.', example: '/givecard membre:@Ami id:dragon-epique' },
    { name: '/reserve', desc: 'Gère la réserve des drops automatiques.', example: '/reserve list' },
];
/** Met en forme une liste de commandes (nom + description + exemple). */
function formatList(entries) {
    return entries
        .map((e) => `**${e.name}** — ${e.desc}\n╰ ex : \`${e.example}\``)
        .join('\n');
}
/**
 * /help — liste les commandes disponibles avec un exemple.
 * Les commandes admin ne s'affichent que pour les administrateurs.
 */
exports.help = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('help')
        .setDescription('Affiche la liste des commandes disponibles.'),
    async execute(interaction) {
        const isAdmin = interaction.memberPermissions?.has(discord_js_1.PermissionFlagsBits.Administrator) ?? false;
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(0x5865f2)
            .setTitle('📖 Aide — Commandes YCC')
            .setDescription('Voici les commandes que tu peux utiliser. Les Yumz se gagnent en discutant et via `/daily` !')
            .addFields({ name: '👤 Commandes membres', value: formatList(MEMBER_COMMANDS) });
        if (isAdmin) {
            embed.addFields({ name: '🛡️ Commandes admin', value: formatList(ADMIN_COMMANDS) }, { name: '🖼️ Créer une carte avec une image', value: messages_1.IMGUR_GUIDE });
        }
        else {
            embed.setFooter({ text: 'Des commandes admin existent aussi (réservées aux administrateurs).' });
        }
        await interaction.reply({ embeds: [embed], flags: discord_js_1.MessageFlags.Ephemeral });
    },
};
