// ─────────────────────────────────────────────────────────────────────────────
// Game.ts — Central game coordinator with Phase 6 particles, camera shake & level intro.
// Source of truth: ARCHITECTURE.md §9, §85, TRD.md §(Game Engine section), PRD Phase 6
// ─────────────────────────────────────────────────────────────────────────────

import { GameLoop }        from './GameLoop.js';
import { GAME_CONFIG }     from './GameConfig.js';
import { Player }          from '../entities/Player.js';
import { Platform }        from '../entities/Platform.js';
import { MovingPlatform }  from '../entities/MovingPlatform.js';
import { FallingPlatform } from '../entities/FallingPlatform.js';
import { HiddenSpike }     from '../entities/HiddenSpike.js';
import { FakeExit }        from '../entities/FakeExit.js';
import { Exit }            from '../entities/Exit.js';
import { TriggerTrap }     from '../entities/TriggerTrap.js';
import { Coin }            from '../entities/Coin.js';
import { Checkpoint }      from '../entities/Checkpoint.js';
import { trapFactory }     from '../entities/TrapFactory.js';
import { Timer, Countdown }from '../utils/timer.js';
import type { GameContext } from './GameContext.js';
import type { GameState, LevelData } from '../data/types.js';
import type { Entity } from '../entities/Entity.js';

export class Game {
  private readonly _ctx: GameContext;
  private readonly _loop: GameLoop;
  private _fps = 60;

  // ── Runtime gameplay objects ────────────────────────────────────────────────
  private _player:           Player   | null = null;
  private _platforms:        Platform[]        = [];
  private _movingPlatforms:  MovingPlatform[]  = [];
  private _fallingPlatforms: FallingPlatform[] = [];
  private _hazards:          Entity[]          = [];
  private _exits:            (Exit | FakeExit)[] = [];
  private _triggers:         TriggerTrap[]     = [];
  private _coins:            Coin[]            = [];
  private _checkpoints:      Checkpoint[]      = [];
  private _levelData:        LevelData| null   = null;
  private _timer:            Timer             = new Timer();
  private _deathCountdown:   Countdown| null   = null;
  private _levelIntroTimer   = 0; // seconds remaining for intro banner

  private _wasGrounded = false;

  constructor(context: GameContext) {
    this._ctx = context;

    this._loop = new GameLoop(
      this._update.bind(this),
      this._render.bind(this),
      (fps) => { this._fps = fps; },
    );

    // Connect Audio system to EventBus and SaveSystem
    this._ctx.audio.connectEventBus(this._ctx.eventBus, this._ctx.saveSystem);

    this._ctx.stateMachine.onChange((from, to) => {
      this._ctx.eventBus.emit('STATE_CHANGED', { from, to });
      console.log(`[Game] State: ${from} → ${to}`);
      this._syncUIScreen(to);
    });

    // Wire Phase 6 EventBus particle and camera shake responses
    this._ctx.eventBus.on('COIN_COLLECTED', ({ position }) => {
      this._ctx.particles?.spawnCoinBurst(position.x, position.y);
    });

    this._ctx.eventBus.on('CHECKPOINT_ACTIVATED', () => {
      if (this._player) {
        const { x, y } = this._player.position;
        this._ctx.particles?.spawnCheckpointBurst(x, y);
      }
      const shakeEnabled = this._ctx.saveSystem.getSettings().screenShake;
      this._ctx.camera.triggerShake(4, 0.2, shakeEnabled);
    });

    this._ctx.eventBus.on('PLAYER_DIED', ({ position, reason }) => {
      this._ctx.particles?.spawnDeathBurst(position.x + 10, position.y + 10);
      const shakeEnabled = this._ctx.saveSystem.getSettings().screenShake;
      const intensity = reason === 'fake-exit' ? 14 : 10;
      this._ctx.camera.triggerShake(intensity, 0.35, shakeEnabled);
    });

    this._ctx.eventBus.on('PLAYER_RESPAWNED', ({ position }) => {
      this._ctx.particles?.spawnRespawnEffect(position.x + 10, position.y + 10);
    });

    this._ctx.eventBus.on('TRAP_TRIGGERED', ({ trapType }) => {
      if (this._player && trapType === 'fake-exit') {
        const { x, y } = this._player.position;
        this._ctx.particles?.spawnFakeExitReveal(x, y);
      }
      const shakeEnabled = this._ctx.saveSystem.getSettings().screenShake;
      this._ctx.camera.triggerShake(6, 0.25, shakeEnabled);
    });

    this._ctx.eventBus.on('LEVEL_COMPLETED', () => {
      if (this._player) {
        const { x, y } = this._player.position;
        this._ctx.particles?.spawnLevelCompleteBurst(x, y);
      }
      const shakeEnabled = this._ctx.saveSystem.getSettings().screenShake;
      this._ctx.camera.triggerShake(8, 0.3, shakeEnabled);
    });
  }

