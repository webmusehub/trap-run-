// ─────────────────────────────────────────────────────────────────────────────
// ParticleSystem.ts — Fixed-pool 2D particle system.
// Handles visual effects: jump dust, land dust, death burst, coin burst, etc.
// Uses object pooling to ensure 60 FPS performance without garbage collection.
// Source of truth: ARCHITECTURE.md §48, TRD.md §61-65, PRD Phase 6 §11
// ─────────────────────────────────────────────────────────────────────────────

import type { Particle, ParticleType } from '../data/types.js';

export class ParticleSystem {
  private readonly _maxParticles: number;
  private readonly _pool: Particle[];
  private _activeCount = 0;

  constructor(maxParticles: number = 300) {
    this._maxParticles = maxParticles;
    this._pool = new Array(maxParticles);
    for (let i = 0; i < maxParticles; i++) {
      this._pool[i] = {
        position: { x: 0, y: 0 },
        velocity: { x: 0, y: 0 },
        lifetime: 0,
        age: 0,
        size: 0,
        opacity: 1,
        color: '#ffffff',
        type: 'JUMP_DUST',
      };
    }
  }

  get activeCount(): number {
    return this._activeCount;
  }

  get maxParticles(): number {
    return this._maxParticles;
  }

  /** Emit a single particle from the pool if available. */
  emit(
    x: number,
    y: number,
    vx: number,
    vy: number,
    size: number,
    lifetime: number,
    color: string,
    type: ParticleType = 'JUMP_DUST',
  ): void {
    if (this._activeCount >= this._maxParticles) return;

    const p = this._pool[this._activeCount];
    p.position.x = x;
    p.position.y = y;
    p.velocity.x = vx;
    p.velocity.y = vy;
    p.size       = size;
    p.lifetime   = Math.max(0.05, lifetime);
    p.age        = 0;
    p.opacity    = 1;
    p.color      = color;
    p.type       = type;

    this._activeCount++;
  }

  // ── Predefined Visual Burst Helpers ──────────────────────────────────────────

  spawnJumpDust(x: number, y: number): void {
    for (let i = 0; i < 6; i++) {
      const vx = (Math.random() - 0.5) * 60;
      const vy = (Math.random() * -30) - 10;
      const size = Math.random() * 3 + 2;
      this.emit(x + (Math.random() - 0.5) * 16, y, vx, vy, size, 0.25, '#d0d0e0', 'JUMP_DUST');
    }
  }

  spawnLandDust(x: number, y: number): void {
    for (let i = 0; i < 10; i++) {
      const vx = (Math.random() - 0.5) * 120;
      const vy = (Math.random() * -20) - 5;
      const size = Math.random() * 4 + 2;
      this.emit(x + (Math.random() - 0.5) * 20, y, vx, vy, size, 0.3, '#d0d0e0', 'JUMP_DUST');
    }
  }

  spawnDeathBurst(x: number, y: number): void {
    const colors = ['#e74c3c', '#e67e22', '#f1c40f', '#ecf0f1'];
    for (let i = 0; i < 28; i++) {
      const angle = (Math.PI * 2 * i) / 28 + (Math.random() - 0.5) * 0.2;
      const speed = Math.random() * 180 + 60;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const size = Math.random() * 5 + 3;
      const color = colors[Math.floor(Math.random() * colors.length)];
      this.emit(x, y, vx, vy, size, 0.6, color, 'DEATH');
    }
  }

  spawnRespawnEffect(x: number, y: number): void {
    for (let i = 0; i < 16; i++) {
      const angle = (Math.PI * 2 * i) / 16;
      const speed = Math.random() * 80 + 40;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      this.emit(x, y, vx, vy, 3, 0.4, '#1abc9c', 'CHECKPOINT');
    }
  }

  spawnCoinBurst(x: number, y: number): void {
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 100 + 40;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed - 30;
      const size = Math.random() * 4 + 2;
      this.emit(x, y, vx, vy, size, 0.45, '#f1c40f', 'COIN');
    }
  }

  spawnCheckpointBurst(x: number, y: number): void {
    for (let i = 0; i < 20; i++) {
      const vx = (Math.random() - 0.5) * 100;
      const vy = -Math.random() * 150 - 50;
      const size = Math.random() * 4 + 2;
      const color = Math.random() > 0.5 ? '#1abc9c' : '#f1c40f';
      this.emit(x, y, vx, vy, size, 0.7, color, 'CHECKPOINT');
    }
  }

  spawnTrapTriggerBurst(x: number, y: number): void {
    for (let i = 0; i < 12; i++) {
      const vx = (Math.random() - 0.5) * 140;
      const vy = (Math.random() - 0.5) * 140;
      const size = Math.random() * 4 + 2;
      this.emit(x, y, vx, vy, size, 0.4, '#e74c3c', 'TRAP');
    }
  }

  spawnFakeExitReveal(x: number, y: number): void {
    for (let i = 0; i < 24; i++) {
      const angle = (Math.PI * 2 * i) / 24;
      const speed = Math.random() * 160 + 60;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      this.emit(x, y, vx, vy, 4, 0.55, '#8e44ad', 'TRAP');
    }
  }

  spawnLevelCompleteBurst(x: number, y: number): void {
    const colors = ['#2ecc71', '#1abc9c', '#f1c40f', '#3498db', '#9b59b6'];
    for (let i = 0; i < 36; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 220 + 80;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const size = Math.random() * 6 + 3;
      const color = colors[Math.floor(Math.random() * colors.length)];
      this.emit(x, y, vx, vy, size, 0.9, color, 'VICTORY');
    }
  }

  clear(): void {
    this._activeCount = 0;
  }

  // ── Update & Render Loop ────────────────────────────────────────────────────

  update(delta: number): void {
    let i = 0;
    while (i < this._activeCount) {
      const p = this._pool[i];
      p.age += delta;

      if (p.age >= p.lifetime) {
        // Recycle expired particle by swapping with last active particle
        this._activeCount--;
        if (i < this._activeCount) {
          const last = this._pool[this._activeCount];
          this._pool[i] = last;
          this._pool[this._activeCount] = p;
        }
        // Do not increment i; test the swapped particle in the current slot
        continue;
      }

      // Physics integration
      p.position.x += p.velocity.x * delta;
      p.position.y += p.velocity.y * delta;

      // Slight gravity for dust/death particles
      if (p.type === 'JUMP_DUST' || p.type === 'DEATH' || p.type === 'TRAP') {
        p.velocity.y += 120 * delta;
      }

      // Fade out
      p.opacity = Math.max(0, 1 - (p.age / p.lifetime));
      i++;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (this._activeCount === 0) return;

    ctx.save();
    for (let i = 0; i < this._activeCount; i++) {
      const p = this._pool[i];
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;

      // Render crisp pixel squares
      const half = Math.floor(p.size / 2);
      ctx.fillRect(
        Math.round(p.position.x - half),
        Math.round(p.position.y - half),
        Math.round(p.size),
        Math.round(p.size)
      );
    }
    ctx.restore();
  }
}
