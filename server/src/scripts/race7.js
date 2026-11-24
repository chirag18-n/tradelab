import { connectDb, disconnectDb } from "../config/db.js";
import { User } from "../models/User.js";
import { Wallet } from "../models/Wallet.js";
import { Order } from "../models/order.js";
import { LedgerEntry } from "../models/LedgerEntry.js";
import { createUserWithWallet, deposit } from "../services/walletService.js";
import { reconcileUser } from "../services/reconcileService.js";
import { naiveTrade } from "../services/tradeServices.naive.js";
const PRICE = 6_500_000; // $65,000.00 per BTC, cents mein
const ONE_TENTH_BTC = 10_000_000; // 0.1 BTC = $6,500
await connectDb();
const user = await createUserWithWallet({
  email: `race-${Date.now()}@test.dev`,
  name: "Race",
  passwordHash: "x",
});
await deposit({ userId: user._id, cents: 10_000_00 }); // $10,000
// 10 buy ek saath. Allsettled = sabka result chahiye, kuch fail ho to bhi.
const results = await Promise.allSettled(
  Array.from({ length: 10 }, (_, i) =>
    naiveTrade({
      userId: user._id,
      symbol: "BTCUSDT",
      side: "BUY",
      qtyUnits: ONE_TENTH_BTC,
      priceCents: PRICE,
      idempotencyKey: `race-${user._id}-${i}`,
    }),
  ),
);
const ok = results.filter((r) => r.status === "fulfilled").length;
const wallet = await Wallet.findOne({ userId: user._id }).lean();
console.log(
  `${ok}/10 trade pass hue. Cash bacha: $${(wallet.cashCents / 100).toFixed(2)}`,
);
console.log(
  wallet.cashCents < 0
    ? "NEGATIVE BALANCE. Paisa hawa se bana."
    : "balance theek hai.",
);
const problems = await reconcileUser(user._id);
console.log(
  problems.length
    ? `Reconcile: ${problems.length} gadbad`
    : "Reconcile: hisaab milta hai",
);
if (problems.length) console.table(problems);
await Promise.all([
  User.deleteMany({ _id: user._id }),
  Wallet.deleteMany({ userId: user._id }),
  Order.deleteMany({ userId: user._id }),
  LedgerEntry.deleteMany({ userId: user._id }),
]);
await disconnectDb();

// race7.js ke neeche (cleanup se pehle) jodo
const user2 = await createUserWithWallet({
  email: `partial-${Date.now()}@test.dev`,
  name: "P",
  passwordHash: "x",
});
await deposit({ userId: user2._id, cents: 10_000_00 });
const before = await Wallet.findOne({ userId: user2._id }).lean();
await naiveTrade({
  userId: user2._id,
  symbol: "BTCUSDT",
  side: "BUY",
  qtyUnits: 1_000_000,
  priceCents: PRICE,
  idempotencyKey: "p1",
  source: "bogus",
}).catch((e) => console.log("trade toota:", e.message.slice(0, 60)));
const after = await Wallet.findOne({ userId: user2._id }).lean();
console.log(
  `cash pehle $${before.cashCents / 100}, baad mein $${after.cashCents / 100}`,
);
console.table(await reconcileUser(user2._id));
