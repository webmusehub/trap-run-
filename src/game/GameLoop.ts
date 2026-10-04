// ─────────────────────────────────────────────────────────────────────────────
// GameLoop.ts — requestAnimationFrame loop with fixed physics timestep.
// Only responsible for timing. Contains NO gameplay logic.
// Source of truth: ARCHITECTURE.md §11-13, TRD.md §12-14
// ─────────────────────────────────────────────────────────────────────────────

import { FIXED_TIMESTEP, MAX_DELTA_TIME } from '../data/constants.js';

export type UpdateFn = (fixedDelta: number) => void;
export type RenderFn = (interpolation: number) => void;
export type FpsCallback = (fps: number) => void;

export class GameLoop {
  private _updateFn:    UpdateFn;
  private _renderFn:    RenderFn;
  private _fpsCb:       FpsCallback | null;

  private _running      = false;
  private _rafHandle    = 0;
  private _lastTime     = 0;
  private _accumulator  = 0;

  // FPS tracking
  private _fpsFrames    = 0;
  private _fpsTimer     = 0;
  private _currentFps   = 0;

  constructor(update: UpdateFn, render: RenderFn, onFps: FpsCallback | null = null) {
    this._updateFn = update;
    this._renderFn = render;
    this._fpsCb    = onFps;
  }

  start(): void {
    if (this._running) return;
    this._running     = true;
    this._lastTime    = performance.now();
    this._accumulator = 0;
    this._rafHandle   = requestAnimationFrame(this._loop);
    console.log('[GameLoop] Started.');
  }

  stop(): void {
    this._running = false;
    cancelAnimationFrame(this._rafHandle);
    console.log('[GameLoop] Stopped.');
  }

  isRunning(): boolean {
    return this._running;
  }

  getCurrentFps(): number {
    return this._currentFps;
  }

  private _loop = (timestamp: number): void => {
    if (!this._running) return;

    // ── Delta time (seconds) ──
    let delta = (timestamp - this._lastTime) / 1000;
    this._lastTime = timestamp;

    // Clamp to prevent spiral-of-death after tab switch / pause
    if (delta > MAX_DELTA_TIME) delta = MAX_DELTA_TIME;

    // ── FPS counter ──
    this._fpsFrames++;
    this._fpsTimer += delta;
    if (this._fpsTimer >= 0.5) {
      this._currentFps = Math.round(this._fpsFrames / this._fpsTimer);
      this._fpsFrames  = 0;
      this._fpsTimer   = 0;
      this._fpsCb?.(this._currentFps);
    }

    // ── Fixed-timestep physics ──
    this._accumulator += delta;
    while (this._accumulator >= FIXED_TIMESTEP) {
      this._updateFn(FIXED_TIMESTEP);
      this._accumulator -= FIXED_TIMESTEP;
    }

    // ── Render (interpolation alpha for future use) ──
    const interpolation = this._accumulator / FIXED_TIMESTEP;
    this._renderFn(interpolation);

    this._rafHandle = requestAnimationFrame(this._loop);
  };
}
