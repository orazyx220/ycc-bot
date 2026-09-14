import { Card, type CardDoc } from '../database/models/Card';
import { User, getOrCreateUser } from '../database/models/User';
import { Transaction } from '../database/models/Transaction';

/** Résultat d'un exemplaire "bonus" (admin, hors stock). */
export type MintResult =
  | { status: 'ok'; card: CardDoc }
  | { status: 'notfound' };

/**
 * (Admin) Crée un exemplaire BONUS d'une carte, SANS toucher au stock.
 * Peut dépasser maxSupply — c'est l'exception assumée pour les cas spéciaux.
 */
export async function mintBonusCard(discordId: string, cardId: string): Promise<MintResult> {
  const meta = await Card.findOne({ cardId });
  if (!meta) return { status: 'notfound' };

  await getOrCreateUser(discordId);
  await User.updateOne({ discordId }, { $push: { cards: cardId } });
  await Transaction.create({ discordId, type: 'admin_bonus_card', amount: 0, cardId });

  return { status: 'ok', card: meta };
}

/** Résultat d'un transfert de carte entre membres. */
export type TransferResult =
  | { status: 'ok'; card: CardDoc }
  | { status: 'notowned' }
  | { status: 'notfound' };

/**
 * Transfère UN exemplaire d'une carte du donneur vers le receveur.
 * Le stock global ne change pas (la carte change juste de propriétaire).
 * Échoue si le donneur ne possède pas la carte.
 */
export async function transferCard(
  fromId: string,
  toId: string,
  cardId: string,
): Promise<TransferResult> {
  const meta = await Card.findOne({ cardId });
  if (!meta) return { status: 'notfound' };

  const giver = await getOrCreateUser(fromId);
  // On retire UN seul exemplaire (indexOf + splice), pas toutes les copies.
  const index = giver.cards.indexOf(cardId);
  if (index === -1) return { status: 'notowned' };

  giver.cards.splice(index, 1);
  await giver.save();

  await getOrCreateUser(toId);
  await User.updateOne({ discordId: toId }, { $push: { cards: cardId } });

  await Transaction.create({ discordId: fromId, type: 'gift_out', amount: 0, cardId });
  await Transaction.create({ discordId: toId, type: 'gift_in', amount: 0, cardId });

  return { status: 'ok', card: meta };
}

/** Résultat d'un retrait de carte à un membre. */
export type TakeResult =
  | { status: 'ok'; card: CardDoc | null; restocked: boolean }
  | { status: 'notowned' };

/**
 * (Admin) Retire UN exemplaire d'une carte de l'inventaire d'un membre.
 * Si `restock` est vrai, l'exemplaire est remis dans le stock global
 * (remainingSupply +1, plafonné à maxSupply) — utile pour une carte limitée.
 */
export async function takeCard(
  discordId: string,
  cardId: string,
  restock: boolean,
): Promise<TakeResult> {
  const user = await getOrCreateUser(discordId);
  const index = user.cards.indexOf(cardId);
  if (index === -1) return { status: 'notowned' };

  user.cards.splice(index, 1);
  await user.save();

  const card = await Card.findOne({ cardId });
  let restocked = false;
  if (restock && card && card.remainingSupply < card.maxSupply) {
    card.remainingSupply += 1;
    await card.save();
    restocked = true;
  }

  await Transaction.create({ discordId, type: 'admin_take', amount: 0, cardId });
  return { status: 'ok', card, restocked };
}

/** Résultat d'un vidage complet d'inventaire. */
export interface ClearResult {
  removed: number;
  restocked: boolean;
}

/**
 * (Admin) Vide TOUT l'inventaire de cartes d'un membre.
 * Si `restock` est vrai, chaque exemplaire retiré est remis dans le stock
 * global (remainingSupply +N, plafonné à maxSupply).
 */
export async function clearInventory(discordId: string, restock: boolean): Promise<ClearResult> {
  const user = await getOrCreateUser(discordId);
  const removed = user.cards.length;
  if (removed === 0) return { removed: 0, restocked: false };

  if (restock) {
    // Compte combien d'exemplaires de chaque carte, puis remet en stock.
    const counts = new Map<string, number>();
    for (const id of user.cards) counts.set(id, (counts.get(id) ?? 0) + 1);

    const cards = await Card.find({ cardId: { $in: [...counts.keys()] } });
    for (const card of cards) {
      const n = counts.get(card.cardId) ?? 0;
      const room = card.maxSupply - card.remainingSupply;
      const add = Math.min(n, room);
      if (add > 0) {
        card.remainingSupply += add;
        await card.save();
      }
    }
  }

  user.cards.splice(0); // vide le tableau
  await user.save();
  await Transaction.create({ discordId, type: 'admin_clear', amount: 0 });
  return { removed, restocked: restock };
}
