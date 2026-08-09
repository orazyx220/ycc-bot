import {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  MessageFlags,
  type ChatInputCommandInteraction,
  type AutocompleteInteraction,
} from 'discord.js';
import type { Command } from '../types';
import { IMGUR_GUIDE } from '../config/messages';

interface Param {
  name: string;
  desc: string;
  required: boolean;
}
interface Detail {
  name: string; // ex: "/daily"
  admin: boolean;
  short: string; // description courte (liste)
  summary: string; // explication détaillée
  params: Param[];
  examples: string[];
  notes?: string;
}

/**
 * Fiche détaillée de chaque commande, indexée par son nom (sans le "/").
 * Sert à la fois pour la liste générale (champ `short`) et pour le détail.
 */
const DETAILS: Record<string, Detail> = {
  help: {
    name: '/help', admin: false,
    short: 'Affiche cette aide.',
    summary: 'Liste toutes les commandes, ou affiche le détail d’une commande précise si tu remplis l’option `commande`.',
    params: [{ name: 'commande', desc: 'La commande dont voir le détail', required: false }],
    examples: ['/help', '/help commande:daily'],
    notes: 'Les commandes admin ne s’affichent que pour les administrateurs.',
  },
  ping: {
    name: '/ping', admin: false,
    short: 'Vérifie que le bot répond.',
    summary: 'Vérifie que le bot est en ligne et affiche sa latence (temps de réponse).',
    params: [],
    examples: ['/ping'],
  },
  daily: {
    name: '/daily', admin: false,
    short: 'Yumz du jour (bonus de streak !).',
    summary: 'Donne des Yumz une fois toutes les 24 h, avec un bonus de série (streak).',
    params: [],
    examples: ['/daily'],
    notes: 'Base 550 · +10 par jour consécutif · plafond 1000/jour · rater un jour remet le streak à 0.',
  },
  travailler: {
    name: '/travailler', admin: false,
    short: 'Gagne quelques Yumz (toutes les heures).',
    summary: 'Travaille pour gagner un petit montant de Yumz aléatoire, avec un cooldown d’1 h.',
    params: [],
    examples: ['/travailler'],
    notes: 'Gain entre 50 et 150 Yumz.',
  },
  parier: {
    name: '/parier', admin: false,
    short: 'Mini-jeux de pari (pile ou face, dés, machine).',
    summary: 'Mise tes Yumz sur un mini-jeu : pile ou face, dés (toi vs bot), ou machine à sous.',
    params: [
      { name: 'pileouface | des | machine', desc: 'Le jeu (sous-commande)', required: true },
      { name: 'mise', desc: 'Yumz à parier (10–10000)', required: true },
      { name: 'choix', desc: 'pile ou face (pour /parier pileouface)', required: false },
    ],
    examples: ['/parier pileouface mise:100 choix:pile', '/parier des mise:200', '/parier machine mise:50'],
    notes: 'Machine : 3 identiques = jackpot (mise × mult) ; 2 identiques = mise remboursée ; sinon perdu.',
  },
  roue: {
    name: '/roue', admin: false,
    short: 'Roue de la fortune (gratuit, 1×/jour).',
    summary: 'Tourne la roue de la fortune une fois par jour : carte, Yumz, tour gratuit… ou rien !',
    params: [],
    examples: ['/roue'],
    notes: 'Lots : carte, 5 000 / 50 000 / 100 000 Yumz, tour gratuit, ou rien. Un « tour gratuit » relance aussitôt.',
  },
  solde: {
    name: '/solde', admin: false,
    short: 'Ton solde de Yumz (ou celui d’un membre).',
    summary: 'Affiche le solde de Yumz et le nombre de cartes possédées. Sans argument, c’est le tien.',
    params: [{ name: 'membre', desc: 'Le membre dont voir le solde (toi par défaut)', required: false }],
    examples: ['/solde', '/solde membre:@Ami'],
  },
  catalogue: {
    name: '/catalogue', admin: false,
    short: 'Feuillette toutes les cartes.',
    summary: 'Feuillette toutes les cartes existantes, une par une (image en grand), avec les boutons ◀ / ▶.',
    params: [],
    examples: ['/catalogue'],
    notes: 'Les cartes sont triées de la plus rare à la plus commune.',
  },
  carte: {
    name: '/carte', admin: false,
    short: 'Détail d’une carte précise.',
    summary: 'Affiche la fiche détaillée d’une carte : image, rareté, prix et stock restant.',
    params: [{ name: 'id', desc: 'L’identifiant de la carte (voir /catalogue)', required: true }],
    examples: ['/carte id:dragon-epique'],
  },
  boutique: {
    name: '/boutique', admin: false,
    short: 'Achète des cartes avec tes Yumz.',
    summary: 'Feuillette les cartes en stock et achète directement celle affichée avec le bouton 🛒 Acheter.',
    params: [],
    examples: ['/boutique'],
    notes: 'Navigation et achat réservés à celui qui lance la commande ; expire après 2 min.',
  },
  ouvrir: {
    name: '/ouvrir', admin: false,
    short: 'Ouvre un booster (1000 Yumz) → carte aléatoire.',
    summary: 'Paie 1000 Yumz pour ouvrir un booster et tirer une carte au hasard selon les probabilités de rareté.',
    params: [],
    examples: ['/ouvrir'],
    notes: 'Taux : Commune 55% · Rare 28% · Épique 12% · Légendaire 4% · Mystère 0,9% · Evil 0,1%. Les tirages ne consomment pas le stock.',
  },
  inventaire: {
    name: '/inventaire', admin: false,
    short: 'Voir tes cartes (ou celles d’un membre).',
    summary: 'Feuillette tes cartes possédées, avec la quantité de chaque. Sans argument, c’est le tien.',
    params: [{ name: 'membre', desc: 'Le membre dont voir l’inventaire (toi par défaut)', required: false }],
    examples: ['/inventaire', '/inventaire membre:@Ami'],
  },
  classement: {
    name: '/classement', admin: false,
    short: 'Top des membres les plus riches.',
    summary: 'Affiche le top 10 des membres les plus riches en Yumz, ainsi que ton rang personnel.',
    params: [],
    examples: ['/classement'],
  },
  donner: {
    name: '/donner', admin: false,
    short: 'Offre une de tes cartes à un membre.',
    summary: 'Donne une de TES cartes à un autre membre : elle quitte ton inventaire pour rejoindre le sien.',
    params: [
      { name: 'membre', desc: 'Le membre à qui donner la carte', required: true },
      { name: 'id', desc: 'L’identifiant de la carte à donner', required: true },
    ],
    examples: ['/donner membre:@Ami id:yumz-bleu'],
    notes: 'Ne retire qu’UN exemplaire même si tu en as plusieurs. Impossible vers un bot ou toi-même.',
  },
  echange: {
    name: '/echange', admin: false,
    short: 'Propose un troc de cartes et/ou Yumz.',
    summary: 'Propose un échange (cartes et/ou Yumz) à un membre. L’échange n’a lieu que s’il clique « Accepter ».',
    params: [
      { name: 'membre', desc: 'L’autre membre', required: true },
      { name: 'ma_carte', desc: 'Une carte que TU donnes', required: false },
      { name: 'sa_carte', desc: 'Une carte que tu VEUX de lui', required: false },
      { name: 'mes_yumz', desc: 'Des Yumz que tu donnes', required: false },
      { name: 'ses_yumz', desc: 'Des Yumz que tu veux', required: false },
    ],
    examples: [
      '/echange membre:@Ami ma_carte:yumz-bleu sa_carte:carte-neon',
      '/echange membre:@Ami ma_carte:dragon-epique ses_yumz:1000',
    ],
    notes: 'Les avoirs sont revérifiés au moment de l’acceptation ; la proposition expire après 2 min.',
  },
  drop: {
    name: '/drop', admin: true,
    short: 'Poste une carte à acheter/gagner.',
    summary: 'Poste une carte dans le salon avec un bouton Acheter (payant) ou Récupérer (gratuit), selon le mode de la carte.',
    params: [{ name: 'id', desc: 'L’identifiant de la carte à droper', required: true }],
    examples: ['/drop id:ycc-originel'],
    notes: 'Un seul gagnant par exemplaire (protection anti-concurrence).',
  },
  give_yumz: {
    name: '/give_yumz', admin: true,
    short: 'Donne ou retire des Yumz.',
    summary: 'Crédite (ou débite, avec un montant négatif) des Yumz à un membre. Sert aussi à corriger un solde.',
    params: [
      { name: 'membre', desc: 'Le membre concerné', required: true },
      { name: 'montant', desc: 'Montant à donner (négatif pour retirer)', required: true },
      { name: 'raison', desc: 'Raison (facultatif)', required: false },
    ],
    examples: ['/give_yumz membre:@Ami montant:1000', '/give_yumz membre:@Ami montant:-500 raison:erreur'],
  },
  reward: {
    name: '/reward', admin: true,
    short: 'Récompenses du barème (bump/boost/voice/level).',
    summary: 'Attribue une récompense en appliquant automatiquement le barème YCC via une sous-commande.',
    params: [
      { name: 'bump | boost | voice | level', desc: 'La sous-commande (le type de récompense)', required: true },
      { name: 'membre', desc: 'Le membre récompensé', required: true },
      { name: 'niveau', desc: 'Palier atteint (pour /reward level uniquement)', required: false },
    ],
    examples: ['/reward bump membre:@Ami', '/reward level membre:@Ami niveau:50'],
    notes: 'Bump limité à 3 par jour · Boost 5000 · Vocal 2000 · Niveau = niveau×100+500.',
  },
  addcard: {
    name: '/addcard', admin: true,
    short: 'Crée une nouvelle carte.',
    summary: 'Crée une nouvelle carte. L’ID est généré automatiquement à partir du nom.',
    params: [
      { name: 'nom', desc: 'Nom de la carte', required: true },
      { name: 'rarete', desc: 'Rareté (menu déroulant)', required: true },
      { name: 'description', desc: 'Texte d’ambiance de la carte', required: true },
      { name: 'lien_image', desc: 'Lien DIRECT de l’image (voir la note ci-dessous)', required: true },
      { name: 'prix', desc: 'Prix en Yumz (défaut 1000)', required: false },
      { name: 'stock', desc: 'Nombre d’exemplaires (défaut 1 = unique)', required: false },
    ],
    examples: ['/addcard nom:Dragon de Feu rarete:Légendaire description:Né des braises lien_image:https://i.imgur.com/x.png prix:5000 stock:3'],
    notes: IMGUR_GUIDE,
  },
  editcard: {
    name: '/editcard', admin: true,
    short: 'Modifie une carte existante.',
    summary: 'Modifie une carte : seuls les champs que tu renseignes changent. L’ID de la carte ne change jamais.',
    params: [
      { name: 'id', desc: 'L’identifiant de la carte à modifier', required: true },
      { name: 'nom / rarete / description / lien_image / prix', desc: 'Les champs à changer (facultatifs)', required: false },
      { name: 'restock', desc: 'Ajoute N exemplaires (stock total + disponible)', required: false },
    ],
    examples: ['/editcard id:dragon-epique prix:3000', '/editcard id:dragon-epique restock:5'],
  },
  delcard: {
    name: '/delcard', admin: true,
    short: 'Supprime une carte.',
    summary: 'Supprime définitivement une carte et la retire des inventaires des membres (pratique pour nettoyer).',
    params: [{ name: 'id', desc: 'L’identifiant de la carte à supprimer', required: true }],
    examples: ['/delcard id:dragon-epique'],
  },
  givecard: {
    name: '/givecard', admin: true,
    short: 'Offre une carte à un membre.',
    summary: 'Offre une carte à un membre. Par défaut l’exemplaire est pris sur le stock (respecte l’unicité).',
    params: [
      { name: 'membre', desc: 'Le membre à qui offrir', required: true },
      { name: 'id', desc: 'L’identifiant de la carte', required: true },
      { name: 'bonus', desc: 'Crée un exemplaire HORS stock (dépasse la limite)', required: false },
    ],
    examples: ['/givecard membre:@Ami id:dragon-epique', '/givecard membre:@Ami id:ycc-originel bonus:true'],
  },
  reserve: {
    name: '/reserve', admin: true,
    short: 'Gère la réserve des drops automatiques.',
    summary: 'Gère la réserve : les cartes que le bot peut faire tomber tout seul lors des drops automatiques.',
    params: [
      { name: 'add | remove | list', desc: 'La sous-commande', required: true },
      { name: 'id', desc: 'L’identifiant de la carte (pour add/remove)', required: false },
      { name: 'mode', desc: 'achat ou cadeau (pour add)', required: false },
    ],
    examples: ['/reserve list', '/reserve add id:evil-yumz mode:achat', '/reserve remove id:evil-yumz'],
    notes: 'Le bot tire au hasard une carte de la réserve encore en stock et la poste dans le salon configuré.',
  },
};

