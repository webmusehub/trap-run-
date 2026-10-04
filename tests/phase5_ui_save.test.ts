// ─────────────────────────────────────────────────────────────────────────────
// phase5_ui_save.test.ts — Unit tests for Phase 5 UI & SaveSystem Integration.
// Tests: MainMenu, LevelSelect, HUD, PauseMenu, GameOver, LevelComplete,
// VictoryScreen, Settings, and SaveSystem persistence.
// Source of truth: ARCHITECTURE.md §59-70, TRD.md §65, §71
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SaveSystem } from '../src/systems/SaveSystem.js';
import { MemoryStorageAdapter } from '../src/utils/storage.js';
import { UIManager } from '../src/ui/UIManager.js';
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
import { GAME_CONFIG } from '../src/game/GameConfig.js';
import { ParticleSystem } from '../src/systems/ParticleSystem.js';

describe('Phase 5 SaveSystem Unit Tests', () => {
  let memoryStorage: MemoryStorageAdapter;
  let saveSystem: SaveSystem;

  beforeEach(() => {
    memoryStorage = new MemoryStorageAdapter();
    saveSystem = new SaveSystem(memoryStorage);
  });

  it('initializes with default save data (Level 1 unlocked, 0 completed)', () => {
    const data = saveSystem.getData();
    expect(data.unlockedLevels).toEqual([1]);
    expect(data.completedLevels).toEqual([]);
    expect(data.settings).toEqual({ music: true, sfx: true, screenShake: true });
  });

  it('unlocks Level N+1 upon completing Level N', () => {
    saveSystem.recordLevelCompletion(1, 35.5, 1, 5);

    expect(saveSystem.isLevelUnlocked(1)).toBe(true);
    expect(saveSystem.isLevelUnlocked(2)).toBe(true);
    expect(saveSystem.isLevelCompleted(1)).toBe(true);
    expect(saveSystem.getBestTime(1)).toBe(35.5);
    expect(saveSystem.getBestDeaths(1)).toBe(1);
    expect(saveSystem.getCoinsCollected(1)).toBe(5);
  });

  it('persists best time (lower is better) and best deaths', () => {
    saveSystem.recordLevelCompletion(2, 50.0, 3, 4);
    // Worse attempt (slower, more deaths)
    const resultWorse = saveSystem.recordLevelCompletion(2, 60.0, 5, 2);
    expect(resultWorse.isNewBestTime).toBe(false);
    expect(resultWorse.isNewBestDeaths).toBe(false);
    expect(saveSystem.getBestTime(2)).toBe(50.0);
    expect(saveSystem.getBestDeaths(2)).toBe(3);

    // Better attempt (faster, fewer deaths)
    const resultBetter = saveSystem.recordLevelCompletion(2, 40.0, 0, 7);
    expect(resultBetter.isNewBestTime).toBe(true);
    expect(resultBetter.isNewBestDeaths).toBe(true);
    expect(saveSystem.getBestTime(2)).toBe(40.0);
    expect(saveSystem.getBestDeaths(2)).toBe(0);
    expect(saveSystem.getCoinsCollected(2)).toBe(7);
  });

  it('persists progress and settings across save system reload', () => {
    saveSystem.recordLevelCompletion(1, 30.0, 0, 5);
    saveSystem.updateSettings({ music: false, screenShake: false });

    // Re-instantiate SaveSystem with same memory storage
    const reloadedSave = new SaveSystem(memoryStorage);
    expect(reloadedSave.isLevelUnlocked(2)).toBe(true);
    expect(reloadedSave.getBestTime(1)).toBe(30.0);
    expect(reloadedSave.getSettings()).toEqual({ music: false, sfx: true, screenShake: false });
  });
});

