"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RARITY_INFO = exports.RARITIES = void 0;
exports.rarityInfo = rarityInfo;
/**
 * Les 4 raretés possibles d'une carte, de la plus commune à la plus rare.
 * `as const` fige la liste → TypeScript connaît exactement les valeurs permises.
 */
exports.RARITIES = [
    'common',
    'rare',
    'epic',
    'legendary',
    'mystere',
    'evil',
];
/**
 * Pour chaque rareté : un libellé FR, un emoji, et une couleur de bordure
 * d'Embed (au format hexadécimal 0x......). C'est ce qui rend le drop "beau".
 */
exports.RARITY_INFO = {
    common: { label: 'Commune', emoji: '⚪', color: 0x95a5a6 }, // gris
    rare: { label: 'Rare', emoji: '🔵', color: 0x3498db }, // bleu
    epic: { label: 'Épique', emoji: '🟣', color: 0x9b59b6 }, // violet
    legendary: { label: 'Légendaire', emoji: '🟡', color: 0xf1c40f }, // or
    mystere: { label: 'Mystère', emoji: '🎭', color: 0x1abc9c }, // turquoise
    evil: { label: 'Evil', emoji: '😈', color: 0xc0392b }, // rouge sombre
};
/**
 * Renvoie les infos d'une rareté de façon SÛRE : si jamais une carte a une
 * rareté inconnue (donnée corrompue), on retombe sur "commune" sans planter.
 */
function rarityInfo(rarity) {
    return exports.RARITY_INFO[rarity] ?? exports.RARITY_INFO.common;
}
