// ─────────────────────────────────────────────────────────────────────────────
// CameraSystem.ts — 2D camera that follows the player with lerp smoothing & screen shake.
// Operates in virtual world coordinates. Does NOT touch DOM dimensions.
// Source of truth: ARCHITECTURE.md §57-58, TRD.md §50-51, PRD Phase 6 §12-13
// ─────────────────────────────────────────────────────────────────────────────

import type { Player }   from '../entities/Player.js';
import { lerp }          from '../utils/math.js';
import { GAME_CONFIG }   from '../game/GameConfig.js';

export class CameraSystem {
  /** Top-left corner of the camera in world coordinates. */
  x = 0;
  y = 0;

  /** Current frame screen shake offsets. */
  shakeX = 0;
  shakeY = 0;

  private _smoothing: number;
  private _viewW: number;
  private _viewH: number;

  // World bounds (set when a level loads)
  private _minX = 0;
  private _minY = 0;
  private _maxX = 0;
  private _maxY = 0;

  // Screen shake state
  private _shakeIntensity = 0;
  private _shakeTimer = 0; // seconds remaining

  constructor() {
    this._smoothing = GAME_CONFIG.camera.smoothing;
    this._viewW     = GAME_CONFIG.canvas.width;
    this._viewH     = GAME_CONFIG.canvas.height;
  }

  /** Call when a level loads to set the scrollable world bounds. */
  setBounds(worldWidth: number, worldHeight: number): void {
    this._minX = 0;
    this._minY = 0;
    this._maxX = Math.max(0, worldWidth  - this._viewW);
    this._maxY = Math.max(0, worldHeight - this._viewH);
  }

  /**
   * Trigger screen shake effect.
   * Respects user setting — if screenShakeEnabled is false, shake is ignored.
   */
  triggerShake(intensity: number, durationSec: number, screenShakeEnabled: boolean = true): void {
    if (!screenShakeEnabled) {
      this._shakeIntensity = 0;
      this._shakeTimer = 0;
      this.shakeX = 0;
      this.shakeY = 0;
      return;
    }
    this._shakeIntensity = intensity;
    this._shakeTimer     = durationSec;
  }

  /**
   * Smoothly move camera to keep player centred and calculate screen shake offset.
   * Call once per fixed physics tick.
   */
  update(player: Player, delta: number = 1 / 60, screenShakeEnabled: boolean = true): void {
    // Desired top-left so the player is centred in the viewport
    const targetX = player.position.x + player.width  / 2 - this._viewW / 2;
    const targetY = player.position.y + player.height / 2 - this._viewH / 2;

    // Lerp toward target
    this.x = lerp(this.x, targetX, this._smoothing);
    this.y = lerp(this.y, targetY, this._smoothing);

    // Clamp to world bounds (never show outside the level)
    this.x = Math.max(this._minX, Math.min(this._maxX, this.x));
    this.y = Math.max(this._minY, Math.min(this._maxY, this.y));

    // Update screen shake
    if (this._shakeTimer > 0 && screenShakeEnabled) {
      this._shakeTimer -= delta;
      if (this._shakeTimer <= 0) {
        this._shakeTimer = 0;
        this.shakeX = 0;
        this.shakeY = 0;
      } else {
        const factor = this._shakeTimer / 0.3; // decay relative scale
        const currentIntensity = Math.min(this._shakeIntensity, this._shakeIntensity * factor);
        this.shakeX = (Math.random() - 0.5) * 2 * currentIntensity;
        this.shakeY = (Math.random() - 0.5) * 2 * currentIntensity;
      }
    } else {
      this.shakeX = 0;
      this.shakeY = 0;
    }
  }

  /** Snap the camera immediately to the player (no lerp). Used on spawn/respawn. */
  snapToPlayer(player: Player): void {
    this.x = player.position.x + player.width  / 2 - this._viewW / 2;
    this.y = player.position.y + player.height / 2 - this._viewH / 2;
    this.x = Math.max(this._minX, Math.min(this._maxX, this.x));
    this.y = Math.max(this._minY, Math.min(this._maxY, this.y));
    this.shakeX = 0;
    this.shakeY = 0;
  }

  /** Convert a world X coordinate to screen X. */
  worldToScreenX(worldX: number): number {
    return worldX - this.x + this.shakeX;
  }

  worldToScreenY(worldY: number): number {
    return worldY - this.y + this.shakeY;
  }
}
