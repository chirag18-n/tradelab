import crypto from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { authRequired } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { tradeLimiter } from "../middleware/ratelimit.js";
import { naiveTrade } from "../services/tradeServices.naive.js";
import { getPrice } from "../services/marketCache.js";
import { SYMBOLS } from "../config/env.js";
import { parseCoins } from "../lib/money.js";
import { Errors } from "../lib/errors.js";
const router = Router();
router.use(authRequired);
const tradeSchema = z.object({
  symbol: z.string().refine((s) => SYMBOLS.includes(s), "Unknown symbol"),
  side: z.enum(["BUY", "SELL"]),
  qty: z.string(), // "0.001"
});
router.post("/", tradeLimiter, validate(tradeSchema), async (req, res) => {
  const { symbol, side, qty } = req.valid.body;
  // Price SERVER decide karta hai, client nahi. Client bola "BTC $1 ka hai" to?
  const priceCents = getPrice(symbol);
  if (!priceCents) throw Errors.priceStale();
  let qtyUnits;
  try {
    qtyUnits = parseCoins(qty);
  } catch {
    throw Errors.badRequest('qty aisa ho: "0.001"');
  }
  if (qtyUnits <= 0) throw Errors.badRequest("qty zero se zyada ho");
  const { order } = await naiveTrade({
    userId: req.userId,
    symbol,
    side,
    qtyUnits,
    priceCents,
    idempotencyKey: crypto.randomUUID(), // abhi har baar naya (Day 8 badlega)
  });
  res.status(201).json({ order });
});
export default router;
