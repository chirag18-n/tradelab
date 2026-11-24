import dns from "node:dns";

dns.setDefaultResultOrder("ipv4first");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import http from "node:http";
import { Server } from "socket.io";
import { env, isTrue } from "./config/env.js";
import { connectDb } from "./config/db.js";
import { createApp } from "./app.js";
import {
  startMarketCache,
  snapshotForClients,
} from "./services/marketCache.js";
import { startPriceCollector } from "./services/priceCollector.js";
await connectDb();
const server = http.createServer(createApp());
const io = new Server(server, { cors: { origin: env.CLIENT_ORIGIN } });
await startMarketCache();
setInterval(() => io.emit("prices", snapshotForClients()), 1000); // 1 second mein ek baar sabko
if (isTrue(env.RUN_COLLECTOR)) startPriceCollector();
server.listen(env.PORT, () =>
  console.log(`[server] listening on :${env.PORT}`),
);
