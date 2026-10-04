// ─────────────────────────────────────────────────────────────────────────────
// TriggerTrap.ts — Sensor trigger zone entity.
// Detects player entrance and activates linked target entities (e.g. HiddenSpike).
// Source of truth: ARCHITECTURE.md §37, TRD.md §19, GDD §18 (Trap 7)
// ─────────────────────────────────────────────────────────────────────────────

import { Entity } from './Entity.js';
import type { Rect, HazardData } from '../data/types.js';
import { entityRect } from '../utils/math.js';

export class TriggerTrap extends Entity {
  readonly width: number;
  readonly height: number;
  readonly targetId: string;
  readonly singleUse: boolean;

  triggered = false;

  constructor(data: HazardData) {
    super(data.id, 'TRIGGER', { x: data.x, y: data.y });
    this.width = data.width;
    this.height = data.height;

    const props = data.properties || {};
    this.targetId  = typeof props.targetId === 'string'  ? props.targetId  : '';
    this.singleUse = typeof props.singleUse === 'boolean' ? props.singleUse : true;
  }

  getBounds(): Rect {
    return entityRect(this.position.x, this.position.y, this.width, this.height);
  }

  trigger(): void {
    if (this.triggered && this.singleUse) return;
    this.triggered = true;
  }

  reset(): void {
    this.triggered = false;
    this.active = true;
  }

  update(_delta: number): void {
    // Sensor zone — state updated by CollisionSystem / Game logic
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return;

    // Development visual: faint dashed trigger outline
    ctx.save();
    ctx.strokeStyle = this.triggered ? 'rgba(231, 76, 60, 0.4)' : 'rgba(241, 196, 15, 0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(this.position.x, this.position.y, this.width, this.height);
    ctx.restore();
  }
}
