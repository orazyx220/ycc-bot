import { User, getOrCreateUser } from '../database/models/User';
import { grantYumz } from './economy';
import { REWARDS } from '../config/rewards';

/** Date du jour au format 'AAAA-MM-JJ' (UTC), pour le compteur de bumps. */
function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export type BumpResult =
  | { status: 'ok'; count: number; newBalance: number }
  | { status: 'limit'; count: number };

/**
 * Crédite la récompense de bump à un membre, dans la limite de 3/jour.
 * Utilisé à la fois par la commande admin /reward bump et par la détection
 * automatique des bumps Disboard.
 */
export async function giveBumpReward(discordId: string): Promise<BumpResult> {
  const today = todayKey();
  const user = await getOrCreateUser(discordId);
  const already = user.bumpCountDate === today ? user.bumpCountToday : 0;

  if (already >= REWARDS.bumpMaxPerDay) {
    return { status: 'limit', count: already };
  }

  await User.updateOne(
    { discordId },
    { $set: { bumpCountDate: today, bumpCountToday: already + 1 } },
  );
  const newBalance = await grantYumz(discordId, REWARDS.bump, 'bump');
  return { status: 'ok', count: already + 1, newBalance };
}
