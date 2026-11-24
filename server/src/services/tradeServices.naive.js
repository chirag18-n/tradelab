import { Wallet } from "../models/Wallet.js";
import { Order } from "../models/order.js";
import { LedgerEntry } from "../models/LedgerEntry.js";
import { baseAsset } from "../config/env.js";
import { costCents } from "../lib/money.js";
import { Errors } from "../lib/errors.js";
// Simple version: seedha, step by step. Ek click par theek chalta hai.
export async function naiveTrade({
  userId,
  symbol,
  side,
  qtyUnits,
  priceCents,
  idempotencyKey,
  source = "manual",
}) {
  const asset = baseAsset(symbol);
  const total = costCents(qtyUnits, priceCents);
  // 1. read
  const wallet = await Wallet.findOne({ userId });
  // 2. check in JavaScript
  if (side === "BUY" && wallet.cashCents < total)
    throw Errors.insufficientFunds();
  if (side === "SELL" && (wallet.holdings[asset] || 0) < qtyUnits)
    throw Errors.insufficientHoldings();
  // 3. write (anything can happen between step 1 and here)
  const sign = side === "BUY" ? 1 : -1;
  await Wallet.updateOne(
    { userId },
    {
      $inc: {
        cashCents: -sign * total,
        [`holdings.${asset}`]: sign * qtyUnits,
      },
    },
  );
  // 4. save the order (separate write)
  const order = await Order.create({
    userId,
    symbol,
    side,
    qtyUnits,
    priceCents,
    totalCents: total,
    source,
    idempotencyKey,
  });
  // 5. save the ledger rows (another separate write)
  await LedgerEntry.create([
    {
      userId,
      kind: side,
      asset: "USD",
      amount: -sign * total,
      orderId: order._id,
    },
    { userId, kind: side, asset, amount: sign * qtyUnits, orderId: order._id },
  ]);
  return { order: order.toObject() };
}
