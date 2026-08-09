"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeTrade = executeTrade;
const User_1 = require("../database/models/User");
const Transaction_1 = require("../database/models/Transaction");
/**
 * Exécute un échange, APRÈS avoir revérifié que chacun possède encore ce
 * qu'il propose (cartes + solde). Si une vérif échoue, rien n'est modifié.
 * Chaque carte n'est retirée qu'en UN exemplaire (indexOf + splice).
 *
 * Note : conçu pour un échange confirmé par les deux membres (faible
 * concurrence). On valide juste avant d'écrire, ce qui rend la fenêtre de
 * course négligeable pour cet usage.
 */
async function executeTrade(t) {
    const initiator = await (0, User_1.getOrCreateUser)(t.initiatorId);
    const target = await (0, User_1.getOrCreateUser)(t.targetId);
    // --- Vérifications (aucune modification tant que tout n'est pas validé) ---
    if (t.initiatorCard && !initiator.cards.includes(t.initiatorCard)) {
        return { status: 'error', reason: `le proposeur ne possède plus \`${t.initiatorCard}\`` };
    }
    if (t.targetCard && !target.cards.includes(t.targetCard)) {
        return { status: 'error', reason: `tu ne possèdes plus \`${t.targetCard}\`` };
    }
    if (initiator.yumz < t.initiatorYumz) {
        return { status: 'error', reason: 'le proposeur n’a plus assez de Yumz' };
    }
    if (target.yumz < t.targetYumz) {
        return { status: 'error', reason: 'tu n’as plus assez de Yumz' };
    }
    // --- Retraits ---
    if (t.initiatorCard) {
        initiator.cards.splice(initiator.cards.indexOf(t.initiatorCard), 1);
    }
    if (t.targetCard) {
        target.cards.splice(target.cards.indexOf(t.targetCard), 1);
    }
    // --- Yumz : chacun donne les siens et reçoit ceux de l'autre ---
    initiator.yumz = initiator.yumz - t.initiatorYumz + t.targetYumz;
    target.yumz = target.yumz - t.targetYumz + t.initiatorYumz;
    // --- Cartes croisées ---
    if (t.targetCard)
        initiator.cards.push(t.targetCard);
    if (t.initiatorCard)
        target.cards.push(t.initiatorCard);
    await initiator.save();
    await target.save();
    // --- Journalisation (solde net de Yumz pour chacun) ---
    await Transaction_1.Transaction.create({
        discordId: t.initiatorId,
        type: 'trade',
        amount: t.targetYumz - t.initiatorYumz,
    });
    await Transaction_1.Transaction.create({
        discordId: t.targetId,
        type: 'trade',
        amount: t.initiatorYumz - t.targetYumz,
    });
    return { status: 'ok' };
}
