// ─────────────────────────────────────────────────────────────────────────────
// AudioManager.ts — Top-level audio manager for Trap Run.
// Coordinates MusicManager, SFXManager, AudioContext lifecycle, EventBus, and SaveSystem.
// Source of truth: ARCHITECTURE.md §63-64, TRD.md §58-59, PRD Phase 7 §1-2
// ─────────────────────────────────────────────────────────────────────────────

import type { SaveSettings } from '../data/types.js';
import { GAME_CONFIG }       from '../game/GameConfig.js';
import { MusicManager, type MusicTrack } from './MusicManager.js';
import { SFXManager }         from './SFXManager.js';
import type { EventBus }      from '../systems/EventBus.js';
import type { SaveSystem }    from '../systems/SaveSystem.js';

export class AudioManager {
  private _musicVolume: number;
  private _sfxVolume: number;
  private _musicEnabled = true;
  private _sfxEnabled   = true;
  private _initialized  = false;

  private _audioCtx: AudioContext | null = null;

  public readonly music: MusicManager;
  public readonly sfx:   SFXManager;

  private _currentLevelId = 1;
  private _unsubscribeEventBus: (() => void) | null = null;

  constructor() {
    this._musicVolume  = GAME_CONFIG.audio?.defaultMusicVolume ?? 0.4;
    this._sfxVolume    = GAME_CONFIG.audio?.defaultSfxVolume   ?? 0.6;

    this.music = new MusicManager();
    this.sfx   = new SFXManager();

    this._setupUserGestureUnlock();
  }

  /** Initialize AudioContext on first user interaction to satisfy browser autoplay policy. */
  initialize(): void {
    if (this._initialized && this._audioCtx?.state === 'running') return;

    try {
      if (!this._audioCtx && typeof AudioContext !== 'undefined') {
        this._audioCtx = new AudioContext();
      }

      if (this._audioCtx && this._audioCtx.state === 'suspended') {
        this._audioCtx.resume().catch(() => undefined);
      }

      this.music.setAudioContext(this._audioCtx);
      this.sfx.setAudioContext(this._audioCtx);
      this._initialized = true;

      this.music.setSettings(this._musicEnabled, this._musicVolume);
      this.sfx.setSettings(this._sfxEnabled, this._sfxVolume);

      console.log('[AudioManager] AudioContext initialized safely.');
    } catch {
      console.warn('[AudioManager] Web Audio API not supported or blocked by browser.');
    }
  }

  private _setupUserGestureUnlock(): void {
    if (typeof window === 'undefined') return;

    const unlock = () => {
      this.initialize();
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('click', unlock);
    };

    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    window.addEventListener('click', unlock, { once: true });

    // UI button click sound handler
    if (typeof document !== 'undefined') {
      document.addEventListener('click', (e) => {
        const target = e.target as HTMLElement | null;
        if (target && target.closest('button, .ui-btn, .level-card')) {
          this.playButtonClick();
        }
      });
    }
  }

  connectEventBus(eventBus: EventBus, saveSystem: SaveSystem): void {
    // Sync initial settings from SaveSystem
    const settings = saveSystem.getSettings();
    this.applySettings(settings);

    // Subscribe to EventBus events
    const un1 = eventBus.on('COIN_COLLECTED', () => this.playCoin());
    const un2 = eventBus.on('CHECKPOINT_ACTIVATED', () => this.playCheckpoint());
    const un3 = eventBus.on('PLAYER_DIED', () => this.playDeath());
    const un4 = eventBus.on('PLAYER_RESPAWNED', () => this.playRespawn());
    const un5 = eventBus.on('LEVEL_STARTED', ({ levelId }) => {
      this._currentLevelId = levelId;
      this._updateMusicForState('PLAYING');
    });
    const un6 = eventBus.on('LEVEL_COMPLETED', () => {
      this.playLevelComplete();
    });
    const un7 = eventBus.on('TRAP_TRIGGERED', ({ trapType }) => {
      if (trapType === 'fake-exit') {
        this.playFakeExit();
      } else {
        this.playTrap();
      }
    });
    const un8 = eventBus.on('STATE_CHANGED', ({ to }) => {
      this._updateMusicForState(to);
    });
    const un9 = eventBus.on('SETTINGS_CHANGED', ({ settings }) => {
      this.applySettings(settings);
    });

    this._unsubscribeEventBus = () => {
      un1(); un2(); un3(); un4(); un5(); un6(); un7(); un8(); un9();
    };
  }

  private _updateMusicForState(stateName: string): void {
    if (!this._musicEnabled) {
      this.music.stop();
      return;
    }

    switch (stateName) {
      case 'MAIN_MENU':
      case 'LEVEL_SELECT':
        this.music.playTrack('MENU');
        break;
      case 'PLAYING':
        if (this._currentLevelId === 10) {
          this.music.playTrack('FINAL_LEVEL');
        } else {
          this.music.playTrack('GAMEPLAY');
        }
        break;
      case 'GAME_OVER':
        this.music.playTrack('GAME_OVER');
        break;
      case 'VICTORY':
        this.music.playTrack('VICTORY');
        break;
      case 'PAUSED':
        // Music remains playing at current track per design
        break;
      default:
        break;
    }
  }

  applySettings(settings: SaveSettings): void {
    this._musicEnabled = settings.music;
    this._sfxEnabled   = settings.sfx;

    this.music.setSettings(this._musicEnabled, this._musicVolume);
    this.sfx.setSettings(this._sfxEnabled, this._sfxVolume);
  }

  setMusicVolume(v: number): void {
    this._musicVolume = Math.max(0, Math.min(1, v));
    this.music.setSettings(this._musicEnabled, this._musicVolume);
  }

  setSfxVolume(v: number): void {
    this._sfxVolume = Math.max(0, Math.min(1, v));
    this.sfx.setSettings(this._sfxEnabled, this._sfxVolume);
  }

  getMusicVolume(): number { return this._musicVolume; }
  getSfxVolume(): number   { return this._sfxVolume; }

  // ── Convenience Named SFX Methods ──────────────────────────────────────────
  playJump():          void { this.initialize(); this.sfx.playJump(); }
  playLand():          void { this.initialize(); this.sfx.playLand(); }
  playCoin():          void { this.initialize(); this.sfx.playCoin(); }
  playCheckpoint():    void { this.initialize(); this.sfx.playCheckpoint(); }
  playTrap():          void { this.initialize(); this.sfx.playTrapTrigger(); }
  playDeath():         void { this.initialize(); this.sfx.playDeath(); }
  playRespawn():       void { this.initialize(); this.sfx.playRespawn(); }
  playButtonClick():   void { this.initialize(); this.sfx.playButtonClick(); }
  playLevelComplete(): void { this.initialize(); this.sfx.playLevelComplete(); }
  playFakeExit():      void { this.initialize(); this.sfx.playFakeExit(); }

  playMusic(trackName: MusicTrack): void {
    this.initialize();
    this.music.playTrack(trackName);
  }

  stopMusic(): void {
    this.music.stop();
  }

  destroy(): void {
    if (this._unsubscribeEventBus) {
      this._unsubscribeEventBus();
    }
    this.music.stop();
    this._audioCtx?.close().catch(() => undefined);
    this._audioCtx = null;
    this._initialized = false;
  }
}
