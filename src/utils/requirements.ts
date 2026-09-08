/**
 * Renvoie la liste des cartes prérequises que le membre ne possède PAS encore.
 * Un tableau vide signifie que tous les prérequis sont remplis.
 */
export function missingRequirements(ownedCards: string[], requires: string[]): string[] {
  const owned = new Set(ownedCards);
  return requires.filter((r) => !owned.has(r));
}

/** Message affiché quand un membre tente d'obtenir une carte verrouillée. */
export function lockedMessage(requires: string[], missing: string[]): string {
  const list = (ids: string[]) => ids.map((r) => `\`${r}\``).join(', ');
  return (
    `🔒 Carte verrouillée ! Tu dois d'abord posséder : ${list(requires)}.\n` +
    `Il te manque encore : ${list(missing)}.`
  );
}
