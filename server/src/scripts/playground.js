import { connectDb, disconnectDb } from "../config/db.js";
import { User } from "../models/User.js";
import { Wallet } from "../models/Wallet.js";
await connectDb();
await User.init(); // indexes ban jaane tak ruko
await User.deleteMany({ email: "play@test.dev" }); // saaf shuruaat
// CREATE
const user = await User.create({
  email: "PLAY@Test.dev",
  name: "Play User",
  passwordHash: "abc",
});
console.log(
  "1. create ->",
  user.email,
  "(chhota ho gaya), id =",
  user._id.toString(),
);
const wallet = await Wallet.create({ userId: user._id });
console.log(" wallet -> cash", wallet.cashCents, "holdings", wallet.holdings);
// READ
const found = await User.findOne({ email: "play@test.dev" });
console.log("2. find ->", found.name);
// UPDATE ($inc = "itna jodo", purani value padhne ki zaroorat nahi)
await Wallet.updateOne({ userId: user._id }, { $inc: { cashCents: 5000 } });
const after = await Wallet.findOne({ userId: user._id }).lean();
console.log(
  "3. update -> cash",
  after.cashCents,
  "cents = $" + (after.cashCents / 100).toFixed(2),
);
// Galtiyan bhi dekho
try {
  await User.create({
    email: "play@test.dev",
    name: "Duplicate",
    passwordHash: "x",
  });
} catch (err) {
  console.log(
    "4. duplicate email ->",
    err.code,
    "(11000 = unique index ne roka)",
  );
}
try {
  await User.create({ email: "no-name@test.dev" });
} catch (err) {
  console.log("5. validation ->", err.message);
}
// DELETE
await User.deleteMany({ email: "play@test.dev" });
await Wallet.deleteMany({ userId: user._id });
console.log("6. delete -> saaf");
await disconnectDb();
