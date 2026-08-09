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
