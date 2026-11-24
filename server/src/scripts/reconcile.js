// Usage: npm run reconcile
// Checks every wallet against its ledger. Prints problems, exits with code 1 if any.
import { connectDb, disconnectDb } from "../config/db.js";
import { reconcileAll } from "../services/reconcileService.js";
await connectDb();
const { checked, problems } = await reconcileAll();
console.log(`Checked ${checked} wallets.`);
if (problems.length === 0) {
  console.log("All wallets match their ledger.");
} else {
  console.log(`${problems.length} problem(s):`);
  console.table(problems);
}
await disconnectDb();
process.exit(problems.length === 0 ? 0 : 1);
