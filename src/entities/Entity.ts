// ─────────────────────────────────────────────────────────────────────────────
// Entity.ts — Abstract base class for all game-world objects.
// Source of truth: ARCHITECTURE.md §30-31, TRD.md §18-19
// ─────────────────────────────────────────────────────────────────────────────

import type { Vector2, Rect, EntityCategory } from '../data/types.js';

export abstract class Entity {
  readonly id: string;
  readonly category: EntityCategory;

  position: Vector2;
  active: boolean;

  constructor(id: string, category: EntityCategory, position: Vector2) {
    this.id = id;
    this.category = category;
    this.position = { x: position.x, y: position.y };
    this.active = true;
  }

  /** Returns the bounding box for collision detection. */
  abstract getBounds(): Rect;

  /** Called every physics tick with the fixed timestep (seconds). */
  abstract update(delta: number): void;

  /** Called every render frame. ctx is already transformed by the camera. */
  abstract render(ctx: CanvasRenderingContext2D): void;

  /**
   * Optional — restore the entity to its level-load state.
   * Must be implemented by entities that change state during gameplay
   * (e.g. FallingPlatform, HiddenSpike, Coin).
   */
  reset?(): void;

  /**
   * Optional — trigger the entity (used by triggers and pickups).
   */
  activate?(): void;

  /**
   * Optional — clean up resources (event listeners, timers, etc.)
   * Called when the level is unloaded.
   */
  destroy?(): void;
}
