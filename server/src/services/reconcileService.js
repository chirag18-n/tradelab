import mongoose from "mongoose";
import { Wallet } from "../models/Wallet.js";
import { LedgerEntry } from "../models/LedgerEntry.js";
// Rebuild what a wallet SHOULD contain by adding up its ledger, then compare.
// Returns a list of problems (empty list = everything matches).
export async function reconcileUser(userId) {
  // NOTE: aggregate() does NOT auto-convert strings to ObjectId like find() does.
  const uid = new mongoose.Types.ObjectId(String(userId));
  const [wallet, totals, deposits] = await Promise.all([
    Wallet.findOne({ userId: uid }).lean(),
    LedgerEntry.aggregate([
      { $match: { userId: uid } },
      { $group: { _id: "$asset", total: { $sum: "$amount" } } },
    ]),
    LedgerEntry.aggregate([
      { $match: { userId: uid, kind: "DEPOSIT" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ]);
  const problems = [];
  if (!wallet) return [{ userId: String(userId), problem: "wallet missing" }];
  const ledger = Object.fromEntries(totals.map((t) => [t._id, t.total]));
  const expectedCash = ledger.USD ?? 0;
  if (wallet.cashCents !== expectedCash) {
    problems.push({
      userId: String(userId),
      field: "cashCents",
      wallet: wallet.cashCents,
      ledger: expectedCash,
    });
  }
  const assets = new Set([
    ...Object.keys(wallet.holdings || {}),
    ...Object.keys(ledger).filter((a) => a !== "USD"),
  ]);
  for (const asset of assets) {
    const inWallet = wallet.holdings?.[asset] ?? 0;
    const inLedger = ledger[asset] ?? 0;
    if (inWallet !== inLedger)
      problems.push({
        userId: String(userId),
        field: `holdings.${asset}`,
        wallet: inWallet,
        ledger: inLedger,
      });
  }
  const expectedDeposited = deposits[0]?.total ?? 0;
  if (wallet.depositedCents !== expectedDeposited) {
    problems.push({
      userId: String(userId),
      field: "depositedCents",
      wallet: wallet.depositedCents,
      ledger: expectedDeposited,
    });
  }
  if (wallet.cashCents < 0)
    problems.push({
      userId: String(userId),
      field: "cashCents",
      wallet: wallet.cashCents,
      problem: "NEGATIVE BALANCE",
    });
  return problems;
}
export async function reconcileAll() {
  const problems = [];
  let checked = 0;
  // cursor() streams wallets one by one instead of loading them all into memory
  for await (const wallet of Wallet.find().select("userId").lean().cursor()) {
    checked += 1;
    problems.push(...(await reconcileUser(wallet.userId)));
  }
  return { checked, problems };
}
