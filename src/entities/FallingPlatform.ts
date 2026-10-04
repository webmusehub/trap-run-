// ─────────────────────────────────────────────────────────────────────────────
// FallingPlatform.ts — Platform that collapses after player lands on it.
// Normal state -> warning shake -> falling.
// Source of truth: ARCHITECTURE.md §36, TRD.md §34-35, PRD Phase 6 §4
// ─────────────────────────────────────────────────────────────────────────────

import { Entity } from './Entity.js';
import type { Rect, FallingPlatformData, TrapState, Vector2 } from '../data/types.js';
import { entityRect } from '../utils/math.js';

export class FallingPlatform extends Entity {
  readonly width: number;
  readonly height: number;

  readonly triggerDelay: number;
  readonly shakeDuration: number;
  readonly fallSpeed: number;
  readonly initialPos: Vector2;

  trapState: TrapState = 'idle';

  private _timer = 0;
  private _shakeX = 0;

  constructor(data: FallingPlatformData) {
    super(data.id, 'FALLING_PLATFORM', { x: data.x, y: data.y });
    this.width = data.width;
    this.height = data.height;
    this.initialPos = { x: data.x, y: data.y };
    this.triggerDelay = data.triggerDelay ?? 500;
    this.shakeDuration = data.shakeDuration ?? 200;
    this.fallSpeed = data.fallSpeed ?? 600;
  }

  get isSolid(): boolean {
    return this.active && (this.trapState === 'idle' || this.trapState === 'triggered' || this.trapState === 'warning');
  }

  getBounds(): Rect {
    return entityRect(this.position.x, this.position.y, this.width, this.height);
  }

  onPlayerLand(): void {
    if (this.trapState === 'idle') {
      this.trapState = 'triggered';
      this._timer = 0;
    }
  }

  reset(): void {
    this.position = { x: this.initialPos.x, y: this.initialPos.y };
    this.trapState = 'idle';
    this._timer = 0;
    this._shakeX = 0;
    this.active = true;
  }

  update(delta: number): void {
    if (!this.active) return;

    if (this.trapState === 'triggered' || this.trapState === 'warning') {
      this._timer += delta * 1000;

      if (this._timer >= (this.triggerDelay - this.shakeDuration)) {
        this.trapState = 'warning';
        this._shakeX = (Math.random() - 0.5) * 8;
      }

      if (this._timer >= this.triggerDelay) {
        this.trapState = 'active';
      }
    }

    if (this.trapState === 'active') {
      this._shakeX = 0;
      this.position.y += this.fallSpeed * delta;

      if (this.position.y > this.initialPos.y + 1000) {
        this.trapState = 'disabled';
        this.active = false;
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return;

    const x = this.position.x + this._shakeX;
    const y = this.position.y;
    const w = this.width;
    const h = this.height;

    // Background body depending on state
    if (this.trapState === 'warning') {
      ctx.fillStyle = '#d35400'; // Shaking warning orange/amber
    } else if (this.trapState === 'active') {
      ctx.fillStyle = '#a04000'; // Falling crumbling state
    } else {
      ctx.fillStyle = '#626567'; // Idle cracked crumbling stone
    }

    ctx.fillRect(x, y, w, h);

    // Top surface lip
    ctx.fillStyle = this.trapState === 'warning' ? '#e67e22' : '#95a5a6';
    ctx.fillRect(x, y, w, 4);

    // Deep crack patterns
    ctx.strokeStyle = '#1c2833';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.25, y);
    ctx.lineTo(x + w * 0.35, y + h * 0.6);
    ctx.lineTo(x + w * 0.65, y + h);
    ctx.moveTo(x + w * 0.7, y);
    ctx.lineTo(x + w * 0.6, y + h * 0.5);
    ctx.lineTo(x + w * 0.85, y + h);
    ctx.stroke();

    // Dark outline
    ctx.strokeStyle = '#212f3d';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  }
}