/** Liste des clés dans l'ordre d'affichage (sert aussi aux choix de l'option). */
const ORDER = Object.keys(DETAILS);

/** Ligne compacte pour la liste générale. */
function shortLine(d: Detail): string {
  return `**${d.name}** — ${d.short}`;
}

/** Met en forme les paramètres d'une commande. */
function formatParams(params: Param[]): string {
  if (params.length === 0) return 'Aucun paramètre.';
  return params
    .map((p) => `**${p.name}** ${p.required ? '*(obligatoire)*' : '*(optionnel)*'} — ${p.desc}`)
    .join('\n');
}

/** Construit l'Embed détaillé d'une commande. */
function buildDetailEmbed(d: Detail): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(d.admin ? 0xe67e22 : 0x5865f2)
    .setTitle(`📖 ${d.name}${d.admin ? '   🛡️ Admin' : ''}`)
    .setDescription(d.summary)
    .addFields(
      { name: 'Paramètres', value: formatParams(d.params) },
      { name: 'Exemple(s)', value: d.examples.map((e) => `\`${e}\``).join('\n') },
    );
  if (d.notes) embed.addFields({ name: 'Bon à savoir', value: d.notes });
  return embed;
}

/**
 * /help [commande] — liste les commandes, ou détaille une commande précise.
 * Les commandes admin ne s'affichent (dans la liste) que pour les admins.
 */
