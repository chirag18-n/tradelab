import WebSocket from "ws";
import { env, SYMBOLS } from "../config/env.js";
import { priceToCents } from "../lib/money.js";
import { wsKlineToCandle } from "../lib/klines.js";
import { publishTick } from "./priceBus.js";
import { upsertCandles, fillGap } from "./candleService.js";
// Connects to Binance's public market-data stream (no API key) and keeps
// the connection alive forever:
// - every message -> publish the live price
// - closed candle -> save it to MongoDB
// - no data for 30s, or the socket closes -> reconnect with backoff
// - after every (re)connect -> fill any gap in the candle history
export function startPriceCollector() {
  const streams = SYMBOLS.map((s) => `${s.toLowerCase()}@kline_1m`).join("/");
  const url = `${env.BINANCE_WS}/stream?streams=${streams}`;
  let ws = null;
  let watchdog = null;
  let reconnectTimer = null;
  let attempt = 0;
  function armWatchdog() {
    clearTimeout(watchdog);
    watchdog = setTimeout(() => {
      console.warn("[collector] no data for 30s, reconnecting");
      ws?.terminate(); // triggers the 'close' event below
    }, 30_000);
  }
  function scheduleReconnect() {
    clearTimeout(watchdog);
    if (reconnectTimer) return; // already scheduled
    const delay = Math.min(30_000, 1000 * 2 ** attempt) + Math.random() * 500;
    attempt += 1;
    console.warn(
      `[collector] disconnected, reconnecting in ${Math.round(delay)}ms`,
    );
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connect();
    }, delay);
  }
  function handleMessage(raw) {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }
    // Combined streams wrap every event: { stream: 'btcusdt@kline_1m', data: { e: 'kline', k: {...} } }
    const k = msg.data?.k;
    if (!k) return;
    publishTick({ symbol: k.s, priceCents: priceToCents(k.c), ts: msg.data.E });
    if (k.x) {
      // x === true means this candle just closed: it is final, safe to store.
      upsertCandles([wsKlineToCandle(k)]).catch((err) =>
        console.error("[collector] save candle failed:", err.message),
      );
    }
  }
  function connect() {
    ws = new WebSocket(url);
    ws.on("open", () => {
      attempt = 0;
      console.log("[collector] connected to Binance");
      armWatchdog();
      for (const symbol of SYMBOLS) {
        fillGap(symbol)
          .then(
            (n) =>
              n > 0 &&
              console.log(`[collector] backfilled ${n} candles for ${symbol}`),
          )
          .catch((err) =>
            console.error(
              `[collector] gap fill failed for ${symbol}:`,
              err.message,
            ),
          );
      }
    });
    ws.on("message", (raw) => {
      armWatchdog();
      handleMessage(raw);
    });
    ws.on("close", scheduleReconnect);
    ws.on("error", (err) => {
      console.error("[collector] socket error:", err.message);
      ws.terminate();
    });
  }
  connect();
  return () => {
    clearTimeout(watchdog);
    clearTimeout(reconnectTimer);
    ws?.removeAllListeners("close");
    ws?.terminate();
  };
}
