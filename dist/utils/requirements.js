"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.missingRequirements = missingRequirements;
exports.lockedMessage = lockedMessage;
/**
 * Renvoie la liste des cartes prérequises que le membre ne possède PAS encore.
 * Un tableau vide signifie que tous les prérequis sont remplis.
 */
function missingRequirements(ownedCards, requires) {
    const owned = new Set(ownedCards);
    return requires.filter((r) => !owned.has(r));
}
/** Message affiché quand un membre tente d'obtenir une carte verrouillée. */
function lockedMessage(requires, missing) {
    const list = (ids) => ids.map((r) => `\`${r}\``).join(', ');
    return (`🔒 Carte verrouillée ! Tu dois d'abord posséder : ${list(requires)}.\n` +
        `Il te manque encore : ${list(missing)}.`);
}
