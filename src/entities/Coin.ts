// ─────────────────────────────────────────────────────────────────────────────
// Coin.ts — Collectible coin entity with rotation & sparkle animation.
// Source of truth: ARCHITECTURE.md §44, TRD.md §40, PRD Phase 6 §8
// ─────────────────────────────────────────────────────────────────────────────

import { Entity } from './Entity.js';
import type { Rect, CoinData } from '../data/types.js';
import { entityRect } from '../utils/math.js';
import { COIN_WIDTH, COIN_HEIGHT } from '../data/constants.js';

export class Coin extends Entity {
  readonly width  = COIN_WIDTH;
  readonly height = COIN_HEIGHT;

  collected = false;

  constructor(data: CoinData) {
    super(data.id, 'COLLECTIBLE', { x: data.x, y: data.y });
  }

  getBounds(): Rect {
    return entityRect(this.position.x, this.position.y, this.width, this.height);
  }

  collect(): void {
    if (this.collected) return;
    this.collected = true;
    this.active    = false;
  }

  reset(): void {
    this.collected = false;
    this.active    = true;
  }

  update(_delta: number): void {}

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.active || this.collected) return;

    const { x, y } = this.position;
    const w = this.width;
    const h = this.height;

    ctx.save();

    // Floating bobbing & 3D rotation calculation
    const time = performance.now() * 0.006;
    const floatY = Math.sin(time) * 3;
    const spinScale = Math.abs(Math.cos(time)); // 0 to 1 horizontal compression

    const cx = x + w / 2;
    const cy = y + h / 2 + floatY;
    const rx = Math.max(2, (w / 2) * spinScale);
    const ry = h / 2;

    // Gold outer ring
    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();

    // Darker gold rim
    ctx.strokeStyle = '#d68910';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Inner shine star/sparkle
    if (spinScale > 0.4) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx - rx * 0.3, cy - ry * 0.3, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