  start(): void {
    console.log('[Game] Starting...');
    this._ctx.ui.initialize(this._ctx, this);
    this._transitionTo('LOADING');
    this._transitionTo('MAIN_MENU');
    this._ctx.ui.show('main-menu');
    this._loop.start();
  }

  stop(): void {
    this._loop.stop();
  }

  async loadLevelById(id: number): Promise<void> {
    if (this._ctx.stateMachine.current !== 'LEVEL_LOADING') {
      if (this._ctx.stateMachine.canTransition('LEVEL_SELECT')) {
        this._transitionTo('LEVEL_SELECT');
      }
      if (this._ctx.stateMachine.canTransition('LEVEL_LOADING')) {
        this._transitionTo('LEVEL_LOADING');
      }
    }

    try {
      const loaded = await this._ctx.levelManager.loadLevel(id);
      this._loadLevel(loaded.data);
      this._transitionTo('PLAYING');
      this._timer.start();
      this._ctx.eventBus.emit('LEVEL_STARTED', { levelId: loaded.data.id });
    } catch (err) {
      console.error(`[Game] Failed to load level ${id}:`, err);
    }
  }

  private _loadLevel(data: LevelData): void {
    this._levelData        = data;
    this._platforms        = [];
    this._movingPlatforms  = [];
    this._fallingPlatforms = [];
    this._hazards          = [];
    this._exits            = [];
    this._triggers         = [];
    this._coins            = [];
    this._checkpoints      = [];

    for (const pd of data.platforms) {
      this._platforms.push(trapFactory.createPlatform(pd));
    }

    if (data.movingPlatforms) {
      for (const mpd of data.movingPlatforms) {
        this._movingPlatforms.push(trapFactory.createMovingPlatform(mpd));
      }
    }

    if (data.fallingPlatforms) {
      for (const fpd of data.fallingPlatforms) {
        this._fallingPlatforms.push(trapFactory.createFallingPlatform(fpd));
      }
    }

    for (const hd of data.hazards) {
      if (hd.type === 'trigger-trap') {
        this._triggers.push(new TriggerTrap(hd));
      } else {
        this._hazards.push(trapFactory.createHazard(hd));
      }
    }

    for (const ed of data.exits) {
      this._exits.push(trapFactory.createExit(ed) as Exit | FakeExit);
    }

    if (data.coins) {
      for (const cd of data.coins) {
        this._coins.push(trapFactory.createCoin(cd));
      }
    }

    if (data.checkpoints) {
      for (const cpd of data.checkpoints) {
        this._checkpoints.push(trapFactory.createCheckpoint(cpd));
      }
    }

    this._player = new Player(data.spawn.x, data.spawn.y);

    this._timer.reset();
    this._deathCountdown = null;
    this._levelIntroTimer = 1.2;
    this._ctx.particles?.clear();
    this._wasGrounded = true;

    this._ctx.camera.setBounds(data.width, data.height);
    this._ctx.camera.snapToPlayer(this._player);
  }

  restartLevel(): void {
    if (!this._player || !this._levelData) return;

    this._player.setSpawn(this._levelData.spawn.x, this._levelData.spawn.y);
    this._player.reset();
    this._player.lives  = GAME_CONFIG.player.startLives;
    this._player.deaths = 0;

    this._resetTraps();

    for (const coin of this._coins)           coin.reset();
    for (const checkpoint of this._checkpoints) checkpoint.reset();

    this._timer.reset();
    this._timer.start();
    this._deathCountdown = null;
    this._levelIntroTimer = 1.0;
    this._ctx.particles?.clear();

    this._ctx.camera.snapToPlayer(this._player);

    if (this._ctx.stateMachine.current !== 'PLAYING') {
      this._transitionTo('PLAYING');
    }

    this._ctx.eventBus.emit('LEVEL_STARTED', { levelId: this._levelData.id });
  }

