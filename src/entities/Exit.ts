// ─────────────────────────────────────────────────────────────────────────────
// Exit.ts — Level exit entity with animated portal swirl.
// Source of truth: ARCHITECTURE.md §41, TRD.md §38, PRD Phase 6 §10
// ─────────────────────────────────────────────────────────────────────────────

import { Entity } from './Entity.js';
import type { Rect, ExitData, ExitType } from '../data/types.js';
import { entityRect } from '../utils/math.js';

export class Exit extends Entity {
  readonly width: number;
  readonly height: number;
  readonly exitType: ExitType;

  constructor(data: ExitData) {
    super(data.id, 'EXIT', { x: data.x, y: data.y });
    this.width = data.width;
    this.height = data.height;
    this.exitType = data.type;
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

    ctx.save();

    // Outer portal frame glow
    ctx.fillStyle = '#1e8449';
    ctx.fillRect(x, y, w, h);

    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(x + 3, y + 3, w - 6, h - 6);

    // Inner glowing swirling portal core
    const time = performance.now() * 0.004;
    const pulse = Math.sin(time) * 4;

    ctx.fillStyle = '#abebc6';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2, Math.max(2, (w / 2 - 8) + pulse), Math.max(2, (h / 2 - 8) - pulse), 0, 0, Math.PI * 2);
    ctx.fill();

    // Swirling portal rings
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2, Math.max(2, w / 4), Math.max(2, h / 4), time, 0, Math.PI * 2);
    ctx.stroke();

    // EXIT text label
    ctx.fillStyle = '#145a32';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('EXIT', x + w / 2, y + h / 2 + 5);
    ctx.textAlign = 'left';

    ctx.restore();
  }
}
