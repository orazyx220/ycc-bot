import { Card, type CardDoc } from '../database/models/Card';
import { User, getOrCreateUser } from '../database/models/User';
import { Transaction } from '../database/models/Transaction';
import { RARITIES, type Rarity } from '../config/rarities';
import { BOOSTER_PRICE, BOOSTER_ODDS } from '../config/booster';

export type BoosterResult =
  | { status: 'ok'; card: CardDoc; newBalance: number }
  | { status: 'insufficient'; price: number; balance: number }
  | { status: 'empty' };

/** Tire une rareté au hasard selon les poids configurés. */
function rollRarity(): Rarity {
  const r = Math.random();
  let cumulative = 0;
  for (const rarity of RARITIES) {
    cumulative += BOOSTER_ODDS[rarity] ?? 0;
    if (r < cumulative) return rarity;
  }
  return 'common'; // filet de sécurité (si les poids ne somment pas à 1)
}

/**
 * Ouvre un booster : débite le prix, tire une rareté puis une carte au hasard.
 *
 * Génération LIBRE (choix du projet) : le tirage n'affecte PAS le stock des
 * cartes — on peut donc tirer plusieurs fois la même carte, sans limite.
 * Le débit des Yumz reste atomique (anti double-clic).
 */
export async function openBooster(discordId: string): Promise<BoosterResult> {
  const user = await getOrCreateUser(discordId);
  if (user.yumz < BOOSTER_PRICE) {
    return { status: 'insufficient', price: BOOSTER_PRICE, balance: user.yumz };
  }

  const all = await Card.find();
  if (all.length === 0) return { status: 'empty' };

  // Débit atomique du prix du booster.
  const charged = await User.findOneAndUpdate(
    { discordId, yumz: { $gte: BOOSTER_PRICE } },
    { $inc: { yumz: -BOOSTER_PRICE } },
    { returnDocument: 'after' },
  );
  if (!charged) return { status: 'insufficient', price: BOOSTER_PRICE, balance: user.yumz };

  // Regroupe les cartes par rareté.
  const byRarity = new Map<string, CardDoc[]>();
  for (const c of all) {
    const list = byRarity.get(c.rarity) ?? [];
    list.push(c);
    byRarity.set(c.rarity, list);
  }

  // Tire une rareté ; si aucune carte de cette rareté n'existe, on retombe
  // sur la première rareté disponible (la plus commune en priorité).
  const rolled = rollRarity();
  let pool = byRarity.get(rolled) ?? [];
  if (pool.length === 0) {
    for (const r of RARITIES) {
      const p = byRarity.get(r);
      if (p && p.length > 0) {
        pool = p;
        break;
      }
    }
  }

  const card = pool[Math.floor(Math.random() * pool.length)]!;

  // On ajoute la carte à l'inventaire (sans toucher au stock).
  await User.updateOne({ discordId }, { $push: { cards: card.cardId } });
  await Transaction.create({
    discordId,
    type: 'booster',
    amount: -BOOSTER_PRICE,
    cardId: card.cardId,
  });

  return { status: 'ok', card, newBalance: charged.yumz };
}
