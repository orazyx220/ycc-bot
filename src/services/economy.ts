import { User, getOrCreateUser } from '../database/models/User';
import { Transaction } from '../database/models/Transaction';

/**
 * Crédite (montant > 0) ou débite (montant < 0) des Yumz à un membre,
 * puis journalise l'opération. Le solde ne descend jamais sous 0.
 *
 * Renvoie le nouveau solde.
 *
 * Note : utilisé pour les attributions ADMIN (peu fréquentes, pas de course
 * possible). Le /daily et l'achat de cartes ont, eux, leur propre logique
 * ATOMIQUE dédiée à la concurrence.
 */
/**
 * Ajoute des Yumz de façon ATOMIQUE, sans journaliser (adapté au gros volume
 * de l'économie par message). Crée le membre s'il n'existe pas encore.
 */
export async function addYumz(discordId: string, amount: number): Promise<void> {
  await User.updateOne(
    { discordId },
    { $inc: { yumz: amount } },
    { upsert: true, setDefaultsOnInsert: true },
  );
}

export async function grantYumz(
  discordId: string,
  amount: number,
  type: string,
  reason?: string,
): Promise<number> {
  const user = await getOrCreateUser(discordId);
  const newBalance = Math.max(0, user.yumz + amount);

  await User.updateOne({ discordId }, { $set: { yumz: newBalance } });
  await Transaction.create({
    discordId,
    type,
    amount,
    reason: reason ?? null,
  });

  return newBalance;
}
