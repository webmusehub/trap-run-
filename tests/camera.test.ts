// ─────────────────────────────────────────────────────────────────────────────
// camera.test.ts — CameraSystem behaviour tests.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, beforeEach } from 'vitest';
import { CameraSystem } from '../src/systems/CameraSystem.js';
import { Player }       from '../src/entities/Player.js';
import { GAME_CONFIG }  from '../src/game/GameConfig.js';

const VW = GAME_CONFIG.canvas.width;   // 1280
const VH = GAME_CONFIG.canvas.height;  // 720

describe('CameraSystem', () => {
  let cam: CameraSystem;
  let player: Player;

  beforeEach(() => {
    cam    = new CameraSystem();
    player = new Player(100, 300);
    cam.setBounds(4000, 720);
  });

  it('snaps to player immediately', () => {
    cam.snapToPlayer(player);
    const expectedX = player.position.x + player.width  / 2 - VW / 2;
    const expectedY = player.position.y + player.height / 2 - VH / 2;
    expect(cam.x).toBeCloseTo(Math.max(0, expectedX), 1);
    expect(cam.y).toBeCloseTo(Math.max(0, expectedY), 1);
  });

  it('moves toward player on update', () => {
    cam.x = 0;
    player.position.x = 2000;
    const prevX = cam.x;
    cam.update(player);
    expect(cam.x).toBeGreaterThan(prevX);
  });

  it('does not go below minX (0)', () => {
    player.position.x = 0;
    cam.snapToPlayer(player);
    expect(cam.x).toBeGreaterThanOrEqual(0);
  });

  it('does not exceed maxX (worldWidth - viewportWidth)', () => {
    player.position.x = 4000;
    cam.snapToPlayer(player);
    expect(cam.x).toBeLessThanOrEqual(4000 - VW + 1);
  });

  it('does not go above minY (0)', () => {
    player.position.y = 0;
    cam.snapToPlayer(player);
    expect(cam.y).toBeGreaterThanOrEqual(0);
  });

  it('converges toward player after many updates', () => {
    cam.x = 0;
    player.position.x = 1000;
    for (let i = 0; i < 200; i++) cam.update(player);
    const targetX = player.position.x + player.width / 2 - VW / 2;
    expect(cam.x).toBeCloseTo(Math.max(0, targetX), 0);
  });

  it('worldToScreenX converts correctly after snap', () => {
    player.position.x = 500;
    cam.snapToPlayer(player);
    const expectedScreen = player.position.x - cam.x;
    expect(cam.worldToScreenX(player.position.x)).toBeCloseTo(expectedScreen, 1);
  });

  it('handles small world (width < viewport) with no overflow', () => {
    cam.setBounds(800, 720);   // narrower than viewport
    player.position.x = 400;
    cam.snapToPlayer(player);
    expect(cam.x).toBe(0);    // maxX = 0 when world < viewport
  });
});
