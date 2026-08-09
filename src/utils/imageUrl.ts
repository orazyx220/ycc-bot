/** Vrai si la chaîne est une URL http(s) valide. */
export function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Vrai si l'URL pointe DIRECTEMENT vers un fichier image
 * (le chemin finit par .png/.jpg/.jpeg/.gif/.webp).
 * Évite qu'on colle une page web (ex. album Imgur /a/…) au lieu de l'image.
 */
export function isDirectImageUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
    return /\.(png|jpe?g|gif|webp)$/i.test(url.pathname);
  } catch {
    return false;
  }
}
