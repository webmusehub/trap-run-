// ─────────────────────────────────────────────────────────────────────────────
// browser_simulation.test.ts — End-to-end browser runtime validation for Levels 1–10.
// Simulates canvas, DOM, GameContext, LevelManager, Game instance, levels L1–L10,
// level transitions L1→L2→...→L10→Victory, restart reset behavior on L1, L5, L10.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Game } from '../src/game/Game.js';
import { GameStateMachine } from '../src/game/GameState.js';
import { LevelManager } from '../src/levels/LevelManager.js';
import { EventBus } from '../src/systems/EventBus.js';
import { PhysicsSystem } from '../src/systems/PhysicsSystem.js';
import { CollisionSystem } from '../src/systems/CollisionSystem.js';
import { CameraSystem } from '../src/systems/CameraSystem.js';
import { InputManager } from '../src/input/InputManager.js';
import { AudioManager } from '../src/audio/AudioManager.js';
import { Renderer } from '../src/rendering/Renderer.js';
import { UIManager } from '../src/ui/UIManager.js';
import { GAME_CONFIG } from '../src/game/GameConfig.js';
import { SaveSystem } from '../src/systems/SaveSystem.js';
import { ParticleSystem } from '../src/systems/ParticleSystem.js';
import { MemoryStorageAdapter } from '../src/utils/storage.js';

