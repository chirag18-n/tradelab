import { initBus, onTick } from "./priceBus.js";
import { baseAsset } from "../config/env.js";
// Latest price per symbol, kept in memory. A cache read costs nothing,
// so thousands of users can ask for prices without touching MongoDB or Binance.
const prices = new Map(); // 'BTCUSDT' -> { priceCents, ts }
export function setPrice(symbol, priceCents, ts = Date.now()) {
  prices.set(symbol, { priceCents, ts });
}
// Returns priceCents, or null if we have no price OR the price is too old.
// A trade at a 2-minute-old price would be unfair, so stale = no trade.
export function getPrice(symbol, maxAgeMs = 15_000) {
  const p = prices.get(symbol);
  if (!p || Date.now() - p.ts > maxAgeMs) return null;
  return p.priceCents;
}
// { BTC: 6432112, ETH: ... } (cents), only fresh prices
export function getPricesByAsset(maxAgeMs = 15_000) {
  const out = {};
  for (const symbol of prices.keys()) {
    const price = getPrice(symbol, maxAgeMs);
    if (price !== null) out[baseAsset(symbol)] = price;
  }
  return out;
}
// For the websocket broadcast: includes timestamps so the UI can show "stale".
export function snapshotForClients() {
  const out = {};
  for (const [symbol, p] of prices.entries())
    out[symbol] = { priceCents: p.priceCents, ts: p.ts };
  return out;
}
export async function startMarketCache() {
  await initBus();
  onTick((t) => setPrice(t.symbol, t.priceCents, t.ts));
}
