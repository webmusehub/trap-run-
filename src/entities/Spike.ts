// ─────────────────────────────────────────────────────────────────────────────
// Spike.ts — Static hazard entity with sharp pixel-art silhouette.
// Source of truth: ARCHITECTURE.md §37, TRD.md §28, PRD Phase 6 §5
// ─────────────────────────────────────────────────────────────────────────────

import { Entity } from './Entity.js';
import type { Rect, HazardData } from '../data/types.js';
import { entityRect } from '../utils/math.js';

export class Spike extends Entity {
  readonly width: number;
  readonly height: number;

  constructor(data: HazardData) {
    super(data.id, 'HAZARD', { x: data.x, y: data.y });
    this.width = data.width;
    this.height = data.height;
  }

  getBounds(): Rect {
    // 2px side inset and 4px top inset so empty top corners of triangular spikes don't trigger unfair hits
    return entityRect(
      this.position.x + 2,
      this.position.y + 4,
      Math.max(1, this.width - 4),
      Math.max(1, this.height - 4),
    );
  }

  update(_delta: number): void {}

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return;

    const { x, y } = this.position;
    const w = this.width;
    const h = this.height;

    // Draw individual sharp triangular spikes
    const spikeW = 16;
    const spikeCount = Math.max(1, Math.floor(w / spikeW));

    ctx.save();
    for (let i = 0; i < spikeCount; i++) {
      const sx = x + i * spikeW;

      // Dark shadow silhouette behind spike
      ctx.fillStyle = '#1a0d0d';
      ctx.beginPath();
      ctx.moveTo(sx - 1, y + h);
      ctx.lineTo(sx + spikeW / 2, y - 2);
      ctx.lineTo(sx + spikeW + 1, y + h);
      ctx.closePath();
      ctx.fill();

      // Sharp metallic iron spike body
      ctx.fillStyle = '#7f8c8d';
      ctx.beginPath();
      ctx.moveTo(sx + 1, y + h);
      ctx.lineTo(sx + spikeW / 2, y + 2);
      ctx.lineTo(sx + spikeW - 1, y + h);
      ctx.closePath();
      ctx.fill();

      // Sharp metallic highlight edge
      ctx.fillStyle = '#bdc3c7';
      ctx.beginPath();
      ctx.moveTo(sx + 1, y + h);
      ctx.lineTo(sx + spikeW / 2, y + 2);
      ctx.lineTo(sx + spikeW / 2, y + h);
      ctx.closePath();
      ctx.fill();

      // Crimson danger tip highlight
      ctx.fillStyle = '#c0392b';
      ctx.beginPath();
      ctx.moveTo(sx + spikeW / 2 - 2, y + 7);
      ctx.lineTo(sx + spikeW / 2, y + 2);
      ctx.lineTo(sx + spikeW / 2 + 2, y + 7);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
}
