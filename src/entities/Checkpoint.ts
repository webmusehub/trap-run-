// ─────────────────────────────────────────────────────────────────────────────
// Checkpoint.ts — Checkpoint beacon entity with active glow & flag animation.
// Source of truth: ARCHITECTURE.md §42-43, TRD.md §39, PRD Phase 6 §9
// ─────────────────────────────────────────────────────────────────────────────

import { Entity } from './Entity.js';
import type { Rect, CheckpointData } from '../data/types.js';
import { entityRect } from '../utils/math.js';
import { CHECKPOINT_WIDTH, CHECKPOINT_HEIGHT } from '../data/constants.js';

export class Checkpoint extends Entity {
  readonly width:  number;
  readonly height: number;

  activated = false;

  constructor(data: CheckpointData) {
    super(data.id, 'CHECKPOINT', { x: data.x, y: data.y });
    this.width  = data.width  || CHECKPOINT_WIDTH;
    this.height = data.height || CHECKPOINT_HEIGHT;
  }

  getBounds(): Rect {
    return entityRect(this.position.x, this.position.y, this.width, this.height);
  }

  activate(): boolean {
    if (this.activated) return false;
    this.activated = true;
    return true;
  }

  reset(): void {
    this.activated = false;
    this.active    = true;
  }

  update(_delta: number): void {}

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return;

    const { x, y } = this.position;
    const w = this.width;
    const h = this.height;

    ctx.save();

    // Metallic pole base
    ctx.fillStyle = '#34495e';
    ctx.fillRect(x + w / 2 - 3, y, 6, h);

    if (this.activated) {
      // Active beacon light beam glow
      const time = performance.now() * 0.005;
      const glowPulse = Math.sin(time) * 4;

      ctx.fillStyle = 'rgba(26, 188, 156, 0.15)';
      ctx.fillRect(x + w / 2 - 12 - glowPulse / 2, y - 20, 24 + glowPulse, h + 20);

      // Bright active cyan flag banner
      ctx.fillStyle = '#1abc9c';
      ctx.beginPath();
      ctx.moveTo(x + w / 2 + 3, y);
      ctx.lineTo(x + w / 2 + 22 + Math.sin(time * 2) * 2, y + 10);
      ctx.lineTo(x + w / 2 + 3, y + 20);
      ctx.closePath();
      ctx.fill();

      // Glowing gold star beacon top
      ctx.fillStyle = '#f1c40f';
      ctx.beginPath();
      ctx.arc(x + w / 2, y, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x + w / 2 - 1, y - 1, 3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Inactive dim gray banner
      ctx.fillStyle = '#7f8c8d';
      ctx.beginPath();
      ctx.moveTo(x + w / 2 + 3, y);
      ctx.lineTo(x + w / 2 + 16, y + 10);
      ctx.lineTo(x + w / 2 + 3, y + 20);
      ctx.closePath();
      ctx.fill();

      // Inactive top orb
      ctx.fillStyle = '#95a5a6';
      ctx.beginPath();
      ctx.arc(x + w / 2, y, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
