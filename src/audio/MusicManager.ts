// ─────────────────────────────────────────────────────────────────────────────
// MusicManager.ts — Procedural Web Audio API background music manager.
// Generates synthesized rhythmic music patterns for Menu, Gameplay, Final Level,
// Game Over, and Victory without external audio files.
// Source of truth: ARCHITECTURE.md §63, TRD.md §58-59, PRD Phase 7 §3-4
// ─────────────────────────────────────────────────────────────────────────────

export type MusicTrack = 'NONE' | 'MENU' | 'GAMEPLAY' | 'FINAL_LEVEL' | 'GAME_OVER' | 'VICTORY';

export class MusicManager {
  private _ctx: AudioContext | null = null;
  private _masterGain: GainNode | null = null;
  private _currentTrack: MusicTrack = 'NONE';
  private _enabled = true;
  private _volume = 0.4; // Default music volume

  private _timerId: ReturnType<typeof setInterval> | null = null;
  private _step = 0;

  constructor() {}

  /** Set the active AudioContext instance. */
  setAudioContext(audioCtx: AudioContext | null): void {
    this._ctx = audioCtx;
    if (this._ctx && !this._masterGain && typeof this._ctx.createGain === 'function') {
      try {
        this._masterGain = this._ctx.createGain();
        this._masterGain.gain.value = this._enabled ? this._volume : 0;
        this._masterGain.connect(this._ctx.destination);
      } catch {
        this._masterGain = null;
      }
    }
  }

  setSettings(enabled: boolean, volume: number): void {
    this._enabled = enabled;
    this._volume = Math.max(0, Math.min(1, volume));

    if (this._masterGain && this._ctx) {
      const now = this._ctx.currentTime;
      const targetGain = this._enabled ? this._volume : 0;
      this._masterGain.gain.setValueAtTime(targetGain, now);
    }

    if (!this._enabled) {
      this.stop();
    }
  }

  get currentTrack(): MusicTrack {
    return this._currentTrack;
  }

  playTrack(track: MusicTrack): void {
    if (!this._enabled) {
      this._currentTrack = track;
      return;
    }

    if (this._currentTrack === track && this._timerId !== null) {
      return; // Already playing this track
    }

    this.stop();
    this._currentTrack = track;

    if (track === 'NONE' || !this._ctx) return;

    this._step = 0;
    const intervalMs = this._getTrackIntervalMs(track);

    // Initial immediate step
    this._playTrackStep(track);

    // Schedule loop
    this._timerId = setInterval(() => {
      this._playTrackStep(track);
    }, intervalMs);
  }

  stop(): void {
    if (this._timerId !== null) {
      clearInterval(this._timerId);
      this._timerId = null;
    }
    this._currentTrack = 'NONE';
    this._step = 0;
  }

  private _getTrackIntervalMs(track: MusicTrack): number {
    switch (track) {
      case 'MENU':        return 600;
      case 'GAMEPLAY':    return 240;
      case 'FINAL_LEVEL': return 160;
      case 'GAME_OVER':   return 320;
      case 'VICTORY':     return 200;
      default:            return 500;
    }
  }

  private _playTrackStep(track: MusicTrack): void {
    if (!this._ctx || !this._masterGain || this._ctx.state !== 'running') return;

    try {
      const now = this._ctx.currentTime;
      const step = this._step;

      switch (track) {
        case 'MENU': {
          // Slow ambient 4-beat pulse: A2 (110Hz) -> F2 (87.3Hz) -> C3 (130.8Hz) -> G2 (98Hz)
          const notes = [110, 87.31, 130.81, 97.99];
          const freq = notes[step % notes.length];
          this._synthNote(freq, 'sine', 0.5, 0.2, now);
          break;
        }
        case 'GAMEPLAY': {
          // Rhythmic indie synth arpeggio: A2 (110Hz) -> C3 (130.8Hz) -> E3 (164.8Hz) -> A3 (220Hz)
          const notes = [110.0, 130.81, 164.81, 220.0, 164.81, 130.81, 146.83, 196.0];
          const freq = notes[step % notes.length];
          const type = (step % 4 === 0) ? 'triangle' : 'sine';
          const vol  = (step % 4 === 0) ? 0.25 : 0.15;
          this._synthNote(freq, type, 0.18, vol, now);
          break;
        }
        case 'FINAL_LEVEL': {
          // Tense fast 8-beat synth pattern: D3 (146.8Hz) with staccato D#3 accent
          const notes = [146.83, 146.83, 155.56, 146.83, 146.83, 174.61, 146.83, 130.81];
          const freq = notes[step % notes.length];
          this._synthNote(freq, 'sawtooth', 0.12, 0.2, now);
          break;
        }
        case 'GAME_OVER': {
          // Short 4-note descending sequence: E3 -> C3 -> G2 -> E2 (single play then stop)
          const notes = [164.81, 130.81, 97.99, 82.41];
          if (step < notes.length) {
            this._synthNote(notes[step], 'triangle', 0.28, 0.3, now);
          } else if (step === notes.length && this._timerId !== null) {
            clearInterval(this._timerId);
            this._timerId = null;
          }
          break;
        }
        case 'VICTORY': {
          // 6-note celebratory sequence: C4 -> E4 -> G4 -> C5 -> E5 -> G5
          const notes = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99];
          if (step < notes.length) {
            this._synthNote(notes[step], 'triangle', 0.18, 0.3, now);
          } else if (step === notes.length && this._timerId !== null) {
            clearInterval(this._timerId);
            this._timerId = null;
          }
          break;
        }
      }

      this._step++;
    } catch {
      // Safe fallback if audio fails
    }
  }

  private _synthNote(freq: number, type: OscillatorType, durationSec: number, peakVol: number, startTime: number): void {
    if (!this._ctx || !this._masterGain) return;

    try {
      const osc  = this._ctx.createOscillator();
      const gain = this._ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(peakVol, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + durationSec);

      osc.connect(gain);
      gain.connect(this._masterGain);

      osc.start(startTime);
      osc.stop(startTime + durationSec + 0.05);

      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch {}
      };
    } catch {
      // Ignore audio synthesis errors
    }
  }
}
