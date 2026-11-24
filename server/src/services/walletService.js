import { LedgerEntry } from "../models/LedgerEntry.js";
import { AppError } from "../lib/errors.js";
export const MAX_DEPOSIT_CENTS = 10_000_00; // ek baar mein maximum $10,000

import { User } from "../models/User.js";
import { Wallet } from "../models/Wallet.js";
// Simple version: pehle user banao, phir uska wallet.
export async function createUserWithWallet({ email, name, passwordHash }) {
  const user = await User.create({ email, name, passwordHash });
  await Wallet.create({ userId: user._id, holdings: {} });
  return user;
}
// Simple version: pehle wallet badlo, phir ledger likho.
export async function deposit({ userId, cents }) {
  if (!Number.isInteger(cents) || cents <= 0 || cents > MAX_DEPOSIT_CENTS) {
    throw new AppError(
      "INVALID_AMOUNT",
      "Deposit $0.01 se $10,000 ke beech hona chahiye",
      400,
    );
  }
  const wallet = await Wallet.findOneAndUpdate(
    { userId },
    { $inc: { cashCents: cents, depositedCents: cents } },
    { new: true },
  );
  await LedgerEntry.create({
    userId,
    kind: "DEPOSIT",
    asset: "USD",
    amount: cents,
  });
  return { wallet: wallet.toObject() };
}
