"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidHttpUrl = isValidHttpUrl;
exports.isDirectImageUrl = isDirectImageUrl;
/** Vrai si la chaîne est une URL http(s) valide. */
function isValidHttpUrl(value) {
    try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:';
    }
    catch {
        return false;
    }
}
/**
 * Vrai si l'URL pointe DIRECTEMENT vers un fichier image
 * (le chemin finit par .png/.jpg/.jpeg/.gif/.webp).
 * Évite qu'on colle une page web (ex. album Imgur /a/…) au lieu de l'image.
 */
function isDirectImageUrl(value) {
    try {
        const url = new URL(value);
        if (url.protocol !== 'http:' && url.protocol !== 'https:')
            return false;
        return /\.(png|jpe?g|gif|webp)$/i.test(url.pathname);
    }
    catch {
        return false;
    }
}
