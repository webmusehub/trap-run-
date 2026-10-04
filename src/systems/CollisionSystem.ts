// ─────────────────────────────────────────────────────────────────────────────
// CollisionSystem.ts — AABB collision detection and resolution.
// Detects and resolves player vs static, moving, and falling platforms.
// Detects hazard, exit, coin, checkpoint, and trigger collisions.
// Source of truth: ARCHITECTURE.md §26-29, TRD.md §26-31
// ─────────────────────────────────────────────────────────────────────────────

import type { Player }     from '../entities/Player.js';
import type { Coin }       from '../entities/Coin.js';
import type { Checkpoint } from '../entities/Checkpoint.js';
import type { Rect }       from '../data/types.js';

export interface SolidEntity {
  active: boolean;
  getBounds(): Rect;
  isSolid?: boolean;
  deltaX?: number;
  deltaY?: number;
  onPlayerLand?(): void;
}

export interface HazardEntity {
  active: boolean;
  getBounds(): Rect;
  isLethal?: boolean;
  trigger?(): void;
}

export class CollisionSystem {
  /**
   * Resolve player vs all platforms (static, moving, falling).
   * Called AFTER PhysicsSystem.update() has moved the player.
   * Mutates player.position, player.velocity, player.grounded.
   */
  resolvePlatforms(player: Player, platforms: ReadonlyArray<SolidEntity>): void {
    player.grounded = false;

    for (const platform of platforms) {
      if (!platform.active) continue;
      if (platform.isSolid === false) continue;

      const pb = player.getBounds();
      const pl = platform.getBounds();

      if (!this._overlaps(pb, pl)) continue;

      const landed = this._resolve(player, pb, pl);

      if (landed) {
        if (typeof platform.deltaX === 'number' && typeof platform.deltaY === 'number') {
          player.position.x += platform.deltaX;
          player.position.y += platform.deltaY;
        }
        if (typeof platform.onPlayerLand === 'function') {
          platform.onPlayerLand();
        }
      }
    }
  }

  // ── AABB overlap ─────────────────────────────────────────────────────────

  private _overlaps(a: Rect, b: Rect): boolean {
    return (
      a.x < b.x + b.width  &&
      a.x + a.width  > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  // ── Minimum-translation resolution ──────────────────────────────────────

  private _resolve(player: Player, pb: Rect, pl: Rect): boolean {
    const overlapLeft   = (pb.x + pb.width)  - pl.x;
    const overlapRight  = (pl.x + pl.width)  - pb.x;
    const overlapTop    = (pb.y + pb.height) - pl.y;
    const overlapBottom = (pl.y + pl.height) - pb.y;

    const minX = Math.min(overlapLeft, overlapRight);
    const minY = Math.min(overlapTop,  overlapBottom);

    if (minX < minY) {
      if (overlapLeft < overlapRight) {
        player.position.x -= overlapLeft;
        if (player.velocity.x > 0) player.velocity.x = 0;
      } else {
        player.position.x += overlapRight;
        if (player.velocity.x < 0) player.velocity.x = 0;
      }
      return false;
    } else {
      if (overlapTop < overlapBottom) {
        player.position.y -= overlapTop;
        if (player.velocity.y > 0) player.velocity.y = 0;
        player.grounded = true;
        return true;
      } else {
        player.position.y += overlapBottom;
        if (player.velocity.y < 0) player.velocity.y = 0;
        return false;
      }
    }
  }

  // ── Hazard collision detection ─────────────────────────────────────────────

  checkHazardCollisions(player: Player, hazards: ReadonlyArray<HazardEntity>): HazardEntity | null {
    if (player.playerState === 'DEAD' || player.playerState === 'RESPAWNING' || player.isInvulnerable()) {
      return null;
    }

    const pb = player.getBounds();

    for (const hazard of hazards) {
      if (!hazard.active) continue;
      if (hazard.isLethal === false) continue;

      if (this._overlaps(pb, hazard.getBounds())) {
        if (typeof hazard.trigger === 'function') {
          hazard.trigger();
        }
        return hazard;
      }
    }

    return null;
  }

  // ── Exit collision detection ──────────────────────────────────────────────

  checkExitCollision<T extends { active: boolean; getBounds(): Rect }>(player: Player, exits: ReadonlyArray<T>): T | null {
    if (player.playerState === 'DEAD' || player.playerState === 'RESPAWNING' || player.playerState === 'LEVEL_COMPLETE') {
      return null;
    }

    const pb = player.getBounds();

    for (const exit of exits) {
      if (!exit.active) continue;
      if (this._overlaps(pb, exit.getBounds())) {
        return exit;
      }
    }

    return null;
  }

  // ── Coin collision detection ──────────────────────────────────────────────

  checkCoinCollisions(player: Player, coins: ReadonlyArray<Coin>): Coin[] {
    if (player.playerState === 'DEAD' || player.playerState === 'RESPAWNING') {
      return [];
    }

    const collected: Coin[] = [];
    const pb = player.getBounds();

    for (const coin of coins) {
      if (!coin.active || coin.collected) continue;
      if (this._overlaps(pb, coin.getBounds())) {
        coin.collect();
        collected.push(coin);
      }
    }

    return collected;
  }

  // ── Checkpoint collision detection ───────────────────────────────────────

  checkCheckpointCollisions(player: Player, checkpoints: ReadonlyArray<Checkpoint>): Checkpoint | null {
    if (player.playerState === 'DEAD' || player.playerState === 'RESPAWNING') {
      return null;
    }

    const pb = player.getBounds();

    for (const cp of checkpoints) {
      if (!cp.active || cp.activated) continue;
      if (this._overlaps(pb, cp.getBounds())) {
        const newlyActivated = cp.activate();
        if (newlyActivated) {
          return cp;
        }
      }
    }

    return null;
  }

  // ── Trigger collision detection ────────────────────────────────────────────

  checkTriggerCollisions<T extends { active: boolean; getBounds(): Rect; trigger(): void }>(
    player: Player,
    triggers: ReadonlyArray<T>,
  ): T[] {
    const hits: T[] = [];
    const pb = player.getBounds();

    for (const trig of triggers) {
      if (!trig.active) continue;
      if (this._overlaps(pb, trig.getBounds())) {
        trig.trigger();
        hits.push(trig);
      }
    }

    return hits;
  }

  // ── World boundary clamp & pit death detection ───────────────────────────

  applyWorldBounds(player: Player, worldWidth: number, worldHeight: number): { fellInPit: boolean } {
    let fellInPit = false;

    if (player.position.x < 0) {
      player.position.x = 0;
      if (player.velocity.x < 0) player.velocity.x = 0;
    }
    const maxX = worldWidth - player.width;
    if (player.position.x > maxX) {
      player.position.x = maxX;
      if (player.velocity.x > 0) player.velocity.x = 0;
    }

    const maxY = worldHeight - player.height;
    if (player.position.y >= maxY) {
      fellInPit = true;
    }

    return { fellInPit };
  }
}
