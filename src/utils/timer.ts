// ─────────────────────────────────────────────────────────────────────────────
// timer.ts — Reusable game timer. Used by level timer, trap delays, etc.
// Source of truth: ARCHITECTURE.md §80, TRD.md §48-49
// ─────────────────────────────────────────────────────────────────────────────

export class Timer {
  private _elapsed = 0;       // seconds
  private _running = false;

  start(): void {
    this._running = true;
  }

  pause(): void {
    this._running = false;
  }

  resume(): void {
    this._running = true;
  }

  stop(): void {
    this._running = false;
  }

  reset(): void {
    this._elapsed = 0;
    this._running = false;
  }

  restart(): void {
    this._elapsed = 0;
    this._running = true;
  }

  /** Call once per physics tick with the fixed delta (seconds). */
  update(delta: number): void {
    if (this._running) {
      this._elapsed += delta;
    }
  }

  getElapsed(): number {
    return this._elapsed;
  }

  isRunning(): boolean {
    return this._running;
  }

  /**
   * Format elapsed seconds as MM:SS.cc
   * Example: 90.5 → "01:30.50"
   */
  static format(seconds: number): string {
    const m  = Math.floor(seconds / 60);
    const s  = Math.floor(seconds % 60);
    const cs = Math.floor((seconds % 1) * 100);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
  }
}

/**
 * One-shot countdown. Calls `onComplete` when it reaches zero.
 * Does NOT auto-reset; call reset() to reuse.
 */
export class Countdown {
  private _remaining: number;
  private _initial: number;
  private _running = false;
  private _done = false;
  private _onComplete: (() => void) | null;

  constructor(seconds: number, onComplete: (() => void) | null = null) {
    this._initial   = seconds;
    this._remaining = seconds;
    this._onComplete = onComplete;
  }

  start(): void {
    this._running = true;
    this._done    = false;
  }

  stop(): void {
    this._running = false;
  }

  reset(): void {
    this._remaining = this._initial;
    this._running   = false;
    this._done      = false;
  }

  update(delta: number): void {
    if (!this._running || this._done) return;
    this._remaining -= delta;
    if (this._remaining <= 0) {
      this._remaining = 0;
      this._done      = true;
      this._running   = false;
      this._onComplete?.();
    }
  }

  getRemaining(): number {
    return this._remaining;
  }

  isDone(): boolean {
    return this._done;
  }
}
