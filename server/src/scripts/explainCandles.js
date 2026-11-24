import { connectDb, disconnectDb } from "../config/db.js";
import { Candle } from "../models/Candle.js";
await connectDb();
const plan = await Candle.find({ symbol: "BTCUSDT", interval: "1m" })
  .sort({ openTime: -1 })
  .limit(120)
  .explain("executionStats");
const s = plan.executionStats;
console.log(
  "stage:",
  JSON.stringify(plan.queryPlanner.winningPlan).slice(0, 200),
);
console.log("docs examined:", s.totalDocsExamined, " returned:", s.nReturned);
await disconnectDb();
