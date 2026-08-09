"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Transaction = void 0;
const mongoose_1 = require("mongoose");
/**
 * Journal des mouvements de Yumz. Chaque gain ou dépense y laisse une trace.
 * Sert au debug et à l'anti-triche (ex: retrouver QUI a acheté la carte unique).
 */
const transactionSchema = new mongoose_1.Schema({
    discordId: { type: String, required: true, index: true },
    // Type d'opération : 'purchase' | 'refund' | 'daily' | 'admin_give' ...
    type: { type: String, required: true },
    // Montant : positif = gain, négatif = dépense.
    amount: { type: Number, required: true },
    // Carte concernée (pour un achat/remboursement), sinon null.
    cardId: { type: String, default: null },
    // Numéro de l'exemplaire acheté (ex: #1 de la légendaire unique).
    serial: { type: Number, default: null },
    // Note libre (ex: raison d'un remboursement).
    reason: { type: String, default: null },
}, { timestamps: true });
exports.Transaction = (0, mongoose_1.model)('Transaction', transactionSchema);
