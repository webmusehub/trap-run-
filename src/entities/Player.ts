// ─────────────────────────────────────────────────────────────────────────────
// Player.ts — Player entity with pixel-art visuals & state animations.
// Physics is applied by PhysicsSystem. Collision resolved by CollisionSystem.
// Source of truth: ARCHITECTURE.md §32-34, TRD.md §15, PRD Phase 6 §2-3
// ─────────────────────────────────────────────────────────────────────────────

import { Entity } from './Entity.js';
import type { Vector2, PlayerStateType, FacingDirection } from '../data/types.js';
import { entityRect } from '../utils/math.js';
import type { Rect } from '../data/types.js';
import { GAME_CONFIG } from '../game/GameConfig.js';

export class Player extends Entity {
  // ── Dimensions ─────────────────────────────────────────────────────────────
  readonly width:  number;
  readonly height: number;

  // ── Physics state ───────────────────────────────────────────────────────────
  velocity:  Vector2 = { x: 0, y: 0 };
  grounded:  boolean = false;

  // ── Gameplay state ──────────────────────────────────────────────────────────
  playerState: PlayerStateType = 'IDLE';
  facing:      FacingDirection = 'right';
  lives:       number;
  deaths:      number = 0;
  coinsCollected: number = 0;
  checkpointId:   string | null = null;
  invulnerableUntil: number = 0;   // ms timestamp

  // ── Animation state ─────────────────────────────────────────────────────────
  private _animTimer = 0;
  private _runFrame  = 0;

  // ── Coyote time ─────────────────────────────────────────────────────────────
  coyoteTimer: number = 0;
  get canCoyoteJump(): boolean {
    return this.coyoteTimer <= GAME_CONFIG.player.coyoteTime;
  }

  // ── Spawn ───────────────────────────────────────────────────────────────────
  private _spawnX: number;
  private _spawnY: number;

  constructor(spawnX: number, spawnY: number) {
    super('player', 'PLAYER', { x: spawnX, y: spawnY });
    this._spawnX = spawnX;
    this._spawnY = spawnY;
    this.width   = GAME_CONFIG.player.width;
    this.height  = GAME_CONFIG.player.height;
    this.lives   = GAME_CONFIG.player.startLives;
  }

  getBounds(): Rect {
    return entityRect(this.position.x, this.position.y, this.width, this.height);
  }

  reset(): void {
    this.position    = { x: this._spawnX, y: this._spawnY };
    this.velocity    = { x: 0, y: 0 };
    this.grounded    = false;
    this.playerState = 'IDLE';
    this.facing      = 'right';
    this.coyoteTimer = GAME_CONFIG.player.coyoteTime + 1;
    this.invulnerableUntil = 0;
    this.coinsCollected    = 0;
    this.checkpointId      = null;
    this._animTimer        = 0;
    this._runFrame         = 0;
  }

  setCheckpoint(id: string, x: number, y: number): void {
    this.checkpointId = id;
    this._spawnX = x;
    this._spawnY = y;
  }

  setSpawn(x: number, y: number): void {
    this._spawnX = x;
    this._spawnY = y;
  }

  respawn(): void {
    this.position    = { x: this._spawnX, y: this._spawnY };
    this.velocity    = { x: 0, y: 0 };
    this.grounded    = false;
    this.playerState = 'IDLE';
    this.coyoteTimer = GAME_CONFIG.player.coyoteTime + 1;
    this.invulnerableUntil = performance.now() + GAME_CONFIG.player.invulnerabilityTime * 1000;
  }

  isInvulnerable(): boolean {
    return performance.now() < this.invulnerableUntil;
  }

  updatePlayerState(): void {
    if (this.playerState === 'DEAD' || this.playerState === 'LEVEL_COMPLETE') return;

    if (!this.grounded) {
      this.playerState = this.velocity.y < 0 ? 'JUMPING' : 'FALLING';
    } else if (Math.abs(this.velocity.x) > 5) {
      this.playerState = 'RUNNING';
    } else {
      this.playerState = 'IDLE';
    }
  }

  update(delta: number): void {
    this.updatePlayerState();

    // Advance animation frame counter
    this._animTimer += delta;
    if (this.playerState === 'RUNNING') {
      if (this._animTimer >= 0.08) {
        this._animTimer = 0;
        this._runFrame = (this._runFrame + 1) % 4;
      }
    } else {
      this._runFrame = 0;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return;

    // Blink while invulnerable
    if (this.isInvulnerable() && Math.floor(performance.now() / 80) % 2 === 0) {
      return;
    }

    const { x, y } = this.position;
    const w = this.width;
    const h = this.height;
    const facingRight = this.facing === 'right';

    ctx.save();

    // Invulnerability shield aura
    if (this.isInvulnerable()) {
      ctx.strokeStyle = 'rgba(26, 188, 156, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x + w / 2, y + h / 2, Math.max(w, h) / 2 + 6, 0, Math.PI * 2);
      ctx.stroke();
    }

    // High-contrast pixel silhouette rendering
    // 1. Dark outer border for visibility against all backgrounds
    ctx.fillStyle = '#111122';
    ctx.fillRect(x - 1, y - 1, w + 2, h + 2);

    // Dynamic stretch/squish transform
    let drawX = x;
    let drawY = y;
    let drawW = w;
    let drawH = h;

    if (this.playerState === 'JUMPING') {
      drawW = w - 2;
      drawH = h + 4;
      drawX = x + 1;
      drawY = y - 2;
    } else if (this.playerState === 'FALLING') {
      drawW = w + 2;
      drawH = h - 2;
      drawX = x - 1;
      drawY = y + 2;
    } else if (this.playerState === 'IDLE') {
      // Breathing pulse
      const breathe = Math.sin(performance.now() * 0.005) * 1;
      drawH = h + breathe;
      drawY = y - breathe;
    }

    // 2. Main Hero Body (Heroic Gold / Amber Tunic)
    ctx.fillStyle = '#e8c84a';
    ctx.fillRect(drawX, drawY, drawW, drawH);

    // 3. Head Cap / Hood
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(drawX, drawY, drawW, 10);

    // 4. Headband Accent
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(drawX, drawY + 8, drawW, 3);

    // 5. Expressive Pixel Eyes
    ctx.fillStyle = '#ffffff';
    const eyeX = facingRight ? drawX + drawW - 10 : drawX + 3;
    ctx.fillRect(eyeX, drawY + 12, 6, 6);
    ctx.fillStyle = '#1a1a2e';
    const pupilX = facingRight ? eyeX + 3 : eyeX;
    ctx.fillRect(pupilX, drawY + 13, 3, 4);

    // 6. Animated Legs / Feet
    ctx.fillStyle = '#34495e';
    if (this.playerState === 'RUNNING') {
      const legOffset = (this._runFrame % 2 === 0) ? 4 : -4;
      ctx.fillRect(drawX + 2, drawY + drawH - 6, 8, 6 + legOffset);
      ctx.fillRect(drawX + drawW - 10, drawY + drawH - 6, 8, 6 - legOffset);
    } else if (this.playerState === 'JUMPING') {
      ctx.fillRect(drawX + 4, drawY + drawH - 8, drawW - 8, 4);
    } else {
      // Idle / grounded boots
      ctx.fillRect(drawX + 1, drawY + drawH - 5, drawW - 2, 5);
    }

    ctx.restore();
  }
}
