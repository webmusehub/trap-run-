// ─────────────────────────────────────────────────────────────────────────────
// physics.test.ts — PhysicsSystem + Player physics behaviour tests.
// Tests cover: movement, acceleration, deceleration, gravity, jump,
//              speed caps, coyote time, jump buffer.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, beforeEach } from 'vitest';
import { PhysicsSystem } from '../src/systems/PhysicsSystem.js';
import { Player }        from '../src/entities/Player.js';
import { GAME_CONFIG }   from '../src/game/GameConfig.js';
import type { InputState } from '../src/data/types.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeInput(overrides: Partial<InputState> = {}): InputState {
  return {
    left:           false,
    right:          false,
    jump:           false,
    jumpPressed:    false,
    pausePressed:   false,
    restartPressed: false,
    pause:          false,
    restart:        false,
    jumpBufferTime: 0,
    ...overrides,
  };
}

const DT   = 1 / 60;          // one fixed tick
const CFG  = GAME_CONFIG.physics;

// ── Player initial state ─────────────────────────────────────────────────────

describe('Player — initial state', () => {
  it('starts at spawn position', () => {
    const p = new Player(100, 500);
    expect(p.position.x).toBe(100);
    expect(p.position.y).toBe(500);
  });

  it('starts with zero velocity', () => {
    const p = new Player(100, 500);
    expect(p.velocity.x).toBe(0);
    expect(p.velocity.y).toBe(0);
  });

  it('starts not grounded', () => {
    const p = new Player(100, 500);
    expect(p.grounded).toBe(false);
  });

  it('starts with correct lives', () => {
    const p = new Player(100, 500);
    expect(p.lives).toBe(GAME_CONFIG.player.startLives);
  });
});

// ── Horizontal movement ───────────────────────────────────────────────────────

describe('PhysicsSystem — horizontal movement', () => {
  let sys: PhysicsSystem;
  let player: Player;

  beforeEach(() => {
    sys    = new PhysicsSystem(CFG);
    player = new Player(0, 0);
    player.grounded = true;  // ground the player so gravity doesn't interfere
  });

  it('accelerates right when right is held', () => {
    sys.update(player, makeInput({ right: true }), DT);
    expect(player.velocity.x).toBeGreaterThan(0);
  });

  it('accelerates left when left is held', () => {
    sys.update(player, makeInput({ left: true }), DT);
    expect(player.velocity.x).toBeLessThan(0);
  });

  it('does not exceed moveSpeed to the right', () => {
    // Run many ticks
    for (let i = 0; i < 120; i++) {
      sys.update(player, makeInput({ right: true }), DT);
    }
    expect(player.velocity.x).toBeLessThanOrEqual(CFG.moveSpeed + 0.001);
  });

  it('does not exceed moveSpeed to the left', () => {
    for (let i = 0; i < 120; i++) {
      sys.update(player, makeInput({ left: true }), DT);
    }
    expect(player.velocity.x).toBeGreaterThanOrEqual(-CFG.moveSpeed - 0.001);
  });

  it('decelerates toward zero when no input', () => {
    // First get moving
    for (let i = 0; i < 20; i++) sys.update(player, makeInput({ right: true }), DT);
    const vAfterAccel = player.velocity.x;
    expect(vAfterAccel).toBeGreaterThan(0);

    // Then release
    for (let i = 0; i < 20; i++) sys.update(player, makeInput(), DT);
    expect(Math.abs(player.velocity.x)).toBeLessThan(Math.abs(vAfterAccel));
  });

  it('reaches zero velocity after enough deceleration ticks', () => {
    for (let i = 0; i < 20; i++) sys.update(player, makeInput({ right: true }), DT);
    for (let i = 0; i < 120; i++) sys.update(player, makeInput(), DT);
    expect(player.velocity.x).toBeCloseTo(0, 2);
  });

  it('facing direction is right when moving right', () => {
    sys.update(player, makeInput({ right: true }), DT);
    expect(player.facing).toBe('right');
  });

  it('facing direction is left when moving left', () => {
    sys.update(player, makeInput({ left: true }), DT);
    expect(player.facing).toBe('left');
  });
});

// ── Gravity ───────────────────────────────────────────────────────────────────

describe('PhysicsSystem — gravity', () => {
  let sys: PhysicsSystem;
  let player: Player;

  beforeEach(() => {
    sys    = new PhysicsSystem(CFG);
    player = new Player(0, 0);
    // NOT grounded — gravity should apply
  });

  it('increases downward velocity when airborne', () => {
    sys.update(player, makeInput(), DT);
    expect(player.velocity.y).toBeGreaterThan(0);
  });

  it('does not exceed maxFallSpeed', () => {
    for (let i = 0; i < 300; i++) sys.update(player, makeInput(), DT);
    expect(player.velocity.y).toBeLessThanOrEqual(CFG.maxFallSpeed + 0.001);
  });

  it('does not apply gravity when grounded', () => {
    player.grounded = true;
    player.velocity.y = 0;
    sys.update(player, makeInput(), DT);
    expect(player.velocity.y).toBe(0);
  });

  it('moves player downward over time when airborne', () => {
    const startY = player.position.y;
    for (let i = 0; i < 10; i++) sys.update(player, makeInput(), DT);
    expect(player.position.y).toBeGreaterThan(startY);
  });
});

