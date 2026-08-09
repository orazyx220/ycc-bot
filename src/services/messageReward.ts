import {
  MESSAGE_EARN,
  CHANNEL_MULTIPLIERS,
  ROLE_MULTIPLIERS,
} from '../config/activity';

/** Tirage aléatoire de la base entre minBase et maxBase (inclus). */
function randomBase(): number {
  const { minBase, maxBase } = MESSAGE_EARN;
  return Math.floor(Math.random() * (maxBase - minBase + 1)) + minBase;
}

/** Multiplicateur du salon (1 si non configuré). */
function channelMultiplier(channelId: string): number {
  return CHANNEL_MULTIPLIERS[channelId] ?? 1;
}

/** Meilleur multiplicateur parmi les rôles du membre (1 si aucun). */
function bestRoleMultiplier(roleIds: string[]): number {
  let best = 1;
  for (const id of roleIds) {
    const m = ROLE_MULTIPLIERS[id];
    if (m !== undefined && m > best) best = m;
  }
  return best;
}

/** Bonus de longueur (NON multiplié), plafonné. */
function lengthBonus(content: string): number {
  const raw = Math.floor(content.length / MESSAGE_EARN.longBonusPerChars);
  return Math.min(raw, MESSAGE_EARN.longBonusMax);
}

/**
 * Calcule le gain d'un message selon la formule anti-abus retenue :
 *   base × (meilleur rôle × salon)  +  bonus_longueur   → plafonné à maxPerMessage
 * Les multiplicateurs agissent sur la base ; le bonus de longueur, lui, est à part.
 */
export function computeMessageReward(
  content: string,
  roleIds: string[],
  channelId: string,
): number {
  const base = randomBase();
  const multiplier = bestRoleMultiplier(roleIds) * channelMultiplier(channelId);
  const multiplied = Math.round(base * multiplier);
  const bonus = lengthBonus(content); // hors multiplicateurs
  return Math.min(multiplied + bonus, MESSAGE_EARN.maxPerMessage);
}
