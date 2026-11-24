// Usage: npm run backfill -- <days> [SYMBOL]
import { SYMBOLS } from "../config/env.js";
import { connectDb, disconnectDb } from "../config/db.js";
import { backfill } from "../services/candleService.js";
const days = Number(process.argv[2] || 7);
const only = process.argv[3]?.toUpperCase();
const symbols = only ? [only] : SYMBOLS;
await connectDb();
const from = Date.now() - days * 24 * 3600 * 1000;
for (const symbol of symbols) {
  console.log(`Backfilling ${days} days of ${symbol}...`);
  const total = await backfill({ symbol, from });
  console.log(`${symbol}: done, ${total} candles written`);
}
await disconnectDb();