  private _resetTraps(): void {
    for (const mp of this._movingPlatforms)  mp.reset();
    for (const fp of this._fallingPlatforms) fp.reset();
    for (const h of this._hazards) {
      if (typeof h.reset === 'function') h.reset();
    }
    for (const e of this._exits) {
      if (typeof e.reset === 'function') e.reset();
    }
    for (const tr of this._triggers) tr.reset();
  }

  private _transitionTo(state: GameState): void {
    if (this._ctx.stateMachine.canTransition(state)) {
      this._ctx.stateMachine.transition(state);
    } else {
      console.warn(`[Game] Cannot transition ${this._ctx.stateMachine.current} → ${state}`);
    }
  }

  private _update(delta: number): void {
    const state = this._ctx.stateMachine.current;

    this._ctx.input.update(delta);
    const input = this._ctx.input.getState();

    if (input.restartPressed) {
      this.restartLevel();
      return;
    }

    switch (state) {
      case 'PLAYING':
        this._updatePlaying(delta, input.pausePressed);
        break;

      case 'PAUSED':
        if (input.pausePressed) this._transitionTo('PLAYING');
        break;

      case 'DEAD':
      case 'RESPAWNING':
        this._updateDeathState(delta);
        break;

      default:
        break;
    }

    // Always update particle system
    this._ctx.particles?.update(delta);
  }

  private _updatePlaying(delta: number, pausePressed: boolean): void {
    if (pausePressed) {
      this._transitionTo('PAUSED');
      return;
    }

    const player = this._player;
    if (!player) return;

    this._timer.update(delta);
    if (this._levelIntroTimer > 0) {
      this._levelIntroTimer -= delta;
    }

    const input = this._ctx.input.getState();

    // Check for jump particle & audio trigger
    if (input.jumpPressed && (player.grounded || player.canCoyoteJump)) {
      this._ctx.particles?.spawnJumpDust(player.position.x + player.width / 2, player.position.y + player.height);
      this._ctx.audio.playJump();
    }

    this._ctx.physics.update(player, input, delta);

    for (const mp of this._movingPlatforms)  mp.update(delta);
    for (const fp of this._fallingPlatforms) fp.update(delta);

    for (const hazard of this._hazards) {
      if (hazard instanceof HiddenSpike) {
        hazard.checkProximity(player.position);
      }
      hazard.update(delta);
    }

    for (const trigger of this._triggers)    trigger.update(delta);
    for (const coin of this._coins)          coin.update(delta);
    for (const checkpoint of this._checkpoints) checkpoint.update(delta);

    const allPlatforms = [
      ...this._platforms,
      ...this._movingPlatforms,
      ...this._fallingPlatforms,
    ];
    this._ctx.collision.resolvePlatforms(player, allPlatforms);
    const boundsResult = this._ctx.collision.applyWorldBounds(
      player,
      this._levelData?.width  ?? GAME_CONFIG.canvas.width,
      this._levelData?.height ?? GAME_CONFIG.canvas.height,
    );

    if (boundsResult.fellInPit) {
      this._handlePlayerDeath('pit');
      return;
    }

    // Landing particle & audio trigger
    if (!this._wasGrounded && player.grounded) {
      this._ctx.particles?.spawnLandDust(player.position.x + player.width / 2, player.position.y + player.height);
      this._ctx.audio.playLand();
    }
    this._wasGrounded = player.grounded;

    const hitCoins = this._ctx.collision.checkCoinCollisions(player, this._coins);
    for (const c of hitCoins) {
      player.coinsCollected += 1;
      this._ctx.eventBus.emit('COIN_COLLECTED', {
        coinId: c.id,
        position: { x: c.position.x, y: c.position.y },
      });
    }

    const activatedCp = this._ctx.collision.checkCheckpointCollisions(player, this._checkpoints);
    if (activatedCp) {
      player.setCheckpoint(activatedCp.id, activatedCp.position.x, activatedCp.position.y - player.height + 10);
      this._ctx.eventBus.emit('CHECKPOINT_ACTIVATED', { checkpointId: activatedCp.id });
    }

    const activatedTriggers = this._ctx.collision.checkTriggerCollisions(player, this._triggers);
    for (const trig of activatedTriggers) {
      this._ctx.eventBus.emit('TRAP_TRIGGERED', { trapId: trig.id, trapType: 'trigger-trap' });
      if (trig.targetId) {
        const target = this._hazards.find((h) => h.id === trig.targetId) ||
                       this._fallingPlatforms.find((fp) => fp.id === trig.targetId);
        if (target && typeof (target as any).trigger === 'function') {
          (target as any).trigger();
        }
      }
    }

    const hitHazard = this._ctx.collision.checkHazardCollisions(player, this._hazards);
    if (hitHazard) {
      const category = (hitHazard as any).category || 'hazard';
      this._handlePlayerDeath(category);
      return;
    }

    const hitExit = this._ctx.collision.checkExitCollision(player, this._exits);
    if (hitExit) {
      if (hitExit.exitType === 'fake' || hitExit instanceof FakeExit) {
        (hitExit as FakeExit).trigger();
        this._ctx.eventBus.emit('TRAP_TRIGGERED', { trapId: hitExit.id, trapType: 'fake-exit' });
        this._handlePlayerDeath('fake-exit');
        return;
      } else {
        this._handleLevelComplete();
        return;
      }
    }

    player.update(delta);

    // Update camera lerp + screen shake
    const shakeEnabled = this._ctx.saveSystem.getSettings().screenShake;
    this._ctx.camera.update(player, delta, shakeEnabled);
  }

