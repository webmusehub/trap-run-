// ─────────────────────────────────────────────────────────────────────────────
// collision.test.ts — CollisionSystem AABB resolution tests.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, beforeEach } from 'vitest';
import { CollisionSystem } from '../src/systems/CollisionSystem.js';
import { Player }          from '../src/entities/Player.js';
import { Platform }        from '../src/entities/Platform.js';

function makePlatform(x: number, y: number, w = 200, h = 20): Platform {
  return new Platform({ id: `p-${x}-${y}`, x, y, width: w, height: h });
}

describe('CollisionSystem', () => {
  let sys: CollisionSystem;
  let player: Player;

  beforeEach(() => {
    sys    = new CollisionSystem();
    // Player is 32×48 per GameConfig
    player = new Player(0, 0);
  });

  // ── Landing on top ───────────────────────────────────────────────────────

  it('sets grounded when player falls onto platform top', () => {
    const platform = makePlatform(0, 100);
    // Position player so it overlaps from above — bottom of player at y=104
    player.position.y = 56;    // 56 + 48 = 104, platform top = 100 → 4px overlap
    player.velocity.y = 200;
    sys.resolvePlatforms(player, [platform]);
    expect(player.grounded).toBe(true);
  });

  it('pushes player above platform on landing', () => {
    const platform = makePlatform(0, 100);
    player.position.y = 56;
    player.velocity.y = 200;
    sys.resolvePlatforms(player, [platform]);
    // Player bottom should equal platform top
    expect(player.position.y + 48).toBeCloseTo(100, 1);
  });

  it('zeroes downward velocity on landing', () => {
    const platform = makePlatform(0, 100);
    player.position.y = 56;
    player.velocity.y = 200;
    sys.resolvePlatforms(player, [platform]);
    expect(player.velocity.y).toBe(0);
  });

  it('does not set grounded when no overlap', () => {
    const platform = makePlatform(0, 200);
    player.position.y = 0;
    player.velocity.y = 100;
    sys.resolvePlatforms(player, [platform]);
    expect(player.grounded).toBe(false);
  });

  // ── Underside ────────────────────────────────────────────────────────────

  it('pushes player down when hitting platform underside', () => {
    const platform = makePlatform(0, 100, 200, 20);
    // Player moving upward, top of player at y=98 → 2px overlap into bottom
    player.position.y = 98;   // top of player = 98, platform bottom = 120
    // overlap: platform bottom (120) - player top (98) = 22, vs player bottom (146) - platform top (100) = 46
    // Actually we want underside: player top overlaps platform bottom
    // Place player so top is just inside the platform bottom
    // platform: y=100..120, player: y=118..166 → top of player (118) < platform bottom (120)
    player.position.y = 118;
    player.velocity.y = -300;
    sys.resolvePlatforms(player, [platform]);
    expect(player.velocity.y).toBeGreaterThanOrEqual(0);
  });

  // ── Horizontal ───────────────────────────────────────────────────────────

  it('stops rightward movement into left wall of platform', () => {
    // Platform at x=200; player approaching from left, right edge overlaps
    const platform = makePlatform(200, 0, 100, 720);
    player.position.x = 178;   // right edge = 210, 10px into platform
    player.position.y = 0;
    player.velocity.x = 300;
    sys.resolvePlatforms(player, [platform]);
    expect(player.velocity.x).toBe(0);
    expect(player.position.x + 32).toBeLessThanOrEqual(200 + 1);
  });

  it('stops leftward movement into right wall of platform', () => {
    const platform = makePlatform(0, 0, 100, 720);
    player.position.x = 92;   // left edge overlaps platform right (100)
    player.position.y = 0;
    player.velocity.x = -300;
    sys.resolvePlatforms(player, [platform]);
    expect(player.velocity.x).toBe(0);
    expect(player.position.x).toBeGreaterThanOrEqual(100 - 1);
  });

  // ── World bounds ─────────────────────────────────────────────────────────

  it('prevents player from going left of world', () => {
    player.position.x = -20;
    player.velocity.x = -100;
    sys.applyWorldBounds(player, 4000, 720);
    expect(player.position.x).toBe(0);
    expect(player.velocity.x).toBe(0);
  });

  it('prevents player from going right of world', () => {
    player.position.x = 3990;   // 3990+32 > 4000
    player.velocity.x = 100;
    sys.applyWorldBounds(player, 4000, 720);
    expect(player.position.x).toBeLessThanOrEqual(4000 - 32);
    expect(player.velocity.x).toBe(0);
  });

  it('detects pit death when player falls below world height', () => {
    player.position.y = 700;    // 700+48 > 720
    player.velocity.y = 300;
    const result = sys.applyWorldBounds(player, 4000, 720);
    expect(result.fellInPit).toBe(true);
  });

  // ── Multiple platforms ───────────────────────────────────────────────────

  it('resolves multiple platforms in one pass', () => {
    const p1 = makePlatform(0,   500);
    const p2 = makePlatform(200, 400);
    // Land on p1
    player.position.x = 50;
    player.position.y = 456;   // 456+48=504, p1 at 500 → 4px overlap
    player.velocity.y = 100;
    sys.resolvePlatforms(player, [p1, p2]);
    expect(player.grounded).toBe(true);
  });
});
