import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { Errors } from "../lib/errors.js";
export function signToken(userId) {
  return jwt.sign({ sub: String(userId) }, env.JWT_SECRET, { expiresIn: "7d" });
}
// Reads "Authorization: Bearer <token>", verifies it, puts the user id on req.
export function authRequired(req, _res, next) {
  const header = req.get("authorization") || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) throw Errors.unauthorized();
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    req.userId = payload.sub;
    next();
  } catch {
    throw Errors.unauthorized();
  }
}
