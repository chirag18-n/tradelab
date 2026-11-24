import mongoose from "mongoose";
// One wallet per user. Holdings are EMBEDDED in the wallet document
// ({ BTC: 100000, ETH: 0 }) because:
// - they are always read together with the cash balance
// - a single-document update is atomic in MongoDB, so cash and holdings
// can change together safely with one $inc
const walletSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    cashCents: { type: Number, default: 0 }, // integer cents
    depositedCents: { type: Number, default: 0 }, // denormalized: total fake money ever loaded
    holdings: { type: mongoose.Schema.Types.Mixed, default: {} }, // { BTC: units, ... } units = 1e-8 coin
  },
  { timestamps: true, minimize: false },
);
walletSchema.index({ userId: 1 }, { unique: true });
export const Wallet = mongoose.model("Wallet", walletSchema);
