"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.YUMZ_DROP = exports.DROPS = void 0;
/**
 * Réglages des DROPS AUTOMATIQUES.
 *
 * Le bot choisit, à intervalle aléatoire, une carte de la réserve
 * (celles marquées `autoDrop: true`, gérées via /reserve) et la poste
 * dans le salon ci-dessous. Personne ne décide qui l'obtient.
 */
exports.DROPS = {
    // Salon où sont postés les drops auto.
    // Remplace par l'ID de ton salon (Mode dev → clic droit → Copier l'ID).
    // Tant qu'il vaut le placeholder, les drops auto restent DÉSACTIVÉS.
    channelId: '1548388687367110866',
    // Intervalle aléatoire entre deux drops (par défaut : entre 2 h et 6 h).
    minIntervalMs: 2 * 60 * 60 * 1000,
    maxIntervalMs: 6 * 60 * 60 * 1000,
};
/**
 * Drops de YUMZ aléatoires (dans le même salon que les cartes).
 * Plus FRÉQUENTS que les cartes (moins rares). Le montant est aléatoire,
 * biaisé vers le bas → les grosses sommes (jusqu'à maxAmount) sont rares.
 * Premier membre à cliquer « Récupérer » remporte la somme.
 */
exports.YUMZ_DROP = {
    // Plus fréquent que les cartes (par défaut : entre 30 min et 2 h).
    minIntervalMs: 30 * 60 * 1000,
    maxIntervalMs: 2 * 60 * 60 * 1000,
    minAmount: 500,
    maxAmount: 15_000,
};
