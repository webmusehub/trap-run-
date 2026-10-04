// ─────────────────────────────────────────────────────────────────────────────
// HiddenSpike.ts — Subterranean spike hazard that rises when triggered.
// Follows trap fairness rule: subtle warning clue before becoming lethal.
// Source of truth: ARCHITECTURE.md §37, TRD.md §37, GDD §18 (Trap 2), LEVEL_DESIGN §10
// ─────────────────────────────────────────────────────────────────────────────

import { Entity } from './Entity.js';
import type { Rect, HazardData, TrapState, Vector2 } from '../data/types.js';
import { entityRect } from '../utils/math.js';

export class HiddenSpike extends Entity {
  readonly width: number;
  readonly height: number;
  readonly triggerDistance: number;
  readonly warningDuration: number; // ms
  readonly riseDuration: number;    // ms

  trapState: TrapState = 'idle';

  private _timer = 0;
  private _extensionRatio = 0; // 0.0 (hidden) to 1.0 (fully extended)
  private _initialPos: Vector2;

  constructor(data: HazardData) {
    super(data.id, 'HAZARD', { x: data.x, y: data.y });
    this.width = data.width;
    this.height = data.height;
    this._initialPos = { x: data.x, y: data.y };

    const props = data.properties || {};
    this.triggerDistance = typeof props.triggerDistance === 'number' ? props.triggerDistance : 120;
    this.warningDuration = typeof props.warningDuration === 'number' ? props.warningDuration : 250;
    this.riseDuration    = typeof props.riseDuration === 'number'    ? props.riseDuration    : 150;
  }

  /** Only lethal when activating or active. */
  get isLethal(): boolean {
    return this.active && (this.trapState === 'activating' || this.trapState === 'active') && this._extensionRatio > 0.3;
  }

  getBounds(): Rect {
    // Effective collision height scales with spike extension
    const currentHeight = Math.max(4, this.height * this._extensionRatio);
    const currentY = this._initialPos.y + (this.height - currentHeight);
    return entityRect(this.position.x, currentY, this.width, currentHeight);
  }

  /** Trigger activation from proximity check or external trigger. */
  trigger(): void {
    if (this.trapState === 'idle') {
      this.trapState = 'warning';
      this._timer = 0;
    }
  }

  /** Check proximity to player position. */
  checkProximity(playerPos: Vector2): void {
    if (this.trapState !== 'idle') return;

    const dx = (this.position.x + this.width / 2) - playerPos.x;
    const dy = (this.position.y + this.height / 2) - playerPos.y;
    const dist = Math.hypot(dx, dy);

    if (dist <= this.triggerDistance) {
      this.trigger();
    }
  }

  reset(): void {
    this.position = { x: this._initialPos.x, y: this._initialPos.y };
    this.trapState = 'idle';
    this._timer = 0;
    this._extensionRatio = 0;
    this.active = true;
  }

  update(delta: number): void {
    if (!this.active) return;

    const deltaMs = delta * 1000;

    if (this.trapState === 'warning') {
      this._timer += deltaMs;
      if (this._timer >= this.warningDuration) {
        this.trapState = 'activating';
        this._timer = 0;
      }
    } else if (this.trapState === 'activating') {
      this._timer += deltaMs;
      this._extensionRatio = Math.min(1.0, this._timer / this.riseDuration);
      if (this._extensionRatio >= 1.0) {
        this.trapState = 'active';
        this._extensionRatio = 1.0;
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return;

    const { x, y } = this._initialPos;
    const w = this.width;
    const h = this.height;

    // Base slot frame in floor
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(x, y + h - 6, w, 6);

    if (this.trapState === 'warning') {
      // Subtle red glow warning indicator
      ctx.fillStyle = 'rgba(231, 76, 60, 0.4)';
      ctx.fillRect(x, y + h - 10, w, 4);
    } else if (this._extensionRatio > 0) {
      // Draw rising red spikes
      const spikeH = h * this._extensionRatio;
      const spikeY = y + (h - spikeH);

      ctx.fillStyle = '#c0392b';
      ctx.strokeStyle = '#922b21';
      ctx.lineWidth = 1;

      const numSpikes = Math.max(1, Math.floor(w / 16));
      const spikeW = w / numSpikes;

      ctx.beginPath();
      for (let i = 0; i < numSpikes; i++) {
        const sx = x + i * spikeW;
        ctx.moveTo(sx, y + h);
        ctx.lineTo(sx + spikeW / 2, spikeY);
        ctx.lineTo(sx + spikeW, y + h);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }
}
