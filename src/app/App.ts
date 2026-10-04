// ─────────────────────────────────────────────────────────────────────────────
// App.ts — Application coordinator. Top-level orchestrator.
// Owns: canvas setup, browser lifecycle, instantiating all systems.
// Source of truth: ARCHITECTURE.md §7, TRD.md §(Application Layer)
// ─────────────────────────────────────────────────────────────────────────────

import { AppState }         from './AppState.js';
import { Game }             from '../game/Game.js';
import { GameStateMachine } from '../game/GameState.js';
import { GAME_CONFIG }      from '../game/GameConfig.js';
import { eventBus }         from '../systems/EventBus.js';
import { PhysicsSystem }    from '../systems/PhysicsSystem.js';
import { CollisionSystem }  from '../systems/CollisionSystem.js';
import { CameraSystem }     from '../systems/CameraSystem.js';
import { ParticleSystem }   from '../systems/ParticleSystem.js';
import { InputManager }     from '../input/InputManager.js';
import { AudioManager }     from '../audio/AudioManager.js';
import { LevelManager }     from '../levels/LevelManager.js';
import { Renderer }         from '../rendering/Renderer.js';
import { UIManager }        from '../ui/UIManager.js';
import { SaveSystem }       from '../systems/SaveSystem.js';
import type { GameContext }  from '../game/GameContext.js';

export class App {
  private readonly _appState    = new AppState();
  private _game:   Game | null  = null;
  private _input:  InputManager | null = null;
  private _audio:  AudioManager | null = null;

  initialize(): void {
    const canvas = document.getElementById('game-canvas');
    if (!canvas) {
      console.log('[App] #game-canvas element not found on current page. Skipping canvas initialization.');
      return;
    }

    console.log('[App] Initializing Trap Run...');
    try {
      this._setupCanvas();
      this._appState.setRunning();
      console.log('[App] Initialized successfully.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this._appState.setError(msg);
      this._showErrorScreen(msg);
    }
  }

  start(): void {
    if (!this._appState.isRunning() || !this._game) {
      console.error('[App] Cannot start — not initialized.');
      return;
    }
    this._game.start();
    console.log('[App] Game started.');
  }

  private _setupCanvas(): void {
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement | null;
    if (!canvas) throw new Error('[App] #game-canvas element not found in DOM.');

    canvas.width  = GAME_CONFIG.canvas.width;
    canvas.height = GAME_CONFIG.canvas.height;

    this._applyCanvasScale(canvas);
    window.addEventListener('resize', () => this._applyCanvasScale(canvas));
    window.addEventListener('orientationchange', () => this._applyCanvasScale(canvas));

    // ── Instantiate all systems ─────────────────────────────────────────────
    const renderer     = new Renderer(canvas);
    const input        = new InputManager();
    input.bindDOM();
    const audio        = new AudioManager();
    const levelManager = new LevelManager();
    const ui           = new UIManager();
    const stateMachine = new GameStateMachine();
    const physics      = new PhysicsSystem(GAME_CONFIG.physics);
    const collision    = new CollisionSystem();
    const camera       = new CameraSystem();
    const particles    = new ParticleSystem(300);
    const saveSystem   = new SaveSystem();

    this._input = input;
    this._audio = audio;

    const context: GameContext = {
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

    this._game = new Game(context);

    document.addEventListener('visibilitychange', this._onVisibilityChange);
  }

  private _applyCanvasScale(canvas: HTMLCanvasElement): void {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const { width: vWidth, height: vHeight } = GAME_CONFIG.canvas;

    const scale = Math.min(vw / vWidth, vh / vHeight);
    const cssW  = Math.floor(vWidth  * scale);
    const cssH  = Math.floor(vHeight * scale);

    canvas.style.width  = `${cssW}px`;
    canvas.style.height = `${cssH}px`;
    canvas.style.left   = `${Math.floor((vw - cssW) / 2)}px`;
    canvas.style.top    = `${Math.floor((vh - cssH) / 2)}px`;
  }

  private _onVisibilityChange = (): void => {
    if (document.hidden) this._game?.onVisibilityHidden();
  };

  private _showErrorScreen(message: string): void {
    const el  = document.getElementById('error-screen');
    const msg = document.getElementById('error-message');
    if (el)  el.style.display  = 'flex';
    if (msg) msg.textContent = message;
  }

  destroy(): void {
    this._game?.stop();
    this._input?.destroy();
    this._audio?.destroy();
    document.removeEventListener('visibilitychange', this._onVisibilityChange);
    this._appState.setStopped();
    console.log('[App] Destroyed.');
  }
}
