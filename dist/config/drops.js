"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DROPS = void 0;
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
    channelId: '1362923885258866739',
    // Intervalle aléatoire entre deux drops (par défaut : entre 2 h et 6 h).
    minIntervalMs: 2 * 60 * 60 * 1000,
    maxIntervalMs: 6 * 60 * 60 * 1000,
};
