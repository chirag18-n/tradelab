import { AppError } from "../lib/errors.js";
// validate(schema, 'body') parses req.body with a zod schema.
// On success req.body is replaced by the CLEAN parsed value (unknown keys dropped).
// On failure we answer 400 with a readable list of problems.
export const validate =
  (schema, part = "body") =>
  (req, _res, next) => {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      }));
      const err = new AppError("VALIDATION_ERROR", "Invalid input", 400);
      err.details = details;
      throw err;
    }
    // In Express 5 req.query is a getter, so we store clean data on req.valid instead.
    req.valid = { ...(req.valid || {}), [part]: result.data };
    next();
  };
// Idempotency-Key header: the client creates one random id per user action
// and re-sends the SAME id when it retries.
export function requireIdempotencyKey(req, _res, next) {
  const key = req.get("idempotency-key");
  if (!key || key.length < 8 || key.length > 100) {
    throw new AppError(
      "IDEMPOTENCY_KEY_REQUIRED",
      "Send an Idempotency-Key header (8-100 chars)",
      400,
    );
  }
  req.idempotencyKey = key;
  next();
}
