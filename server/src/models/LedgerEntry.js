import mongoose from "mongoose";
// APPEND-ONLY. We never update or delete a ledger entry.
// The wallet holds the current balance (fast to read); the ledger holds the
// history that explains it. If the two ever disagree, the ledger wins and
// scripts/reconcile.js tells us which wallet is wrong.
const ledgerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    kind: { type: String, enum: ["DEPOSIT", "BUY", "SELL"], required: true },
    asset: { type: String, required: true }, // 'USD' or a coin like 'BTC'
    amount: { type: Number, required: true }, // signed integer: cents for USD, units for coins
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    idempotencyKey: { type: String, default: undefined }, // only DEPOSIT rows use this
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
// "Show me my latest entries", newest first. ObjectIds grow over time, so sorting
// by _id is sorting by time, and it lets us paginate with "_id < lastSeenId"
// (keyset pagination) instead of slow skip().
ledgerSchema.index({ userId: 1, _id: -1 });
// Reconcile / balance rebuild groups by user and asset.
ledgerSchema.index({ userId: 1, asset: 1 });
// A deposit retried with the same key must not credit twice.
ledgerSchema.index(
  { userId: 1, idempotencyKey: 1 },
  {
    unique: true,
    partialFilterExpression: { idempotencyKey: { $type: "string" } },
  },
);
export const LedgerEntry = mongoose.model("LedgerEntry", ledgerSchema);
