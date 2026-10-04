// ─────────────────────────────────────────────────────────────────────────────
// MovingSpike.ts — Deterministic moving sawblade / spike hazard with rotation animation.
// Source of truth: ARCHITECTURE.md §37, TRD.md §37, PRD Phase 6 §5
// ─────────────────────────────────────────────────────────────────────────────

import { Entity } from './Entity.js';
import type { Rect, HazardData, Vector2 } from '../data/types.js';
import { entityRect } from '../utils/math.js';

export class MovingSpike extends Entity {
  readonly width: number;
  readonly height: number;

  readonly startPos: Vector2;
  readonly endPos: Vector2;
  readonly speed: number;

  private _progress = 0;
  private _direction = 1;
  private _rotation = 0;

  constructor(data: HazardData) {
    const props = data.properties || {};
    const startX = typeof props.startX === 'number' ? props.startX : data.x;
    const startY = typeof props.startY === 'number' ? props.startY : data.y;
    const endX   = typeof props.endX   === 'number' ? props.endX   : data.x + 200;
    const endY   = typeof props.endY   === 'number' ? props.endY   : data.y;
    const speed  = typeof props.speed  === 'number' ? props.speed  : 150;

    super(data.id, 'HAZARD', { x: startX, y: startY });
    this.width = data.width;
    this.height = data.height;
    this.startPos = { x: startX, y: startY };
    this.endPos = { x: endX, y: endY };
    this.speed = speed;
  }

  getBounds(): Rect {
    return entityRect(this.position.x, this.position.y, this.width, this.height);
  }

  reset(): void {
    this.position = { x: this.startPos.x, y: this.startPos.y };
    this._progress = 0;
    this._direction = 1;
    this._rotation = 0;
    this.active = true;
  }

  update(delta: number): void {
    if (!this.active) return;

    this._rotation += delta * 8; // spin speed

    const dx = this.endPos.x - this.startPos.x;
    const dy = this.endPos.y - this.startPos.y;
    const totalDistance = Math.hypot(dx, dy);

    if (totalDistance === 0) return;

    const step = (this.speed * delta) / totalDistance;
    this._progress += step * this._direction;

    if (this._progress >= 1) {
      this._progress = 1 - (this._progress - 1);
      this._direction = -1;
    } else if (this._progress <= 0) {
      this._progress = -this._progress;
      this._direction = 1;
    }

    this.position.x = this.startPos.x + dx * this._progress;
    this.position.y = this.startPos.y + dy * this._progress;
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return;

    const cx = this.position.x + this.width / 2;
    const cy = this.position.y + this.height / 2;
    const radius = Math.min(this.width, this.height) / 2;

    ctx.save();
    if (typeof ctx.translate === 'function') ctx.translate(cx, cy);
    if (typeof ctx.rotate === 'function') ctx.rotate(this._rotation);

    // Spiked outer sawblade
    ctx.fillStyle = '#e74c3c';
    ctx.strokeStyle = '#922b21';
    ctx.lineWidth = 2;

    const teeth = 8;
    ctx.beginPath();
    for (let i = 0; i < teeth; i++) {
      const angle = (i * 2 * Math.PI) / teeth;
      const outerX = Math.cos(angle) * radius;
      const outerY = Math.sin(angle) * radius;
      const innerAngle = angle + Math.PI / teeth;
      const innerX = Math.cos(innerAngle) * (radius * 0.6);
      const innerY = Math.sin(innerAngle) * (radius * 0.6);

      if (i === 0) ctx.moveTo(outerX, outerY);
      else ctx.lineTo(outerX, outerY);

      ctx.lineTo(innerX, innerY);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Center metallic hub
    ctx.fillStyle = '#2c3e50';
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
