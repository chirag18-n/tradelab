// src/scripts/wsPeek.js : 10 second ka live stream print karo
import WebSocket from "ws";
const ws = new WebSocket(
  "wss://data-stream.binance.vision:443/stream?streams=btcusdt@kline_1m",
);
ws.on("message", (raw) => {
  const k = JSON.parse(raw).data.k;
  console.log(k.s, "close =", k.c, " band hua?", k.x);
});
setTimeout(() => ws.close(), 10_000);
