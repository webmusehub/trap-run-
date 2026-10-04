// ─────────────────────────────────────────────────────────────────────────────
// SFXManager.ts — Procedural Web Audio API sound effect generator.
// Generates punchy, responsive indie platformer SFX for movement, traps,
// collectibles, checkpoints, death, completion, and UI interaction.
// Source of truth: ARCHITECTURE.md §64, TRD.md §58-59, PRD Phase 7 §5-6
// ─────────────────────────────────────────────────────────────────────────────

export class SFXManager {
  private _ctx: AudioContext | null = null;
  private _masterGain: GainNode | null = null;
  private _enabled = true;
  private _volume = 0.6; // Default SFX volume

  private _lastPlayTimes: Map<string, number> = new Map();
  private readonly _cooldownMs = 40; // Cooldown between identical SFX triggers

  constructor() {}

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
  }

  private _canPlay(sfxName: string): boolean {
    if (!this._enabled || !this._ctx || this._ctx.state !== 'running') return false;
    const now = performance.now();
    const last = this._lastPlayTimes.get(sfxName) || 0;
    if (now - last < this._cooldownMs) return false;
    this._lastPlayTimes.set(sfxName, now);
    return true;
  }

  // ── Procedural Sound Effects ────────────────────────────────────────────────

  playJump(): void {
    if (!this._canPlay('jump') || !this._ctx || !this._masterGain) return;
    try {
      const now  = this._ctx.currentTime;
      const osc  = this._ctx.createOscillator();
      const gain = this._ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(380, now + 0.1);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

      osc.connect(gain);
      gain.connect(this._masterGain);

      osc.start(now);
      osc.stop(now + 0.105);
      this._cleanupOnEnded(osc, gain);
    } catch {}
  }

  playLand(): void {
    if (!this._canPlay('land') || !this._ctx || !this._masterGain) return;
    try {
      const now  = this._ctx.currentTime;
      const osc  = this._ctx.createOscillator();
      const gain = this._ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(90, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.08);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

      osc.connect(gain);
      gain.connect(this._masterGain);

      osc.start(now);
      osc.stop(now + 0.085);
      this._cleanupOnEnded(osc, gain);
    } catch {}
  }

  playCoin(): void {
    if (!this._canPlay('coin') || !this._ctx || !this._masterGain) return;
    try {
      const now  = this._ctx.currentTime;
      const osc  = this._ctx.createOscillator();
      const gain = this._ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, now); // B5
      osc.frequency.setValueAtTime(1318.51, now + 0.06); // E6

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);

      osc.connect(gain);
      gain.connect(this._masterGain);

      osc.start(now);
      osc.stop(now + 0.145);
      this._cleanupOnEnded(osc, gain);
    } catch {}
  }

  playCheckpoint(): void {
    if (!this._canPlay('checkpoint') || !this._ctx || !this._masterGain) return;
    try {
      const now  = this._ctx.currentTime;
      const osc  = this._ctx.createOscillator();
      const gain = this._ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now); // A4
      osc.frequency.setValueAtTime(554.37, now + 0.08); // C#5
      osc.frequency.setValueAtTime(659.25, now + 0.16); // E5

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);

      osc.connect(gain);
      gain.connect(this._masterGain);

      osc.start(now);
      osc.stop(now + 0.285);
      this._cleanupOnEnded(osc, gain);
    } catch {}
  }

  playTrapTrigger(): void {
    if (!this._canPlay('trap') || !this._ctx || !this._masterGain) return;
    try {
      const now  = this._ctx.currentTime;
      const osc  = this._ctx.createOscillator();
      const gain = this._ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.linearRampToValueAtTime(110, now + 0.12);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

      osc.connect(gain);
      gain.connect(this._masterGain);

      osc.start(now);
      osc.stop(now + 0.125);
      this._cleanupOnEnded(osc, gain);
    } catch {}
  }

  playDeath(): void {
    if (!this._canPlay('death') || !this._ctx || !this._masterGain) return;
    try {
      const now  = this._ctx.currentTime;
      const osc  = this._ctx.createOscillator();
      const gain = this._ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(55, now + 0.35);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      osc.connect(gain);
      gain.connect(this._masterGain);

      osc.start(now);
      osc.stop(now + 0.355);
      this._cleanupOnEnded(osc, gain);
    } catch {}
  }

  playRespawn(): void {
    if (!this._canPlay('respawn') || !this._ctx || !this._masterGain) return;
    try {
      const now  = this._ctx.currentTime;
      const osc  = this._ctx.createOscillator();
      const gain = this._ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.linearRampToValueAtTime(780, now + 0.2);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

      osc.connect(gain);
      gain.connect(this._masterGain);

      osc.start(now);
      osc.stop(now + 0.205);
      this._cleanupOnEnded(osc, gain);
    } catch {}
  }

  playButtonClick(): void {
    if (!this._canPlay('button') || !this._ctx || !this._masterGain) return;
    try {
      const now  = this._ctx.currentTime;
      const osc  = this._ctx.createOscillator();
      const gain = this._ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.03);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.03);

      osc.connect(gain);
      gain.connect(this._masterGain);

      osc.start(now);
      osc.stop(now + 0.035);
      this._cleanupOnEnded(osc, gain);
    } catch {}
  }

  playFakeExit(): void {
    if (!this._canPlay('fake_exit') || !this._ctx || !this._masterGain) return;
    try {
      const now  = this._ctx.currentTime;
      const osc  = this._ctx.createOscillator();
      const gain = this._ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.linearRampToValueAtTime(40, now + 0.45);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

      osc.connect(gain);
      gain.connect(this._masterGain);

      osc.start(now);
      osc.stop(now + 0.455);
      this._cleanupOnEnded(osc, gain);
    } catch {}
  }

  playLevelComplete(): void {
    if (!this._canPlay('level_complete') || !this._ctx || !this._masterGain) return;
    try {
      const now  = this._ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        const startTime = now + i * 0.12;
        const osc = this._ctx!.createOscillator();
        const gain = this._ctx!.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.2, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);

        osc.connect(gain);
        gain.connect(this._masterGain!);

        osc.start(startTime);
        osc.stop(startTime + 0.205);
        this._cleanupOnEnded(osc, gain);
      });
    } catch {}
  }

  private _cleanupOnEnded(osc: OscillatorNode, gain: GainNode): void {
    osc.onended = () => {
      try {
        osc.disconnect();
        gain.disconnect();
      } catch {}
    };
  }
}
