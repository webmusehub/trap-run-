// ─────────────────────────────────────────────────────────────────────────────
// FakeExit.ts — Deceptive level exit trap.
// Mimics real exit initially; reveals lethal trap visual when triggered.
// Source of truth: ARCHITECTURE.md §41, TRD.md §38, PRD Phase 6 §10
// ─────────────────────────────────────────────────────────────────────────────

import { Entity } from './Entity.js';
import type { Rect, ExitData, ExitType } from '../data/types.js';
import { entityRect } from '../utils/math.js';

export class FakeExit extends Entity {
  readonly width: number;
  readonly height: number;
  readonly exitType: ExitType = 'fake';

  triggered = false;

  constructor(data: ExitData) {
    super(data.id, 'EXIT', { x: data.x, y: data.y });
    this.width = data.width;
    this.height = data.height;
  }

  getBounds(): Rect {
    return entityRect(this.position.x, this.position.y, this.width, this.height);
  }

  trigger(): void {
    this.triggered = true;
  }

  reset(): void {
    this.triggered = false;
    this.active = true;
  }

  update(_delta: number): void {}

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return;

    const { x, y } = this.position;
    const w = this.width;
    const h = this.height;

    ctx.save();

    if (this.triggered) {
      // Triggered state: Violent crimson trap reveal
      ctx.fillStyle = '#78281f';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(x + 3, y + 3, w - 6, h - 6);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('TRAP!', x + w / 2, y + h / 2 + 5);
      ctx.textAlign = 'left';
    } else {
      // Deceptive initial state: Mimics real green portal, with subtle purple tint clue
      const time = performance.now() * 0.004;

      ctx.fillStyle = '#27ae60';
      ctx.fillRect(x, y, w, h);

      ctx.fillStyle = '#58d68d';
      ctx.fillRect(x + 3, y + 3, w - 6, h - 6);

      // Subtle ominous purple glow at center
      ctx.fillStyle = '#a569bd';
      ctx.beginPath();
      ctx.arc(x + w / 2, y + h / 2, 8 + Math.sin(time) * 2, 0, Math.PI * 2);
      ctx.fill();

      // EXIT label
      ctx.fillStyle = '#1e8449';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('EXIT', x + w / 2, y + h / 2 + 5);
      ctx.textAlign = 'left';
    }

    ctx.restore();
  }
}