  private _syncUIScreen(state: GameState): void {
    switch (state) {
      case 'MAIN_MENU':
        this._ctx.ui.show('main-menu');
        break;
      case 'LEVEL_SELECT':
        this._ctx.ui.show('level-select');
        break;
      case 'PLAYING':
        this._ctx.ui.show('hud');
        break;
      case 'PAUSED':
        this._ctx.ui.show('pause');
        break;
      case 'GAME_OVER':
        this._ctx.ui.show('game-over');
        break;
      case 'LEVEL_COMPLETE':
        this._ctx.ui.show('level-complete');
        break;
      case 'VICTORY':
        this._ctx.ui.show('victory');
        break;
      default:
        break;
    }
  }

  private _handlePlayerDeath(reason: string): void {
    const player = this._player;
    if (!player) return;

    player.playerState = 'DEAD';
    player.velocity    = { x: 0, y: 0 };
    player.lives      -= 1;
    player.deaths     += 1;

    this._ctx.eventBus.emit('PLAYER_DIED', {
      reason,
      position: { x: player.position.x, y: player.position.y },
    });

    if (player.lives <= 0) {
      this._timer.stop();
      this._transitionTo('DEAD');
      this._transitionTo('GAME_OVER');
      this._ctx.ui.gameOver?.render(
        this._levelData?.id ?? 0,
        player.deaths,
        this._timer.getElapsed(),
        this._levelData?.name ?? '',
        player.coinsCollected,
      );
      this._ctx.ui.show('game-over');
      this._ctx.eventBus.emit('GAME_OVER', {
        levelId: this._levelData?.id ?? 0,
        deaths:  player.deaths,
      });
    } else {
      this._transitionTo('DEAD');
      const totalDelay = GAME_CONFIG.player.deathFreezeDuration + GAME_CONFIG.player.respawnDelay;
      this._deathCountdown = new Countdown(totalDelay);
      this._deathCountdown.start();
    }
  }

  private _updateDeathState(delta: number): void {
    this._timer.update(delta);

    for (const mp of this._movingPlatforms)  mp.update(delta);
    for (const fp of this._fallingPlatforms) fp.update(delta);
    for (const h of this._hazards)           h.update(delta);

    const shakeEnabled = this._ctx.saveSystem.getSettings().screenShake;
    if (this._player) {
      this._ctx.camera.update(this._player, delta, shakeEnabled);
    }

    if (!this._deathCountdown) return;

    this._deathCountdown.update(delta);

    if (this._deathCountdown.isDone()) {
      this._deathCountdown = null;
      const player = this._player;
      if (player && player.lives > 0) {
        if (this._ctx.stateMachine.current === 'DEAD') {
          this._transitionTo('RESPAWNING');
        }

        this._resetTraps();

        player.respawn();
        this._ctx.camera.snapToPlayer(player);
        this._transitionTo('PLAYING');
        this._ctx.eventBus.emit('PLAYER_RESPAWNED', {
          checkpointId: player.checkpointId,
          position:     { x: player.position.x, y: player.position.y },
        });
      }
    }
  }

