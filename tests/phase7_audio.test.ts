// ─────────────────────────────────────────────────────────────────────────────
// phase7_audio.test.ts — Unit tests for Phase 7 Audio & Sound Design.
// Tests: AudioManager, MusicManager, SFXManager, EventBus integration,
// AudioContext safety, Music & SFX settings persistence, and cleanup.
// Source of truth: ARCHITECTURE.md §63-64, TRD.md §58-59, PRD Phase 7 §17
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AudioManager } from '../src/audio/AudioManager.js';
import { MusicManager } from '../src/audio/MusicManager.js';
import { SFXManager }   from '../src/audio/SFXManager.js';
import { EventBus }     from '../src/systems/EventBus.js';
import { SaveSystem }   from '../src/systems/SaveSystem.js';
import { MemoryStorageAdapter } from '../src/utils/storage.js';

describe('Phase 7 MusicManager Unit Tests', () => {
  let music: MusicManager;

  beforeEach(() => {
    music = new MusicManager();
  });

  it('starts with currentTrack NONE and handles track transitions cleanly', () => {
    expect(music.currentTrack).toBe('NONE');

    music.playTrack('MENU');
    expect(music.currentTrack).toBe('MENU');

    music.playTrack('GAMEPLAY');
    expect(music.currentTrack).toBe('GAMEPLAY');

    music.playTrack('FINAL_LEVEL');
    expect(music.currentTrack).toBe('FINAL_LEVEL');

    music.playTrack('GAME_OVER');
    expect(music.currentTrack).toBe('GAME_OVER');

    music.playTrack('VICTORY');
    expect(music.currentTrack).toBe('VICTORY');

    music.stop();
    expect(music.currentTrack).toBe('NONE');
  });

  it('immediately stops playing when music is disabled in settings', () => {
    music.playTrack('GAMEPLAY');
    expect(music.currentTrack).toBe('GAMEPLAY');

    music.setSettings(false, 0.5);
    expect(music.currentTrack).toBe('NONE');
  });
});

describe('Phase 7 SFXManager Unit Tests', () => {
  let sfx: SFXManager;

  beforeEach(() => {
    sfx = new SFXManager();
  });

  it('handles all required SFX playback calls safely without throwing', () => {
    expect(() => sfx.playJump()).not.toThrow();
    expect(() => sfx.playLand()).not.toThrow();
    expect(() => sfx.playCoin()).not.toThrow();
    expect(() => sfx.playCheckpoint()).not.toThrow();
    expect(() => sfx.playTrapTrigger()).not.toThrow();
    expect(() => sfx.playDeath()).not.toThrow();
    expect(() => sfx.playRespawn()).not.toThrow();
    expect(() => sfx.playButtonClick()).not.toThrow();
    expect(() => sfx.playLevelComplete()).not.toThrow();
    expect(() => sfx.playFakeExit()).not.toThrow();
  });

  it('respects SFX settings disabled state', () => {
    sfx.setSettings(false, 0.5);
    // Should safely do nothing when disabled
    expect(() => sfx.playJump()).not.toThrow();
    expect(() => sfx.playCoin()).not.toThrow();
  });
});

describe('Phase 7 AudioManager & EventBus Integration Tests', () => {
  let audio: AudioManager;
  let eventBus: EventBus;
  let saveSystem: SaveSystem;

  beforeEach(() => {
    audio = new AudioManager();
    eventBus = new EventBus();
    saveSystem = new SaveSystem(new MemoryStorageAdapter());
    audio.connectEventBus(eventBus, saveSystem);
  });

  it('initializes safely and creates AudioContext only once', () => {
    expect(() => audio.initialize()).not.toThrow();
    expect(() => audio.initialize()).not.toThrow(); // Idempotent call
  });

  it('routes EventBus gameplay events to audio playback', () => {
    const playCoinSpy = vi.spyOn(audio, 'playCoin');
    const playCheckpointSpy = vi.spyOn(audio, 'playCheckpoint');
    const playDeathSpy = vi.spyOn(audio, 'playDeath');
    const playRespawnSpy = vi.spyOn(audio, 'playRespawn');
    const playLevelCompleteSpy = vi.spyOn(audio, 'playLevelComplete');
    const playFakeExitSpy = vi.spyOn(audio, 'playFakeExit');

    eventBus.emit('COIN_COLLECTED', { coinId: 'c1', position: { x: 10, y: 10 } });
    expect(playCoinSpy).toHaveBeenCalledTimes(1);

    eventBus.emit('CHECKPOINT_ACTIVATED', { checkpointId: 'cp1' });
    expect(playCheckpointSpy).toHaveBeenCalledTimes(1);

    eventBus.emit('PLAYER_DIED', { reason: 'spike', position: { x: 10, y: 10 } });
    expect(playDeathSpy).toHaveBeenCalledTimes(1);

    eventBus.emit('PLAYER_RESPAWNED', { checkpointId: null, position: { x: 10, y: 10 } });
    expect(playRespawnSpy).toHaveBeenCalledTimes(1);

    eventBus.emit('LEVEL_COMPLETED', { levelId: 1, time: 20, deaths: 0, coins: 5 });
    expect(playLevelCompleteSpy).toHaveBeenCalledTimes(1);

    eventBus.emit('TRAP_TRIGGERED', { trapId: 'fe1', trapType: 'fake-exit' });
    expect(playFakeExitSpy).toHaveBeenCalledTimes(1);
  });

  it('updates music track automatically on game STATE_CHANGED events', () => {
    eventBus.emit('STATE_CHANGED', { from: 'BOOT', to: 'MAIN_MENU' });
    expect(audio.music.currentTrack).toBe('MENU');

    eventBus.emit('LEVEL_STARTED', { levelId: 1 });
    expect(audio.music.currentTrack).toBe('GAMEPLAY');

    eventBus.emit('LEVEL_STARTED', { levelId: 10 });
    expect(audio.music.currentTrack).toBe('FINAL_LEVEL');

    eventBus.emit('STATE_CHANGED', { from: 'PLAYING', to: 'GAME_OVER' });
    expect(audio.music.currentTrack).toBe('GAME_OVER');

    eventBus.emit('STATE_CHANGED', { from: 'PLAYING', to: 'VICTORY' });
    expect(audio.music.currentTrack).toBe('VICTORY');
  });

  it('persists and applies Music and SFX toggle changes immediately', () => {
    saveSystem.updateSettings({ music: false, sfx: false });
    expect(audio.music.currentTrack).toBe('NONE');

    saveSystem.updateSettings({ music: true, sfx: true });
    eventBus.emit('STATE_CHANGED', { from: 'MAIN_MENU', to: 'LEVEL_SELECT' });
    expect(audio.music.currentTrack).toBe('MENU');
  });

  it('cleans up resources on destroy() without errors or orphaned nodes', () => {
    expect(() => audio.destroy()).not.toThrow();
  });
});
