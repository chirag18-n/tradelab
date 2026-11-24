import mongoose from "mongoose";
import express from "express";
import authRoutes from "./routes/auth.js";
import { generalLimiter } from "./middleware/rateLimit.js";
import walletRoutes from "./routes/wallet.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

import cors from "cors";
export function createApp() {
  const app = express();
  app.use(cors()); // browser ko is server se baat karne ki ijazat
  app.use(express.json()); // request ki JSON body ko padh ke req.body mein rakhta hai
  app.use("/api", generalLimiter);
  app.use("/api/auth", authRoutes);
  app.use("/api/wallet", walletRoutes);

  app.get("/", (req, res) => {
    res.json({ message: "TradeLab API chal rahi hai" });
  });
  app.get("/health", (req, res) => {
    const up = mongoose.connection.readyState === 1; // 1 = connected
    res.status(up ? 200 : 503).json({ ok: up });
  });
  // practice routes aur purana 404 handler ab hata do. Sabse neeche:
  app.use(notFoundHandler);
  app.use(errorHandler); // error handler HAMESHA sabse aakhri

  return app;
}