export const help: Command = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Affiche la liste des commandes, ou le détail d’une commande.')
    .addStringOption((o) =>
      o
        .setName('commande')
        .setDescription('Voir le détail d’une commande précise')
        .setAutocomplete(true),
    ),

  // Suggestions dynamiques : on masque les commandes admin aux non-admins.
  async autocomplete(interaction: AutocompleteInteraction) {
    const isAdmin =
      interaction.memberPermissions?.has(PermissionFlagsBits.Administrator) ?? false;
    const focused = interaction.options.getFocused().toLowerCase();

    const results = ORDER.filter((k) => isAdmin || !DETAILS[k]!.admin)
      .filter((k) => DETAILS[k]!.name.toLowerCase().includes(focused) || k.includes(focused))
      .slice(0, 25)
      .map((k) => ({ name: DETAILS[k]!.name, value: k }));

    await interaction.respond(results);
  },

  async execute(interaction: ChatInputCommandInteraction) {
    const isAdmin =
      interaction.memberPermissions?.has(PermissionFlagsBits.Administrator) ?? false;

    // --- Détail d'une commande précise ---
    const key = interaction.options.getString('commande');
    if (key) {
      const detail = DETAILS[key];
      // Commande inexistante, OU commande admin demandée par un non-admin
      // → on la traite comme inconnue (on ne révèle pas son existence).
      if (!detail || (detail.admin && !isAdmin)) {
        await interaction.reply({ content: '❓ Commande inconnue.', flags: MessageFlags.Ephemeral });
        return;
      }
      await interaction.reply({ embeds: [buildDetailEmbed(detail)], flags: MessageFlags.Ephemeral });
      return;
    }

    // --- Liste générale ---
    const memberList = ORDER.filter((k) => !DETAILS[k]!.admin).map((k) => shortLine(DETAILS[k]!)).join('\n');
    const adminList = ORDER.filter((k) => DETAILS[k]!.admin).map((k) => shortLine(DETAILS[k]!)).join('\n');

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('📖 Aide — Commandes YCC')
      .setDescription('Tape `/help commande:<nom>` pour le détail d’une commande. Les Yumz se gagnent en discutant et via `/daily` !')
      .addFields({ name: '👤 Commandes membres', value: memberList });

    if (isAdmin) {
      embed.addFields({ name: '🛡️ Commandes admin', value: adminList });
    } else {
      embed.setFooter({ text: 'Des commandes admin existent aussi (réservées aux administrateurs).' });
    }

    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },
};
