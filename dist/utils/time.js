"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DAY_MS = void 0;
exports.formatDuration = formatDuration;
/** Durée d'une journée en millisecondes. */
exports.DAY_MS = 24 * 60 * 60 * 1000;
/**
 * Transforme une durée (en ms) en texte lisible, ex. "3h 12min" ou "45min".
 * Sert à dire au membre combien de temps il doit attendre son prochain /daily.
 */
function formatDuration(ms) {
    const totalMinutes = Math.max(0, Math.ceil(ms / 60_000));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0)
        return `${hours}h ${minutes}min`;
    return `${minutes}min`;
}