  private _handleLevelComplete(): void {
    const player = this._player;
    if (!player || !this._levelData) return;

    this._timer.stop();
    player.playerState = 'LEVEL_COMPLETE';
    player.velocity    = { x: 0, y: 0 };

    const elapsedTime = this._timer.getElapsed();

    const { isNewBestTime, isNewBestDeaths } = this._ctx.saveSystem.recordLevelCompletion(
      this._levelData.id,
      elapsedTime,
      player.deaths,
      player.coinsCollected,
    );

    this._ctx.eventBus.emit('LEVEL_COMPLETED', {
      levelId: this._levelData.id,
      time:    elapsedTime,
      deaths:  player.deaths,
      coins:   player.coinsCollected,
    });

    this._ctx.ui.levelComplete?.render(
      this._levelData.id,
      this._levelData.name,
      elapsedTime,
      player.deaths,
      player.coinsCollected,
      this._coins.length,
      isNewBestTime,
      isNewBestDeaths,
    );

    if (this._levelData.id === 10 || this._ctx.levelManager.isLastLevel()) {
      this._transitionTo('LEVEL_COMPLETE');
      this._transitionTo('VICTORY');
      this._ctx.ui.victoryScreen?.render(
        player.deaths,
        elapsedTime,
      );
      this._ctx.ui.show('victory');
      this._ctx.eventBus.emit('VICTORY', {
        totalDeaths: player.deaths,
        totalTime:   elapsedTime,
      });
    } else {
      this._transitionTo('LEVEL_COMPLETE');
      this._ctx.ui.show('level-complete');
    }
  }

  private _render(_interpolation: number): void {
    const renderer = this._ctx.renderer;
    const state    = this._ctx.stateMachine.current;

    renderer.clear();

    const isGameplayView = state === 'PLAYING' || state === 'PAUSED' || state === 'DEAD' || state === 'RESPAWNING' || state === 'GAME_OVER' || state === 'LEVEL_COMPLETE' || state === 'VICTORY';

    if (isGameplayView) {
      renderer.beginWorldTransform();
      this._renderWorld();
      renderer.endWorldTransform();

      // Screen-space HUD & Level Intro Toast Overlay
      renderer.drawPlayingHUD(this._fps, state, this._player, this._timer.getElapsed());
      if (this._levelIntroTimer > 0 && this._levelData) {
        const opacity = Math.min(1.0, this._levelIntroTimer / 0.3);
        renderer.drawLevelIntroOverlay(this._levelData.id, this._levelData.name, opacity);
      }
      this._setHtmlOverlayVisible(false);

      if (this._player) {
        this._ctx.ui.hud?.update(
          this._player.lives,
          this._player.deaths,
          this._timer.getElapsed(),
          this._player.coinsCollected,
          this._coins.length,
          this._levelData?.name || '',
        );
      }
    } else {
      renderer.beginWorldTransform();
      renderer.drawDevBackground();
      renderer.endWorldTransform();
      renderer.drawDevOverlay(this._fps, state);
      this._setHtmlOverlayVisible(true);
    }
  }

  private _setHtmlOverlayVisible(visible: boolean): void {
    const el = document.getElementById('dev-overlay');
    if (el) el.style.display = visible ? '' : 'none';
  }

  private _renderWorld(): void {
    const renderer = this._ctx.renderer;
    const camera   = this._ctx.camera;

    renderer.setCameraOffset(camera.x, camera.y);
    renderer.setShakeOffset(camera.shakeX, camera.shakeY);

    // 1. Multi-layer thematic background
    renderer.drawGameBackground(
      this._levelData?.id ?? 1,
      this._levelData?.width ?? GAME_CONFIG.canvas.width,
      this._levelData?.height ?? GAME_CONFIG.canvas.height
    );

    // 2. Triggers
    renderer.renderEntities(this._triggers);

    // 3. Platforms
    renderer.renderEntities(this._platforms);
    renderer.renderEntities(this._movingPlatforms);
    renderer.renderEntities(this._fallingPlatforms);

    // 4. Checkpoints & Coins
    renderer.renderEntities(this._checkpoints);
    renderer.renderEntities(this._coins);

    // 5. Hazards
    renderer.renderEntities(this._hazards);

    // 6. Exits
    renderer.renderEntities(this._exits);

    // 7. Player
    if (this._player) {
      renderer.renderEntities([this._player]);
    }

    // 8. Particles (rendered on top of world entities before UI)
    if (this._ctx.particles) {
      renderer.renderParticles(this._ctx.particles);
    }
  }

  get currentState(): GameState {
    return this._ctx.stateMachine.current;
  }

  get timer(): Timer {
    return this._timer;
  }

  onVisibilityHidden(): void {
    if (this._ctx.stateMachine.canTransition('PAUSED')) {
      this._transitionTo('PAUSED');
    }
  }
}
