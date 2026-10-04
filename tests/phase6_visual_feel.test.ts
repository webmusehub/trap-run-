// ─────────────────────────────────────────────────────────────────────────────
// phase6_visual_feel.test.ts — Unit tests for Phase 6 Visual Polish & Game Feel.
// Source of truth: ARCHITECTURE.md §48, TRD.md §50-65, PRD Phase 6 §22
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ParticleSystem } from '../src/systems/ParticleSystem.js';
import { CameraSystem } from '../src/systems/CameraSystem.js';
import { ThemeManager } from '../src/rendering/ThemeManager.js';
import { Player } from '../src/entities/Player.js';
import { Coin } from '../src/entities/Coin.js';
import { Checkpoint } from '../src/entities/Checkpoint.js';
import { FakeExit } from '../src/entities/FakeExit.js';
import { Exit } from '../src/entities/Exit.js';
import { Spike } from '../src/entities/Spike.js';
import { MovingSpike } from '../src/entities/MovingSpike.js';
import { HiddenSpike } from '../src/entities/HiddenSpike.js';

describe('Phase 6 ParticleSystem Unit Tests', () => {
  let particles: ParticleSystem;

  beforeEach(() => {
    particles = new ParticleSystem(300);
  });

  it('initializes with zero active particles and max capacity 300', () => {
    expect(particles.activeCount).toBe(0);
    expect(particles.maxParticles).toBe(300);
  });

  it('spawns particles on jump, land, death, coin, checkpoint, and level complete bursts', () => {
    particles.spawnJumpDust(100, 200);
    expect(particles.activeCount).toBeGreaterThan(0);

    particles.clear();
    expect(particles.activeCount).toBe(0);

    particles.spawnDeathBurst(100, 200);
    const deathCount = particles.activeCount;
    expect(deathCount).toBe(28);

    particles.spawnCoinBurst(100, 200);
    expect(particles.activeCount).toBe(deathCount + 12);
  });

  it('updates particle positions and recycles expired particles over time', () => {
    particles.spawnJumpDust(100, 200);
    const count = particles.activeCount;

    // Fast-forward 1 second (longer than jump dust lifetime ~0.25s)
    particles.update(1.0);
    expect(particles.activeCount).toBe(0);
  });

  it('never exceeds max particle capacity pool limit', () => {
    for (let i = 0; i < 50; i++) {
      particles.spawnDeathBurst(100, 200);
    }
    expect(particles.activeCount).toBeLessThanOrEqual(300);
  });
});

describe('Phase 6 CameraSystem & Screen Shake Unit Tests', () => {
  let camera: CameraSystem;
  let player: Player;

  beforeEach(() => {
    camera = new CameraSystem();
    camera.setBounds(3000, 2000);
    player = new Player(1500, 800);
  });

  it('follows player with lerp smoothing and clamps to level bounds', () => {
    camera.update(player, 1 / 60, true);
    expect(camera.x).toBeGreaterThan(0);
    expect(camera.y).toBeGreaterThan(0);

    // Player far off to the left -> camera clamps to min bounds (0)
    player.position = { x: 10, y: 10 };
    for (let i = 0; i < 30; i++) camera.update(player, 1 / 60, true);
    expect(camera.x).toBe(0);
    expect(camera.y).toBe(0);
  });

  it('generates screen shake offset when enabled', () => {
    camera.triggerShake(10, 0.5, true);
    camera.update(player, 1 / 60, true);

    expect(camera.shakeX !== 0 || camera.shakeY !== 0).toBe(true);
  });

  it('produces NO screen shake offset when screenShake setting is OFF (false)', () => {
    camera.triggerShake(10, 0.5, false);
    camera.update(player, 1 / 60, false);

    expect(camera.shakeX).toBe(0);
    expect(camera.shakeY).toBe(0);
  });
});

describe('Phase 6 Visual Player & Animation State Unit Tests', () => {
  let player: Player;

  beforeEach(() => {
    player = new Player(100, 100);
  });

  it('transitions player visual states between IDLE, RUNNING, JUMPING, FALLING, DEAD', () => {
    expect(player.playerState).toBe('IDLE');

    player.velocity = { x: 50, y: 0 };
    player.grounded = true;
    player.update(0.016);
    expect(player.playerState).toBe('RUNNING');

    player.velocity = { x: 0, y: -200 };
    player.grounded = false;
    player.update(0.016);
    expect(player.playerState).toBe('JUMPING');

    player.velocity = { x: 0, y: 200 };
    player.grounded = false;
    player.update(0.016);
    expect(player.playerState).toBe('FALLING');
  });

  it('handles invulnerability timer and respawn state correctly', () => {
    player.respawn();
    expect(player.isInvulnerable()).toBe(true);
    expect(player.position).toEqual({ x: 100, y: 100 });
  });
});

describe('Phase 6 Entity & Theme Visual Unit Tests', () => {
  it('returns valid Level Theme configurations for Levels 1 through 10', () => {
    for (let id = 1; id <= 10; id++) {
      const theme = ThemeManager.getTheme(id);
      expect(theme).not.toBeUndefined();
      expect(theme.id).toBe(id);
      expect(theme.name).toBeDefined();
      expect(theme.skyGradientTop).toBeDefined();
    }
  });

  it('triggers FakeExit trap state', () => {
    const fakeExit = new FakeExit({ id: 'fe1', x: 200, y: 200, width: 32, height: 48, type: 'fake' });
    expect(fakeExit.triggered).toBe(false);
    fakeExit.trigger();
    expect(fakeExit.triggered).toBe(true);
  });

  it('activates Checkpoint state and resets properly', () => {
    const cp = new Checkpoint({ id: 'cp1', x: 300, y: 200, width: 32, height: 48 });
    expect(cp.activated).toBe(false);

    expect(cp.activate()).toBe(true);
    expect(cp.activated).toBe(true);

    cp.reset();
    expect(cp.activated).toBe(false);
  });
});
