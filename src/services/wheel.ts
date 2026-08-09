import { User, getOrCreateUser } from '../database/models/User';
import { Card } from '../database/models/Card';
import { Transaction } from '../database/models/Transaction';
import { addYumz } from './economy';
import { WHEEL_PRIZES, WHEEL_COOLDOWN_MS, type WheelPrize } from '../config/wheel';

/** Tire un lot au hasard selon les poids. */
function rollPrize(): WheelPrize {
  const total = WHEEL_PRIZES.reduce((sum, p) => sum + p.weight, 0);
  let r = Math.random() * total;
  for (const prize of WHEEL_PRIZES) {
    r -= prize.weight;
    if (r < 0) return prize;
  }
  return WHEEL_PRIZES[WHEEL_PRIZES.length - 1]!;
}

export interface SpinOutcome {
  emoji: string;
  label: string;
  detail: string;
}

export type WheelResult =
  | { status: 'cooldown'; remaining: number }
  | { status: 'ok'; outcomes: SpinOutcome[]; newBalance: number };

const MAX_SPINS = 10; // garde-fou contre une chaîne infinie de "tours gratuits"

/**
 * Fait tourner la roue (gratuit, 1×/24 h). Un lot "tour gratuit" relance
 * immédiatement un tour supplémentaire (jusqu'à MAX_SPINS).
 */
export async function spinWheel(discordId: string): Promise<WheelResult> {
  const user = await getOrCreateUser(discordId);
  const now = Date.now();
  const last = user.wheelLastSpin?.getTime() ?? null;

  if (last !== null && now - last < WHEEL_COOLDOWN_MS) {
    return { status: 'cooldown', remaining: last + WHEEL_COOLDOWN_MS - now };
  }
  await User.updateOne({ discordId }, { $set: { wheelLastSpin: new Date(now) } });

  const outcomes: SpinOutcome[] = [];

  for (let i = 0; i < MAX_SPINS; i++) {
    const prize = rollPrize();

    if (prize.kind === 'respin') {
      outcomes.push({ emoji: prize.emoji, label: prize.label, detail: 'Tu rejoues !' });
      continue;
    }

    if (prize.kind === 'yumz') {
      const amount = prize.amount ?? 0;
      await addYumz(discordId, amount);
      await Transaction.create({ discordId, type: 'wheel', amount });
      outcomes.push({ emoji: prize.emoji, label: prize.label, detail: `+${amount} Yumz !` });
      break;
    }

    if (prize.kind === 'card') {
      const all = await Card.find();
      if (all.length === 0) {
        outcomes.push({ emoji: '🎯', label: 'Rien...', detail: 'Aucune carte disponible.' });
        break;
      }
      const card = all[Math.floor(Math.random() * all.length)]!;
      await User.updateOne({ discordId }, { $push: { cards: card.cardId } });
      await Transaction.create({ discordId, type: 'wheel_card', amount: 0, cardId: card.cardId });
      outcomes.push({ emoji: prize.emoji, label: prize.label, detail: `Tu gagnes **${card.name}** !` });
      break;
    }

    // kind === 'nothing'
    outcomes.push({ emoji: prize.emoji, label: prize.label, detail: 'Pas de chance cette fois.' });
    break;
  }

  const finalUser = await getOrCreateUser(discordId);
  return { status: 'ok', outcomes, newBalance: finalUser.yumz };
}
