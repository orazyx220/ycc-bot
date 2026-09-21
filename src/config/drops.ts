/**
 * Réglages des DROPS AUTOMATIQUES.
 *
 * Le bot choisit, à intervalle aléatoire, une carte de la réserve
 * (celles marquées `autoDrop: true`, gérées via /reserve) et la poste
 * dans le salon ci-dessous. Personne ne décide qui l'obtient.
 */
export const DROPS = {
  // Salon où sont postés les drops auto.
  // Remplace par l'ID de ton salon (Mode dev → clic droit → Copier l'ID).
  // Tant qu'il vaut le placeholder, les drops auto restent DÉSACTIVÉS.
  channelId: '1548388687367110866',

  // Intervalle aléatoire entre deux drops (par défaut : entre 2 h et 6 h).
  minIntervalMs: 2 * 60 * 60 * 1000,
  maxIntervalMs: 6 * 60 * 60 * 1000,
} as const;

/**
 * Drops de YUMZ aléatoires (dans le même salon que les cartes).
 * Plus FRÉQUENTS que les cartes (moins rares). Le montant est aléatoire,
 * biaisé vers le bas → les grosses sommes (jusqu'à maxAmount) sont rares.
 * Premier membre à cliquer « Récupérer » remporte la somme.
 */
export const YUMZ_DROP = {
  // Plus fréquent que les cartes (par défaut : entre 30 min et 2 h).
  minIntervalMs: 30 * 60 * 1000,
  maxIntervalMs: 2 * 60 * 60 * 1000,

  // Paliers de montant avec poids relatifs : petites sommes très fréquentes,
  // gros lots rares (le jackpot 8k-15k ne sort que ~3% du temps).
  tiers: [
    { min: 100, max: 500, weight: 45 }, // petit — très fréquent
    { min: 500, max: 1500, weight: 30 }, // moyen
    { min: 1500, max: 4000, weight: 15 }, // gros
    { min: 4000, max: 8000, weight: 7 }, // très gros — rare
    { min: 8000, max: 15000, weight: 3 }, // jackpot — très rare
  ],
} as const;