describe('Phase 5 UI Screen Components', () => {
  let context: GameContext;
  let game: Game;
  let memoryStorage: MemoryStorageAdapter;

  beforeEach(() => {
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

    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    canvas.getContext = vi.fn().mockReturnValue({
      save: vi.fn(), restore: vi.fn(), scale: vi.fn(), translate: vi.fn(), rotate: vi.fn(),
      clearRect: vi.fn(), fillRect: vi.fn(), strokeRect: vi.fn(), fillText: vi.fn(),
      beginPath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(), arc: vi.fn(), ellipse: vi.fn(),
      closePath: vi.fn(), fill: vi.fn(), stroke: vi.fn(), setLineDash: vi.fn(),
      setTransform: vi.fn(), transform: vi.fn(), drawImage: vi.fn(),
      createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    } as any);

    memoryStorage = new MemoryStorageAdapter();
    const saveSystem = new SaveSystem(memoryStorage);
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
      input, levelManager, audio, renderer, ui, eventBus,
      physics, collision, camera, particles, config: GAME_CONFIG, stateMachine, saveSystem,
    };

    game = new Game(context);
    game.start();
  });

  it('renders Main Menu with title, tagline, and action buttons', () => {
    context.ui.show('main-menu');
    const el = document.getElementById('ui-main-menu')!;
    expect(el.classList.contains('ui-hidden')).toBe(false);
    expect(el.innerHTML).toContain('TRAP RUN');
    expect(el.innerHTML).toContain('RUN. JUMP. TRUST NOTHING.');
    expect(el.querySelector('#btn-play')).not.toBeNull();
    expect(el.querySelector('#btn-level-select')).not.toBeNull();
    expect(el.querySelector('#btn-settings')).not.toBeNull();
  });

  it('renders Level Select with 10 level cards, showing Level 1 unlocked and Levels 2–10 locked', () => {
    context.ui.show('level-select');
    const el = document.getElementById('ui-level-select')!;
    expect(el.classList.contains('ui-hidden')).toBe(false);

    const unlocked = el.querySelectorAll('.level-card.unlocked');
    const locked = el.querySelectorAll('.level-card.locked');
    expect(unlocked.length).toBe(1);
    expect(locked.length).toBe(9);
  });

  it('updates Level Select when levels are completed', () => {
    context.saveSystem.recordLevelCompletion(1, 42.0, 1, 5);
    context.ui.show('level-select');
    const el = document.getElementById('ui-level-select')!;

    const unlocked = el.querySelectorAll('.level-card.unlocked');
    expect(unlocked.length).toBe(2); // Levels 1 & 2 unlocked now!
    expect(el.innerHTML).toContain('00:42.00');
  });

  it('updates HUD in real-time with lives, deaths, timer, and coins', () => {
    context.ui.show('hud');
    context.ui.hud?.update(2, 4, 84.5, 6, 10, 'Falling Platforms');

    const heartsEl = document.getElementById('hud-hearts-val');
    const deathsEl = document.getElementById('hud-deaths-val');
    const timerEl  = document.getElementById('hud-timer-val');
    const coinsEl  = document.getElementById('hud-coins-val');
    const titleEl  = document.getElementById('hud-level-name');

    expect(heartsEl?.textContent).toBe('♥♥');
    expect(deathsEl?.textContent).toBe('4');
    expect(timerEl?.textContent).toBe('01:24.50');
    expect(coinsEl?.textContent).toBe('6 / 10');
    expect(titleEl?.textContent).toBe('FALLING PLATFORMS');
  });

  it('renders Pause Menu and handles resume, restart, level select, and main menu buttons', () => {
    context.stateMachine.transition('LEVEL_SELECT');
    context.stateMachine.transition('LEVEL_LOADING');
    context.stateMachine.transition('PLAYING');
    context.stateMachine.transition('PAUSED');
    context.ui.show('pause');

    const el = document.getElementById('ui-pause')!;
    expect(el.innerHTML).toContain('PAUSED');
    expect(el.querySelector('#btn-pause-resume')).not.toBeNull();
    expect(el.querySelector('#btn-pause-restart')).not.toBeNull();

    // Click Resume
    (el.querySelector('#btn-pause-resume') as HTMLButtonElement).click();
    expect(context.stateMachine.current).toBe('PLAYING');
  });

  it('renders Game Over screen when lives run out and handles retry', () => {
    context.stateMachine.transition('LEVEL_SELECT');
    context.stateMachine.transition('LEVEL_LOADING');
    context.stateMachine.transition('PLAYING');
    context.stateMachine.transition('DEAD');
    context.stateMachine.transition('GAME_OVER');

    context.ui.gameOver?.render(3, 5, 120.0, 'Moving Platforms');
    context.ui.show('game-over');

    const el = document.getElementById('ui-game-over')!;
    expect(el.innerHTML).toContain('GAME OVER');
    expect(el.innerHTML).toContain('MOVING PLATFORMS');
    expect(el.querySelector('#btn-game-over-retry')).not.toBeNull();
  });

  it('renders Level Complete screen with new best badges and next level button', () => {
    context.ui.levelComplete?.render(1, 'First Steps', 35.0, 0, 5, 5, true, true);
    context.ui.show('level-complete');

    const el = document.getElementById('ui-level-complete')!;
    expect(el.innerHTML).toContain('LEVEL COMPLETE');
    expect(el.innerHTML).toContain('NEW BEST TIME!');
    expect(el.innerHTML).toContain('NEW BEST!');
    expect(el.querySelector('#btn-complete-next')).not.toBeNull();
  });

  it('renders Victory Screen after Level 10 completion with total stats', () => {
    context.saveSystem.recordLevelCompletion(10, 180.0, 2, 15);
    context.ui.victoryScreen?.render(12, 450.0);
    context.ui.show('victory');

    const el = document.getElementById('ui-victory')!;
    expect(el.innerHTML).toContain('TRAP RUN');
    expect(el.innerHTML).toContain('YOU SURVIVED.');
    expect(el.querySelector('#btn-victory-play-again')).not.toBeNull();
  });

  it('renders Settings UI and persists toggle changes immediately', () => {
    context.ui.show('settings');
    const el = document.getElementById('ui-settings')!;

    const toggleMusic = el.querySelector('#toggle-music') as HTMLButtonElement;
    expect(toggleMusic.textContent?.trim()).toBe('ON');

    // Toggle Music off
    toggleMusic.click();
    expect(context.saveSystem.getSettings().music).toBe(false);
  });
});
