import { User } from "../models/User.js";
import { Wallet } from "../models/Wallet.js";
// Simple version: pehle user banao, phir uska wallet.
export async function createUserWithWallet({ email, name, passwordHash }) {
  const user = await User.create({ email, name, passwordHash });
  await Wallet.create({ userId: user._id, holdings: {} });
  return user;
}
