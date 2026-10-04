// ─────────────────────────────────────────────────────────────────────────────
// PhysicsSystem.ts — Applies velocity, gravity, acceleration/deceleration.
// Does NOT know about menus, audio, save data, or specific level content.
// Source of truth: ARCHITECTURE.md §23-25, TRD.md §20-25, GDD §7-8
// ─────────────────────────────────────────────────────────────────────────────

import type { Player }        from '../entities/Player.js';
import type { InputState }    from '../data/types.js';
import type { PhysicsConfig } from '../game/GameConfig.js';
import { GAME_CONFIG }        from '../game/GameConfig.js';
import { clamp, approach }    from '../utils/math.js';

export class PhysicsSystem {
  private readonly _cfg: PhysicsConfig;

  constructor(cfg: PhysicsConfig) {
    this._cfg = cfg;
  }

  /**
   * Apply one fixed-timestep physics tick to the player.
   * Called by Game.ts in the correct update order BEFORE collision.
   *
   * @param player  The player entity (mutated in place)
   * @param input   Current input snapshot (read-only)
   * @param delta   Fixed timestep in seconds (1/60)
   */
  update(player: Player, input: Readonly<InputState>, delta: number): void {
    this._applyHorizontal(player, input, delta);
    this._applyGravity(player, delta);
    this._applyJump(player, input);
    this._updateCoyoteTimer(player, delta);

    // Integrate: move by velocity × delta
    player.position.x += player.velocity.x * delta;
    player.position.y += player.velocity.y * delta;
  }

  // ── Horizontal ─────────────────────────────────────────────────────────────

  private _applyHorizontal(player: Player, input: Readonly<InputState>, delta: number): void {
    const { moveSpeed, acceleration, deceleration } = this._cfg;

    if (input.left && !input.right) {
      // Accelerate left
      player.velocity.x = approach(
        player.velocity.x,
        -moveSpeed,
        acceleration * delta,
      );
      player.facing = 'left';
    } else if (input.right && !input.left) {
      // Accelerate right
      player.velocity.x = approach(
        player.velocity.x,
        moveSpeed,
        acceleration * delta,
      );
      player.facing = 'right';
    } else {
      // No horizontal input — decelerate toward zero
      player.velocity.x = approach(player.velocity.x, 0, deceleration * delta);
    }

    // Hard clamp (should rarely be needed but prevents edge cases)
    player.velocity.x = clamp(player.velocity.x, -moveSpeed, moveSpeed);
  }

  // ── Gravity ────────────────────────────────────────────────────────────────

  private _applyGravity(player: Player, delta: number): void {
    if (player.grounded) return;   // no gravity accumulation while standing
    player.velocity.y = Math.min(
      player.velocity.y + this._cfg.gravity * delta,
      this._cfg.maxFallSpeed,
    );
  }

  // ── Jump ───────────────────────────────────────────────────────────────────

  private _applyJump(player: Player, input: Readonly<InputState>): void {
    // A jump fires when:
    //   (a) jump was just pressed while grounded, OR
    //   (b) jump was just pressed while within coyote window, OR
    //   (c) jump buffer is active and player just became grounded
    const jumpBufferActive = input.jumpBufferTime > 0;
    const canJump = player.grounded || player.canCoyoteJump;

    if ((input.jumpPressed || jumpBufferActive) && canJump) {
      player.velocity.y = this._cfg.jumpVelocity;
      player.grounded    = false;
      player.coyoteTimer = GAME_CONFIG.player.coyoteTime + 1; // expire coyote immediately
    }
  }

  // ── Coyote timer ───────────────────────────────────────────────────────────

  private _updateCoyoteTimer(player: Player, delta: number): void {
    if (player.grounded) {
      // Reset coyote window while on the ground
      player.coyoteTimer = 0;
    } else {
      player.coyoteTimer += delta;
    }
  }
}
