import mongoose from "mongoose";
import express from "express";
import practiceRoutes from "./routes/practice.js";
import cors from "cors";
export function createApp() {
  const app = express();
  app.use(cors()); // browser ko is server se baat karne ki ijazat
  app.use(express.json()); // request ki JSON body ko padh ke req.body mein rakhta hai
  app.get("/", (req, res) => {
    res.json({ message: "TradeLab API chal rahi hai" });
  });
  app.get("/health", (req, res) => {
    const up = mongoose.connection.readyState === 1; // 1 = connected
    res.status(up ? 200 : 503).json({ ok: up });
  });
  // ... app.get('/health', ...) ke neeche, return app; se pehle:
  app.use("/api/practice", practiceRoutes);
  app.use((req, res) => {
    res.status(404).json({ error: "Yeh route nahi mila" });
  });

  return app;
}
