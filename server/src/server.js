import dns from "node:dns";

dns.setDefaultResultOrder("ipv4first");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import { env } from "./config/env.js";
import { connectDb } from "./config/db.js";
import { createApp } from "./app.js";
await connectDb(); // pehle database, phir server
createApp().listen(env.PORT, () => {
  console.log(`Server chal gaya: http://localhost:${env.PORT}`);
});
