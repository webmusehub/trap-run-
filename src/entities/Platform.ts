// ─────────────────────────────────────────────────────────────────────────────
// Platform.ts — Static platform entity with pixel-art styling.
// Source of truth: ARCHITECTURE.md §35, TRD.md §27, PRD Phase 6 §4
// ─────────────────────────────────────────────────────────────────────────────

import { Entity } from './Entity.js';
import type { PlatformData } from '../data/types.js';
import { entityRect } from '../utils/math.js';
import type { Rect } from '../data/types.js';

export class Platform extends Entity {
  readonly width:  number;
  readonly height: number;

  constructor(data: PlatformData) {
    super(data.id, 'PLATFORM', { x: data.x, y: data.y });
    this.width  = data.width;
    this.height = data.height;
  }

  getBounds(): Rect {
    return entityRect(this.position.x, this.position.y, this.width, this.height);
  }

  update(_delta: number): void {}

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return;

    const { x, y } = this.position;
    const w = this.width;
    const h = this.height;

    // Dark base shadow fill
    ctx.fillStyle = '#1e2d1d';
    ctx.fillRect(x, y, w, h);

    // Stone body
    ctx.fillStyle = '#4a6b38';
    ctx.fillRect(x + 1, y + 4, w - 2, h - 5);

    // Bright top grass/stone lip for landing readability
    ctx.fillStyle = '#7dbb42';
    ctx.fillRect(x, y, w, 5);

    // Pixel brick texture details
    ctx.fillStyle = '#3b552c';
    const brickW = 24;
    for (let bx = 0; bx < w; bx += brickW) {
      ctx.fillRect(x + bx, y + 10, 1, h - 12);
      ctx.fillRect(x + bx + 8, y + 18, 1, h - 20);
    }

    // Edge outline
    ctx.strokeStyle = '#162215';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  }
}
