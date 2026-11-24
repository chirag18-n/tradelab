import { EventEmitter } from "node:events";
// "Price bus": collector ek tick announce karta hai, jise chahiye woh sunta hai.
const emitter = new EventEmitter();
// tick = { symbol, priceCents, ts }
export function publishTick(tick) {
  emitter.emit("tick", tick);
}
export function onTick(fn) {
  emitter.on("tick", fn);
}
export async function initBus() {}
