// ─────────────────────────────────────────────────────────────────────────────
// VictoryScreen.ts — Victory Screen UI component.
// Displayed upon completing Level 10 ("The Final Run").
// Options: PLAY AGAIN, LEVEL SELECT, MAIN MENU.
// Source of truth: GDD §17, ARCHITECTURE.md §59-61
// ─────────────────────────────────────────────────────────────────────────────

import type { GameContext } from '../game/GameContext.js';
import { leaderboardService } from '../services/LeaderboardService.js';
import { analyticsService } from '../services/AnalyticsService.js';
import { monetizationService } from '../services/MonetizationService.js';

export class VictoryScreen {
  private _container: HTMLElement | null = null;
  private _ctx: GameContext;

  constructor(context: GameContext) {
    this._ctx = context;
  }

  mount(): void {
    this._container = document.getElementById('ui-victory');
    if (!this._container) return;

    this.render(0, 0);
  }

  render(totalDeaths: number, totalTimeSec: number): void {
    if (!this._container) return;

    analyticsService.track('victory', { totalDeaths, totalTimeSec });

    const saveSystem = this._ctx.saveSystem;
    const completedCount = saveSystem.getData().completedLevels.length;
    const totalCoins = saveSystem.getTotalCoinsCollected();
    const timeStr = this._formatTime(totalTimeSec);
    const timeMs = totalTimeSec > 0 ? Math.round(totalTimeSec * 1000) : 15000;

    this._container.innerHTML = `
      <div class="menu-box victory-box">
        <h1 class="game-title text-gold">TRAP RUN</h1>
        <div class="victory-congrats-banner">🎉 CONGRATULATIONS! 🎉</div>
        <p class="victory-congrats-sub">YOU HAVE COMPLETED ALL THE LEVELS!</p>
        <p class="game-tagline text-gold">YOU SURVIVED.</p>

        <div class="results-summary">
          <div class="result-row">
            <span class="result-label">TOTAL LEVELS:</span>
            <span class="result-val">${completedCount} / 10</span>
          </div>

          <div class="result-row">
            <span class="result-label">TOTAL COINS:</span>
            <span class="result-val">${totalCoins} / 100</span>
          </div>

          <div class="result-row">
            <span class="result-label">RUN DEATHS:</span>
            <span class="result-val">${totalDeaths}</span>
          </div>

          <div class="result-row">
            <span class="result-label">RUN TIME:</span>
            <span class="result-val">${timeStr}</span>
          </div>

          <div class="result-row" id="victory-leaderboard-status">
            <span class="result-label">RANK:</span>
            <span class="result-val rank-status-val">Submitting score...</span>
          </div>
        </div>

        <div class="menu-actions">
          <button id="btn-victory-play-again" class="menu-btn primary-btn">PLAY AGAIN</button>
          <button id="btn-victory-leaderboard" class="menu-btn">LEADERBOARD</button>
          <button id="btn-victory-share" class="menu-btn share-btn">SHARE VICTORY 🔗</button>
          <button id="btn-victory-level-select" class="menu-btn">LEVEL SELECT</button>
          <button id="btn-victory-main-menu" class="menu-btn secondary-btn">MAIN MENU</button>
        </div>
      </div>
    `;

    monetizationService.mountAdPlacement('victory', this._container);
    this._bindEvents(totalTimeSec, totalDeaths, totalCoins);

    // Asynchronous non-blocking leaderboard submission for Level 10
    this._submitScoreAsync(10, timeMs, totalDeaths, totalCoins);
  }

  private async _submitScoreAsync(levelId: number, timeMs: number, deaths: number, coins: number): Promise<void> {
    const statusEl = this._container?.querySelector('#victory-leaderboard-status .rank-status-val');

    const result = await leaderboardService.submitRun({
      runId: leaderboardService.getActiveRunId() || '',
      level: levelId,
      timeMs,
      deaths,
      coins,
    });

    if (!statusEl) return;

    if (result.success) {
      if (result.rank) {
        statusEl.innerHTML = `<span class="badge badge-gold">GLOBAL RANK #${result.rank}</span>`;
      } else {
        statusEl.innerHTML = `<span class="text-success">Score Recorded</span>`;
      }
    } else {
      statusEl.innerHTML = `<span class="text-muted" title="${result.reason || 'Network offline'}">Score saved locally</span>`;
    }
  }

  private _bindEvents(totalTimeSec: number, _totalDeaths: number, totalCoins: number): void {
    if (!this._container) return;

    const btnPlayAgain   = this._container.querySelector('#btn-victory-play-again');
    const btnLeaderboard = this._container.querySelector('#btn-victory-leaderboard');
    const btnShare       = this._container.querySelector('#btn-victory-share');
    const btnLevelSelect = this._container.querySelector('#btn-victory-level-select');
    const btnMainMenu    = this._container.querySelector('#btn-victory-main-menu');

    const game = (this._ctx.ui as any).gameInstance;

    btnPlayAgain?.addEventListener('click', async () => {
      if (game) {
        await leaderboardService.startRun(1);
        game.loadLevelById(1);
      }
    });

    btnLeaderboard?.addEventListener('click', () => {
      this._ctx.ui.show('leaderboard');
    });

    btnShare?.addEventListener('click', () => {
      this._shareScore(totalTimeSec, totalCoins);
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

  private _shareScore(timeSec: number, coins: number): void {
    analyticsService.track('share_clicked', { levelId: 10, timeSec });
    const formatted = this._formatTime(timeSec);
    const text = `🎉 I just COMPLETED ALL 10 LEVELS of Trap Run in ${formatted} with ${coins} coins! Can you beat me? #TrapRun`;

    if (navigator.share) {
      navigator.share({
        title: 'Trap Run Victory!',
        text,
        url: window.location.href,
      }).catch(() => {
        this._copyToClipboard(text);
      });
    } else {
      this._copyToClipboard(text);
    }
  }

  private _copyToClipboard(text: string): void {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        alert('Victory text copied to clipboard!');
      }).catch(() => {
        alert(text);
      });
    } else {
      alert(text);
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
