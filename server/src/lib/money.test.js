import { test } from "node:test";
import assert from "node:assert/strict";
import { parseUsd, parseCoins, priceToCents, costCents } from "./money.js";
test("parseUsd", () => {
  assert.equal(parseUsd("12.34"), 1234);
  assert.equal(parseUsd("12.5"), 1250);
  assert.equal(parseUsd("0.01"), 1);
  assert.throws(() => parseUsd("12.345"));
  assert.throws(() => parseUsd("-5"));
});
test("parseCoins", () => {
  assert.equal(parseCoins("0.001"), 100000);
  assert.equal(parseCoins("1"), 100000000);
  assert.throws(() => parseCoins("0.123456789"));
});
test("priceToCents", () => {
  assert.equal(priceToCents("64321.12000000"), 6432112);
});
test("costCents", () => {
  // 0.1 BTC at $65,000.00 = $6,500.00 = 650000 cents
  assert.equal(costCents(10_000_000, 6_500_000), 650_000);
});
