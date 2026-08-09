import { User, getOrCreateUser, type UserDoc } from '../database/models/User';
import { Transaction } from '../database/models/Transaction';
import { SLOT_SYMBOLS, SLOT_MULTIPLIERS } from '../config/games';

/** Débite la mise de façon atomique (échoue si solde insuffisant). */
async function debit(discordId: string, bet: number): Promise<UserDoc | null> {
  return User.findOneAndUpdate(
    { discordId, yumz: { $gte: bet } },
    { $inc: { yumz: -bet } },
    { returnDocument: 'after' },
  );
}

/** Crédite un gain et renvoie le nouveau solde. */
async function credit(discordId: string, amount: number): Promise<number> {
  const updated = await User.findOneAndUpdate(
    { discordId },
    { $inc: { yumz: amount } },
    { returnDocument: 'after' },
  );
  return updated?.yumz ?? 0;
}

async function currentBalance(discordId: string): Promise<number> {
  const user = await getOrCreateUser(discordId);
  return user.yumz;
}

// --- Pile ou face ---
export type CoinResult =
  | { status: 'insufficient'; balance: number }
  | { status: 'ok'; result: 'pile' | 'face'; win: boolean; bet: number; newBalance: number };

export async function playCoinflip(
  discordId: string,
  bet: number,
  choice: 'pile' | 'face',
): Promise<CoinResult> {
  const charged = await debit(discordId, bet);
  if (!charged) return { status: 'insufficient', balance: await currentBalance(discordId) };

  const result = Math.random() < 0.5 ? 'pile' : 'face';
  const win = result === choice;
  const newBalance = win ? await credit(discordId, bet * 2) : charged.yumz;

  await Transaction.create({ discordId, type: 'game_coinflip', amount: win ? bet : -bet });
  return { status: 'ok', result, win, bet, newBalance };
}

// --- Dés (joueur vs bot) ---
export type DiceResult =
  | { status: 'insufficient'; balance: number }
  | { status: 'ok'; player: number; bot: number; outcome: 'win' | 'lose' | 'tie'; bet: number; newBalance: number };

export async function playDice(discordId: string, bet: number): Promise<DiceResult> {
  const charged = await debit(discordId, bet);
  if (!charged) return { status: 'insufficient', balance: await currentBalance(discordId) };

  const player = 1 + Math.floor(Math.random() * 6);
  const botRoll = 1 + Math.floor(Math.random() * 6);

  let outcome: 'win' | 'lose' | 'tie';
  let newBalance = charged.yumz;
  if (player > botRoll) {
    outcome = 'win';
    newBalance = await credit(discordId, bet * 2);
  } else if (player === botRoll) {
    outcome = 'tie';
    newBalance = await credit(discordId, bet); // mise remboursée
  } else {
    outcome = 'lose';
  }

  await Transaction.create({
    discordId,
    type: 'game_dice',
    amount: outcome === 'win' ? bet : outcome === 'tie' ? 0 : -bet,
  });
  return { status: 'ok', player, bot: botRoll, outcome, bet, newBalance };
}

// --- Machine à sous ---
export type SlotsResult =
  | { status: 'insufficient'; balance: number }
  | { status: 'ok'; reels: string[]; multiplier: number; refund: boolean; won: number; bet: number; newBalance: number };

function spinReel(): string {
  return SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)]!;
}

export async function playSlots(discordId: string, bet: number): Promise<SlotsResult> {
  const charged = await debit(discordId, bet);
  if (!charged) return { status: 'insufficient', balance: await currentBalance(discordId) };

  const a = spinReel();
  const b = spinReel();
  const c = spinReel();

  // 3 identiques = JACKPOT (gain net = mise × multiplicateur du symbole).
  // 2 identiques = mise REMBOURSÉE (gain net 0). Sinon : perdu.
  let multiplier = 0;
  let refund = false;
  if (a === b && b === c) multiplier = SLOT_MULTIPLIERS[a] ?? 3;
  else if (a === b || b === c || a === c) refund = true;

  let won: number; // total crédité (mise rendue + gain éventuel)
  if (multiplier > 0) won = bet * (multiplier + 1);
  else if (refund) won = bet; // on rend juste la mise
  else won = 0;

  const newBalance = won > 0 ? await credit(discordId, won) : charged.yumz;

  await Transaction.create({
    discordId,
    type: 'game_slots',
    amount: won - bet, // >0 jackpot · 0 remboursé · -mise perdu
  });
  return { status: 'ok', reels: [a, b, c], multiplier, refund, won, bet, newBalance };
}