// ── Jump ──────────────────────────────────────────────────────────────────────

describe('PhysicsSystem — jump', () => {
  let sys: PhysicsSystem;
  let player: Player;

  beforeEach(() => {
    sys    = new PhysicsSystem(CFG);
    player = new Player(0, 500);
    player.grounded = true;
  });

  it('applies jumpVelocity when jump is pressed while grounded', () => {
    sys.update(player, makeInput({ jumpPressed: true, jump: true }), DT);
    expect(player.velocity.y).toBe(CFG.jumpVelocity);
  });

  it('clears grounded after jumping', () => {
    sys.update(player, makeInput({ jumpPressed: true, jump: true }), DT);
    expect(player.grounded).toBe(false);
  });

  it('does not jump when not grounded and no coyote', () => {
    player.grounded    = false;
    player.coyoteTimer = GAME_CONFIG.player.coyoteTime + 1; // expired
    const startVY = player.velocity.y;
    sys.update(player, makeInput({ jumpPressed: true, jump: true }), DT);
    expect(player.velocity.y).not.toBe(CFG.jumpVelocity);
    expect(player.velocity.y).toBeGreaterThanOrEqual(startVY); // only gravity
  });

  it('moves player upward after jump', () => {
    const startY = player.position.y;
    sys.update(player, makeInput({ jumpPressed: true, jump: true }), DT);
    expect(player.position.y).toBeLessThan(startY);
  });
});

// ── Coyote time ───────────────────────────────────────────────────────────────

describe('PhysicsSystem — coyote time', () => {
  let sys: PhysicsSystem;
  let player: Player;

  beforeEach(() => {
    sys    = new PhysicsSystem(CFG);
    player = new Player(0, 500);
  });

  it('allows jump shortly after leaving ground', () => {
    // Walk off platform: was grounded, now airborne, coyote timer just started
    player.grounded    = false;
    player.coyoteTimer = 0.02; // 20 ms — within 100 ms window
    sys.update(player, makeInput({ jumpPressed: true, jump: true }), DT);
    expect(player.velocity.y).toBe(CFG.jumpVelocity);
  });

  it('disallows jump when coyote window has expired', () => {
    player.grounded    = false;
    player.coyoteTimer = GAME_CONFIG.player.coyoteTime + 0.05; // expired
    sys.update(player, makeInput({ jumpPressed: true, jump: true }), DT);
    expect(player.velocity.y).not.toBe(CFG.jumpVelocity);
  });

  it('increments coyote timer when airborne', () => {
    player.grounded    = false;
    player.coyoteTimer = 0;
    sys.update(player, makeInput(), DT);
    expect(player.coyoteTimer).toBeCloseTo(DT, 5);
  });

  it('resets coyote timer to 0 when grounded', () => {
    player.grounded    = true;
    player.coyoteTimer = 0.5;
    sys.update(player, makeInput(), DT);
    expect(player.coyoteTimer).toBe(0);
  });
});

// ── Jump buffer ───────────────────────────────────────────────────────────────

describe('PhysicsSystem — jump buffer', () => {
  let sys: PhysicsSystem;
  let player: Player;

  beforeEach(() => {
    sys    = new PhysicsSystem(CFG);
    player = new Player(0, 500);
  });

  it('executes buffered jump when player lands', () => {
    // Player is airborne with an active buffer
    player.grounded    = false;
    player.coyoteTimer = GAME_CONFIG.player.coyoteTime + 1; // no coyote
    // One tick later the platform collision sets grounded = true
    player.grounded = true;
    const input = makeInput({ jumpBufferTime: 0.08 }); // buffer still active
    sys.update(player, input, DT);
    expect(player.velocity.y).toBe(CFG.jumpVelocity);
  });

  it('does not execute expired buffer on landing', () => {
    player.grounded = true;
    const input = makeInput({ jumpBufferTime: 0 }); // expired
    sys.update(player, input, DT);
    expect(player.velocity.y).not.toBe(CFG.jumpVelocity);
  });
});

// ── Player reset ─────────────────────────────────────────────────────────────

describe('Player — reset', () => {
  it('restores position, velocity and state on reset()', () => {
    const p = new Player(200, 400);
    p.position.x  = 999;
    p.velocity.x  = 300;
    p.velocity.y  = -400;
    p.grounded     = true;
    p.deaths       = 5;
    p.reset();
    expect(p.position.x).toBe(200);
    expect(p.position.y).toBe(400);
    expect(p.velocity.x).toBe(0);
    expect(p.velocity.y).toBe(0);
  });
});
