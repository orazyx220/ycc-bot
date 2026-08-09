"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE_MULTIPLIERS = exports.CHANNEL_MULTIPLIERS = exports.MESSAGE_EARN = void 0;
/**
 * Réglages de l'économie AUTOMATIQUE par message.
 *
 * Formule (choisie avec toi) :
 *   gain = base(25–35) × (meilleur multiplicateur de rôle × multiplicateur du salon)
 *          + bonus_de_longueur        ← ce bonus n'est PAS multiplié
 *   puis plafonné à `maxPerMessage`.
 * → Impossible de spammer un salon multiplié pour dépasser le plafond.
 */
exports.MESSAGE_EARN = {
    minBase: 25,
    maxBase: 35,
    cooldownMs: 30_000, // 1 gain max toutes les 30 s par membre
    maxPerMessage: 100, // plafond dur anti-abus
    // Bonus de longueur (NON multiplié) : +1 point tous les `perChars` caractères,
    // jusqu'à `max`. Un long message atteint ainsi ~100 avec la base.
    longBonusPerChars: 12,
    longBonusMax: 70,
};
/**
 * Multiplicateurs par SALON.
 * Clé = ID du salon (Discord : Mode dev → clic droit sur le salon → Copier l'ID).
 * Décommente et remplace les ID par les tiens.
 */
exports.CHANNEL_MULTIPLIERS = {
    '1362923885258866739': 2.5, // général
    '1362923885258866740': 2, // gaming
    '1368945961996521482': 2, // média
    '1384170403672490105': 2, // animaux
    '1420097297257201696': 2, // lecture
    '1420093094564728912': 1.5, // art
    '1400499759340585080': 1.5, // nature
    '1473721876659437588': 1.5, // recette
    '1420097339846037565': 1.5, // cuisine
    '1472658401099120680': 1.5, // haut achat
};
/**
 * Multiplicateurs par RÔLE.
 * Clé = ID du rôle (Discord : Paramètres du serveur → Rôles → clic droit → Copier l'ID).
 * Pour le "Server Booster", mets l'ID du rôle de boost de ton serveur.
 * Quand un membre a plusieurs rôles multiplicateurs, on garde LE PLUS ÉLEVÉ.
 */
exports.ROLE_MULTIPLIERS = {
    '1368267079790231653': 2, // Server Booster
    '1414698141395194000': 3, // Anniversaire
};
