import { priceToCents } from "./money.js";
// Binance REST /api/v3/klines returns an array of arrays. Every price is a STRING:
// [ openTime, open, high, low, close, volume, closeTime, quoteVolume, trades, ... ]
export function klineRowToCandle(symbol, interval, row) {
  return {
    symbol,
    interval,
    openTime: new Date(row[0]),
    o: priceToCents(row[1]),
    h: priceToCents(row[2]),
    l: priceToCents(row[3]),
    c: priceToCents(row[4]),
    v: Number(row[5]),
  };
}
