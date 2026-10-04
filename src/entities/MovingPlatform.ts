// ─────────────────────────────────────────────────────────────────────────────
// MovingPlatform.ts — Platform that moves deterministically between two points.
// Solid platform; transfers movement to player standing on it.
// Source of truth: ARCHITECTURE.md §35, TRD.md §32-33, PRD Phase 6 §4
// ─────────────────────────────────────────────────────────────────────────────

import { Entity } from './Entity.js';
import type { Rect, MovingPlatformData, MovementMode, Vector2 } from '../data/types.js';
import { entityRect } from '../utils/math.js';

export class MovingPlatform extends Entity {
  readonly width: number;
  readonly height: number;

  readonly startPos: Vector2;
  readonly endPos: Vector2;
  readonly speed: number;
  readonly mode: MovementMode;

  deltaX = 0;
  deltaY = 0;

  private _direction = 1;
  private _progress = 0;

  constructor(data: MovingPlatformData) {
    super(data.id, 'MOVING_PLATFORM', { x: data.movement.startX, y: data.movement.startY });
    this.width = data.width;
    this.height = data.height;
    this.startPos = { x: data.movement.startX, y: data.movement.startY };
    this.endPos = { x: data.movement.endX, y: data.movement.endY };
    this.speed = data.movement.speed;
    this.mode = data.movement.mode;
  }

  getBounds(): Rect {
    return entityRect(this.position.x, this.position.y, this.width, this.height);
  }

  reset(): void {
    this.position = { x: this.startPos.x, y: this.startPos.y };
    this._progress = 0;
    this._direction = 1;
    this.deltaX = 0;
    this.deltaY = 0;
    this.active = true;
  }

  update(delta: number): void {
    if (!this.active) return;

    const dx = this.endPos.x - this.startPos.x;
    const dy = this.endPos.y - this.startPos.y;
    const totalDistance = Math.hypot(dx, dy);

    if (totalDistance === 0) {
      this.deltaX = 0;
      this.deltaY = 0;
      return;
    }

    const prevX = this.position.x;
    const prevY = this.position.y;

    const step = (this.speed * delta) / totalDistance;
    this._progress += step * this._direction;

    if (this._progress >= 1) {
      if (this.mode === 'ping-pong') {
        this._progress = 1 - (this._progress - 1);
        this._direction = -1;
      } else if (this.mode === 'loop') {
        this._progress = this._progress % 1;
      } else {
        this._progress = 1;
      }
    } else if (this._progress <= 0) {
      if (this.mode === 'ping-pong') {
        this._progress = -this._progress;
        this._direction = 1;
      } else if (this.mode === 'loop') {
        this._progress = 1 + (this._progress % 1);
      } else {
        this._progress = 0;
      }
    }

    this.position.x = this.startPos.x + dx * this._progress;
    this.position.y = this.startPos.y + dy * this._progress;

    this.deltaX = this.position.x - prevX;
    this.deltaY = this.position.y - prevY;
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return;

    const { x, y } = this.position;
    const w = this.width;
    const h = this.height;

    // Metallic blue mechanical body
    ctx.fillStyle = '#1b4f72';
    ctx.fillRect(x, y, w, h);

    ctx.fillStyle = '#2980b9';
    ctx.fillRect(x + 1, y + 4, w - 2, h - 5);

    // Bright cyan top lip
    ctx.fillStyle = '#54a0ff';
    ctx.fillRect(x, y, w, 4);

    // Mechanical gear/bolt rivets on corners
    ctx.fillStyle = '#d0d0e0';
    ctx.fillRect(x + 3, y + 6, 3, 3);
    ctx.fillRect(x + w - 6, y + 6, 3, 3);

    // Direction arrow indicator
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    const isHorizontal = Math.abs(this.endPos.x - this.startPos.x) > Math.abs(this.endPos.y - this.startPos.y);
    let arrow = '↔';
    if (isHorizontal) {
      arrow = this._direction > 0 ? '►' : '◄';
    } else {
      arrow = this._direction > 0 ? '▼' : '▲';
    }
    ctx.fillText(arrow, x + w / 2, y + h / 2 + 4);
    ctx.textAlign = 'left';

    // Dark outline
    ctx.strokeStyle = '#0e2e43';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  }
}