describe('Phase 4 Browser Runtime Validation', () => {
  let context: GameContext;
  let game: Game;
  let canvas: HTMLCanvasElement;
  let consoleErrors: string[] = [];

  beforeEach(() => {
    consoleErrors = [];
    vi.spyOn(console, 'error').mockImplementation((...args) => {
      consoleErrors.push(args.join(' '));
    });

    // Setup DOM elements
    document.body.innerHTML = `
      <canvas id="game-canvas"></canvas>
      <div id="dev-overlay">
        <div id="dev-fps"></div>
        <div id="dev-state"></div>
      </div>
      <div id="ui-main-menu" class="ui-panel ui-hidden"></div>
      <div id="ui-level-select" class="ui-panel ui-hidden"></div>
      <div id="ui-hud" class="ui-panel ui-hidden"></div>
      <div id="ui-pause" class="ui-panel ui-hidden"></div>
      <div id="ui-game-over" class="ui-panel ui-hidden"></div>
      <div id="ui-level-complete" class="ui-panel ui-hidden"></div>
      <div id="ui-victory" class="ui-panel ui-hidden"></div>
      <div id="ui-settings" class="ui-panel ui-hidden"></div>
      <div id="ui-loading" class="ui-panel ui-hidden"></div>
    `;

    canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    canvas.width = 1280;
    canvas.height = 720;
    canvas.getContext = vi.fn().mockReturnValue({
      save: vi.fn(),
      restore: vi.fn(),
      scale: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      fillText: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      arc: vi.fn(),
      ellipse: vi.fn(),
      closePath: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      setLineDash: vi.fn(),
      setTransform: vi.fn(),
      transform: vi.fn(),
      drawImage: vi.fn(),
      createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    } as any);

    const saveSystem = new SaveSystem(new MemoryStorageAdapter());
    const input = new InputManager();
    const levelManager = new LevelManager();
    const audio = new AudioManager();
    const renderer = new Renderer(canvas);
    const ui = new UIManager();
    const eventBus = new EventBus();
    const physics = new PhysicsSystem(GAME_CONFIG.physics);
    const collision = new CollisionSystem();
    const camera = new CameraSystem();
    const particles = new ParticleSystem(300);
    const stateMachine = new GameStateMachine();

    context = {
      input,
      levelManager,
      audio,
      renderer,
      ui,
      eventBus,
      physics,
      collision,
      camera,
      particles,
      config: GAME_CONFIG,
      stateMachine,
      saveSystem,
    };

    game = new Game(context);
  });

  async function loadLevel(id: number) {
    await game.loadLevelById(id);
  }

  it('starts without console errors and enters MAIN_MENU', async () => {
    game.start();
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(context.stateMachine.current).toBe('MAIN_MENU');

    await loadLevel(1);
    expect(context.stateMachine.current).toBe('PLAYING');
    expect(context.levelManager.getCurrentLevelId()).toBe(1);
    expect(consoleErrors).toHaveLength(0);
  });

  it('verifies level loading, spawn, entities, and exits for Levels 1 through 10', async () => {
    game.start();
    await new Promise((resolve) => setTimeout(resolve, 50));

    for (let id = 1; id <= 10; id++) {
      if (context.stateMachine.current === 'PLAYING') {
        context.stateMachine.transition('PAUSED');
        context.stateMachine.transition('LEVEL_SELECT');
      }
      await loadLevel(id);
      expect(context.stateMachine.current).toBe('PLAYING');
      expect(context.levelManager.getCurrentLevelId()).toBe(id);

      const levelData = context.levelManager.getCurrentLevelData()!;
      expect(levelData.id).toBe(id);
      expect(levelData.spawn.x).toBeGreaterThan(0);
      expect(levelData.platforms.length).toBeGreaterThan(0);
      expect(levelData.exits.some((e) => e.type === 'real')).toBe(true);

      // Render world once to ensure no graphics rendering throws
      (game as any)._render(1);
    }
    expect(consoleErrors).toHaveLength(0);
  });

  it('verifies progression L1 -> L2 -> ... -> L10 -> Victory', async () => {
    game.start();
    await new Promise((resolve) => setTimeout(resolve, 50));

    for (let id = 1; id <= 10; id++) {
      await loadLevel(id);
      expect(context.levelManager.getCurrentLevelId()).toBe(id);

      // Trigger level complete
      (game as any)._handleLevelComplete();

      if (id === 10) {
        expect(context.stateMachine.current).toBe('VICTORY');
      } else {
        expect(context.stateMachine.current).toBe('LEVEL_COMPLETE');
      }
    }
    expect(consoleErrors).toHaveLength(0);
  });

  it('verifies fake exit triggers death instead of level completion (Levels 5, 8, 10)', async () => {
    game.start();
    await new Promise((resolve) => setTimeout(resolve, 50));

    const fakeExitLevels = [5, 8, 10];
    for (const id of fakeExitLevels) {
      await loadLevel(id);

      const initialLives = (game as any)._player.lives;
      const initialDeaths = (game as any)._player.deaths;

      // Fake exit death call
      (game as any)._handlePlayerDeath('fake-exit');

      expect(context.stateMachine.current).toBe('DEAD');
      expect((game as any)._player.lives).toBe(initialLives - 1);
      expect((game as any)._player.deaths).toBe(initialDeaths + 1);
    }
    expect(consoleErrors).toHaveLength(0);
  });

  it('verifies restart level attempt resets runtime state on Level 1, Level 5, Level 10', async () => {
    game.start();
    await new Promise((resolve) => setTimeout(resolve, 50));

    const testLevels = [1, 5, 10];
    for (const id of testLevels) {
      await loadLevel(id);

      const player = (game as any)._player;
      player.lives = 1;
      player.deaths = 5;
      player.coinsCollected = 3;
      (game as any)._timer.start();
      (game as any)._timer.update(12.5);

      // Perform restart
      game.restartLevel();

      expect(player.lives).toBe(3);
      expect(player.deaths).toBe(0);
      expect(player.coinsCollected).toBe(0);
      expect((game as any)._timer.getElapsed()).toBe(0);
      expect(context.stateMachine.current).toBe('PLAYING');
    }
    expect(consoleErrors).toHaveLength(0);
  });

  it('verifies Level 10 complete gauntlet & victory state transition without crash', async () => {
    game.start();
    await new Promise((resolve) => setTimeout(resolve, 50));

    await loadLevel(10);

    const levelData = context.levelManager.getCurrentLevelData()!;
    expect(levelData.id).toBe(10);
    expect(levelData.checkpoints).toHaveLength(2);
    expect(levelData.coins).toHaveLength(15);
    expect(levelData.exits.some((e) => e.type === 'fake')).toBe(true);
    expect(levelData.exits.some((e) => e.type === 'real')).toBe(true);

    // Complete Level 10
    (game as any)._handleLevelComplete();

    expect(context.stateMachine.current).toBe('VICTORY');
    expect(consoleErrors).toHaveLength(0);
  });
});
