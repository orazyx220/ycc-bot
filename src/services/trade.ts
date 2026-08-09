import { User, getOrCreateUser } from '../database/models/User';
import { Transaction } from '../database/models/Transaction';

/** Termes d'un échange : ce que chaque partie donne. */
export interface TradeTerms {
  initiatorId: string;
  targetId: string;
  initiatorCard: string | null; // carte donnée par le proposeur
  initiatorYumz: number; // Yumz donnés par le proposeur
  targetCard: string | null; // carte donnée par la cible
  targetYumz: number; // Yumz donnés par la cible
}

export type TradeResult = { status: 'ok' } | { status: 'error'; reason: string };

/**
 * Exécute un échange, APRÈS avoir revérifié que chacun possède encore ce
 * qu'il propose (cartes + solde). Si une vérif échoue, rien n'est modifié.
 * Chaque carte n'est retirée qu'en UN exemplaire (indexOf + splice).
 *
 * Note : conçu pour un échange confirmé par les deux membres (faible
 * concurrence). On valide juste avant d'écrire, ce qui rend la fenêtre de
 * course négligeable pour cet usage.
 */
export async function executeTrade(t: TradeTerms): Promise<TradeResult> {
  const initiator = await getOrCreateUser(t.initiatorId);
  const target = await getOrCreateUser(t.targetId);

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
  if (t.targetCard) initiator.cards.push(t.targetCard);
  if (t.initiatorCard) target.cards.push(t.initiatorCard);

  await initiator.save();
  await target.save();

  // --- Journalisation (solde net de Yumz pour chacun) ---
  await Transaction.create({
    discordId: t.initiatorId,
    type: 'trade',
    amount: t.targetYumz - t.initiatorYumz,
  });
  await Transaction.create({
    discordId: t.targetId,
    type: 'trade',
    amount: t.initiatorYumz - t.targetYumz,
  });

  return { status: 'ok' };
}
