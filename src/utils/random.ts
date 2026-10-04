// ─────────────────────────────────────────────────────────────────────────────
// random.ts — Generic randomness helpers.
// Source of truth: ARCHITECTURE.md §78
// ─────────────────────────────────────────────────────────────────────────────

/** Random float in [min, max). */
export function randomFloat(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/** Random integer in [min, max] (inclusive). */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Random sign: returns +1 or -1 with equal probability. */
export function randomSign(): 1 | -1 {
  return Math.random() < 0.5 ? 1 : -1;
}

/** Pick a random element from an array. */
export function randomPick<T>(arr: ReadonlyArray<T>): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
