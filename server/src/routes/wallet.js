import { Router } from "express";
import { z } from "zod";
import { authRequired } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { tradeLimiter } from "../middleware/ratelimit.js";
import { deposit } from "../services/walletService.js";
import { parseUsd } from "../lib/money.js";
import { Errors } from "../lib/errors.js";
import { LedgerEntry } from "../models/LedgerEntry.js";
import { Wallet } from "../models/Wallet.js";
const router = Router();
router.use(authRequired); // is file ke har route ke liye login zaroori
// Amount ek STRING hai ("250.00"), taaki float kabhi andar na aaye.
const depositSchema = z.object({ amountUsd: z.string() });
router.post(
  "/deposit",
  tradeLimiter,
  validate(depositSchema),
  async (req, res) => {
    let cents;
    try {
      cents = parseUsd(req.valid.body.amountUsd);
    } catch {
      throw Errors.badRequest(
        'amountUsd aisa hona chahiye: "250.00" (max 2 decimal)',
      );
    }
    const { wallet } = await deposit({ userId: req.userId, cents });
    res.status(201).json({ wallet });
  },
);

//part2
// Keyset pagination: "give me 20 entries older than the last one I saw".
// Unlike skip(), the cost does not grow as the user's history grows.
const pageSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  before: z.string().optional(),
});
router.get("/ledger", validate(pageSchema, "query"), async (req, res) => {
  const { limit, before } = req.valid.query;
  const filter = {
    userId: req.userId,
    ...(before ? { _id: { $lt: before } } : {}),
  };
  const rows = await LedgerEntry.find(filter)
    .sort({ _id: -1 })
    .limit(limit)
    .lean();
  res.json({
    entries: rows,
    nextBefore: rows.length === limit ? rows[rows.length - 1]._id : null,
  });
});

//part3
router.get("/", async (req, res) => {
  const wallet = await Wallet.findOne({ userId: req.userId }).lean();
  res.json({ wallet });
});

export default router;
