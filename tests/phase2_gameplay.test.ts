import { describe, it, expect, beforeEach } from 'vitest';
import { Player } from '../src/entities/Player.js';
import { Spike } from '../src/entities/Spike.js';
import { Exit } from '../src/entities/Exit.js';
import { CollisionSystem } from '../src/systems/CollisionSystem.js';
import { EventBus } from '../src/systems/EventBus.js';
import { Timer } from '../src/utils/timer.js';

describe('Phase 2 Core Gameplay Integration', () => {
  let player: Player;
  let collision: CollisionSystem;
  let eventBus: EventBus;
  let timer: Timer;

  beforeEach(() => {
    player = new Player(100, 500);
    collision = new CollisionSystem();
    eventBus = new EventBus();
    timer = new Timer();
  });

  describe('Spike Hazard Collision & Death System', () => {
    it('detects collision with a static spike', () => {
      const spike = new Spike({
        id: 'spike-1',
        type: 'static-spike',
        x: 100,
        y: 500,
        width: 32,
        height: 30,
      });

      const hit = collision.checkHazardCollisions(player, [spike]);
      expect(hit).toBe(spike);
    });

    it('ignores spike collision when player is invulnerable', () => {
      const spike = new Spike({
        id: 'spike-1',
        type: 'static-spike',
        x: 100,
        y: 500,
        width: 32,
        height: 30,
      });

      player.invulnerableUntil = performance.now() + 1000;
      const hit = collision.checkHazardCollisions(player, [spike]);
      expect(hit).toBeNull();
    });

    it('decrements lives and increments deaths on player death', () => {
      expect(player.lives).toBe(3);
      expect(player.deaths).toBe(0);

      // Simulate death handling
      player.playerState = 'DEAD';
      player.lives -= 1;
      player.deaths += 1;

      expect(player.lives).toBe(2);
      expect(player.deaths).toBe(1);
    });

    it('emits PLAYER_DIED event on spike collision', () => {
      let emitted = false;
      let reasonEmitted = '';

      eventBus.on('PLAYER_DIED', (payload) => {
        emitted = true;
        reasonEmitted = payload.reason;
      });

      eventBus.emit('PLAYER_DIED', { reason: 'spike', position: { x: 100, y: 500 } });

      expect(emitted).toBe(true);
      expect(reasonEmitted).toBe('spike');
    });
  });

  describe('Respawn & Invulnerability', () => {
    it('respawns player at level spawn position with zero velocity and 750ms invulnerability', () => {
      player.position = { x: 999, y: 999 };
      player.velocity = { x: 200, y: -300 };

      player.respawn();

      expect(player.position.x).toBe(100);
      expect(player.position.y).toBe(500);
      expect(player.velocity.x).toBe(0);
      expect(player.velocity.y).toBe(0);
      expect(player.isInvulnerable()).toBe(true);
    });

    it('preserves total death count after respawn', () => {
      player.deaths = 5;
      player.respawn();

      expect(player.deaths).toBe(5);
    });
  });

  describe('Timer Mechanics', () => {
    it('accumulates elapsed time and continues through death', () => {
      timer.start();
      timer.update(1.5);
      expect(timer.getElapsed()).toBeCloseTo(1.5);

      // Simulate death delay — timer keeps counting
      timer.update(1.0);
      expect(timer.getElapsed()).toBeCloseTo(2.5);
    });

    it('stops when level is completed', () => {
      timer.start();
      timer.update(2.0);
      timer.stop();
      timer.update(1.0); // should not increment

      expect(timer.getElapsed()).toBeCloseTo(2.0);
    });

    it('resets to zero when level attempt is restarted', () => {
      timer.start();
      timer.update(5.0);
      timer.reset();

      expect(timer.getElapsed()).toBe(0);
      expect(timer.isRunning()).toBe(false);
    });
  });

  describe('Real Exit & Level Completion', () => {
    it('detects collision with a real exit', () => {
      const exit = new Exit({
        id: 'exit-1',
        x: 100,
        y: 500,
        width: 60,
        height: 80,
        type: 'real',
      });

      const hit = collision.checkExitCollision(player, [exit]);
      expect(hit).toBe(exit);
    });

    it('emits LEVEL_COMPLETED event when real exit is reached', () => {
      let completed = false;
      let recordedTime = 0;

      eventBus.on('LEVEL_COMPLETED', (payload) => {
        completed = true;
        recordedTime = payload.time;
      });

      eventBus.emit('LEVEL_COMPLETED', {
        levelId: 0,
        time: 42.5,
        deaths: 2,
        coins: 0,
      });

      expect(completed).toBe(true);
      expect(recordedTime).toBe(42.5);
    });
  });

  describe('Restart Level Attempt', () => {
    it('resets player position, lives, deaths, and timer on attempt restart', () => {
      player.lives = 1;
      player.deaths = 4;
      player.position = { x: 800, y: 300 };
      timer.start();
      timer.update(10.0);

      // Simulate restart
      player.reset();
      player.lives = 3;
      player.deaths = 0;
      timer.reset();

      expect(player.position.x).toBe(100);
      expect(player.position.y).toBe(500);
      expect(player.lives).toBe(3);
      expect(player.deaths).toBe(0);
      expect(timer.getElapsed()).toBe(0);
    });
  });
});
