// ─────────────────────────────────────────────────────────────────────────────
// HUD.ts — Gameplay Heads-Up Display UI component.
// Renders real-time lives, deaths, timer, coins, level title, and checkpoint toast.
// Source of truth: GDD §12, ARCHITECTURE.md §62, PRD §14
// ─────────────────────────────────────────────────────────────────────────────

import type { GameContext } from '../game/GameContext.js';

export class HUD {
  private _container: HTMLElement | null = null;
  private _ctx: GameContext;
  private _checkpointToastTimer: number | null = null;

  constructor(context: GameContext) {
    this._ctx = context;
  }

  mount(): void {
    this._container = document.getElementById('ui-hud');
    if (!this._container) return;

    this.render();
    this._bindEvents();
  }

  render(): void {
    if (!this._container) return;

    this._container.innerHTML = `
      <div class="hud-container">
        <!-- Top Left: Lives & Deaths -->
        <div class="hud-group hud-left">
          <div class="hud-stat" id="hud-lives">
            <span class="hud-label">LIVES:</span>
            <span class="hud-hearts" id="hud-hearts-val">♥♥♥</span>
          </div>
          <div class="hud-stat" id="hud-deaths">
            <span class="hud-label">DEATHS:</span>
            <span class="hud-val" id="hud-deaths-val">0</span>
          </div>
        </div>

        <!-- Top Center: Timer & Level Name -->
        <div class="hud-group hud-center">
          <div class="hud-level-title" id="hud-level-name">LEVEL 1 — FIRST STEPS</div>
          <div class="hud-timer" id="hud-timer-val">00:00.00</div>
        </div>

        <!-- Top Right: Coins -->
        <div class="hud-group hud-right">
          <div class="hud-stat" id="hud-coins">
            <span class="hud-icon">🪙</span>
            <span class="hud-val" id="hud-coins-val">0 / 5</span>
          </div>
        </div>

        <!-- Checkpoint Toast -->
        <div class="checkpoint-toast ui-hidden" id="hud-checkpoint-toast">
          ✓ CHECKPOINT ACTIVATED
        </div>
      </div>
    `;
  }

  private _bindEvents(): void {
    this._ctx.eventBus.on('CHECKPOINT_ACTIVATED', () => {
      this.showCheckpointToast();
    });
  }

  showCheckpointToast(): void {
    const toast = document.getElementById('hud-checkpoint-toast');
    if (!toast) return;

    toast.classList.remove('ui-hidden');
    toast.classList.add('toast-active');

    if (this._checkpointToastTimer !== null) {
      window.clearTimeout(this._checkpointToastTimer);
    }

    this._checkpointToastTimer = window.setTimeout(() => {
      toast.classList.remove('toast-active');
      toast.classList.add('ui-hidden');
      this._checkpointToastTimer = null;
    }, 2000);
  }

  /** Update HUD fields every render frame */
  update(lives: number, deaths: number, timeSec: number, coins: number, maxCoins: number, levelName: string): void {
    const heartsEl = document.getElementById('hud-hearts-val');
    const deathsEl = document.getElementById('hud-deaths-val');
    const timerEl  = document.getElementById('hud-timer-val');
    const coinsEl  = document.getElementById('hud-coins-val');
    const titleEl  = document.getElementById('hud-level-name');

    if (heartsEl) {
      heartsEl.textContent = '♥'.repeat(Math.max(0, lives));
    }
    if (deathsEl) {
      deathsEl.textContent = String(deaths);
    }
    if (timerEl) {
      timerEl.textContent = this._formatTime(timeSec);
    }
    if (coinsEl) {
      coinsEl.textContent = `${coins} / ${maxCoins}`;
    }
    if (titleEl && levelName) {
      titleEl.textContent = levelName.toUpperCase();
    }
  }

  private _formatTime(sec: number): string {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    const ms   = Math.floor((sec % 1) * 100);
    const mStr = String(mins).padStart(2, '0');
    const sStr = String(secs).padStart(2, '0');
    const msStr = String(ms).padStart(2, '0');
    return `${mStr}:${sStr}.${msStr}`;
  }
}
