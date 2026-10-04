// ─────────────────────────────────────────────────────────────────────────────
// GameOver.ts — Game Over UI component.
// Triggered when all 3 lives are lost.
// Options: RETRY, LEVEL SELECT, MAIN MENU.
// Source of truth: GDD §16, ARCHITECTURE.md §59-61
// ─────────────────────────────────────────────────────────────────────────────

import type { GameContext } from '../game/GameContext.js';
import { leaderboardService } from '../services/LeaderboardService.js';
import { analyticsService } from '../services/AnalyticsService.js';

export class GameOver {
  private _container: HTMLElement | null = null;
  private _ctx: GameContext;

  constructor(context: GameContext) {
    this._ctx = context;
  }

  mount(): void {
    this._container = document.getElementById('ui-game-over');
    if (!this._container) return;

    this.render(0, 0, 0, '', 0);
  }

  render(levelId: number, deaths: number, timeSec: number, levelName: string, coins: number = 0): void {
    if (!this._container) return;

    analyticsService.track('game_over', { levelId, deaths, timeSec, coins });

    const timeStr = this._formatTime(timeSec);
    const timeMs = timeSec > 0 ? Math.round(timeSec * 1000) : 5000;

    this._container.innerHTML = `
      <div class="menu-box game-over-box">
        <h2 class="menu-title text-danger">GAME OVER</h2>
        <p class="subtitle">${levelName ? levelName.toUpperCase() : `LEVEL ${levelId}`}</p>

        <div class="results-summary">
          <div class="result-row"><span class="result-label">REACHED:</span> <span class="result-val">LEVEL ${levelId} 💀</span></div>
          <div class="result-row"><span class="result-label">DEATHS:</span> <span class="result-val">${deaths}</span></div>
          <div class="result-row"><span class="result-label">COINS:</span> <span class="result-val">${coins}</span></div>
          <div class="result-row"><span class="result-label">TIME:</span> <span class="result-val">${timeStr}</span></div>
        </div>

        <div class="menu-actions">
          <button id="btn-game-over-retry" class="menu-btn primary-btn">RETRY</button>
          <button id="btn-game-over-level-select" class="menu-btn">LEVEL SELECT</button>
          <button id="btn-game-over-main-menu" class="menu-btn secondary-btn">MAIN MENU</button>
        </div>
      </div>
    `;

    this._bindEvents(levelId);

    // Asynchronously submit DEAD run to leaderboard
    this._submitDeadRunAsync(levelId, timeMs, deaths, coins);
  }

  private async _submitDeadRunAsync(levelId: number, timeMs: number, deaths: number, coins: number): Promise<void> {
    await leaderboardService.submitRun({
      runId: leaderboardService.getActiveRunId() || '',
      level: levelId,
      highestLevelReached: levelId,
      completedLevels: Math.max(0, levelId - 1),
      status: 'DEAD',
      timeMs,
      deaths,
      coins,
    });
  }

  private _bindEvents(levelId: number): void {
    if (!this._container) return;

    const btnRetry       = this._container.querySelector('#btn-game-over-retry');
    const btnLevelSelect = this._container.querySelector('#btn-game-over-level-select');
    const btnMainMenu    = this._container.querySelector('#btn-game-over-main-menu');

    const game = (this._ctx.ui as any).gameInstance;

    btnRetry?.addEventListener('click', async () => {
      if (game) {
        await leaderboardService.startRun(levelId);
        game.restartLevel();
      }
    });

    btnLevelSelect?.addEventListener('click', () => {
      this._ctx.stateMachine.transition('LEVEL_SELECT');
      this._ctx.ui.show('level-select');
    });

    btnMainMenu?.addEventListener('click', () => {
      this._ctx.stateMachine.transition('MAIN_MENU');
      this._ctx.ui.show('main-menu');
    });
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
