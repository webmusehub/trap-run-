// ─────────────────────────────────────────────────────────────────────────────
// LevelComplete.ts — Level Complete UI component.
// Displays level completion stats, new best record badges, and navigation.
// Source of truth: GDD §17, ARCHITECTURE.md §53, §59-61
// ─────────────────────────────────────────────────────────────────────────────

import type { GameContext } from '../game/GameContext.js';
import { leaderboardService } from '../services/LeaderboardService.js';
import { analyticsService } from '../services/AnalyticsService.js';
import { monetizationService } from '../services/MonetizationService.js';

export class LevelComplete {
  private _container: HTMLElement | null = null;
  private _ctx: GameContext;

  constructor(context: GameContext) {
    this._ctx = context;
  }

  mount(): void {
    this._container = document.getElementById('ui-level-complete');
    if (!this._container) return;

    this.render(1, 'First Steps', 45.0, 0, 5, 5, false, false);
  }

  render(
    levelId: number,
    levelName: string,
    timeSec: number,
    deaths: number,
    coins: number,
    totalCoins: number,
    isNewBestTime: boolean,
    isNewBestDeaths: boolean,
  ): void {
    if (!this._container) return;

    const timeStr = this._formatTime(timeSec);
    const isLastLevel = levelId >= 10;
    const timeMs = timeSec > 0 ? Math.round(timeSec * 1000) : 5000;

    this._container.innerHTML = `
      <div class="menu-box level-complete-box">
        <h2 class="menu-title text-success">LEVEL COMPLETE</h2>
        <p class="subtitle">LEVEL ${levelId} — ${levelName.toUpperCase()}</p>

        <div class="results-summary">
          <div class="result-row">
            <span class="result-label">TIME:</span>
            <span class="result-val">${timeStr} ${isNewBestTime ? '<span class="badge badge-gold">🔥 NEW BEST TIME!</span>' : ''}</span>
          </div>

          <div class="result-row">
            <span class="result-label">DEATHS:</span>
            <span class="result-val">${deaths} ${isNewBestDeaths ? '<span class="badge badge-gold">NEW BEST!</span>' : ''}</span>
          </div>

          <div class="result-row">
            <span class="result-label">COINS:</span>
            <span class="result-val">${coins} / ${totalCoins}</span>
          </div>

          <div class="result-row" id="leaderboard-submission-status">
            <span class="result-label">RANK:</span>
            <span class="result-val rank-status-val">Submitting score...</span>
          </div>
        </div>

        <div class="menu-actions">
          ${isLastLevel
            ? '<button id="btn-complete-victory" class="menu-btn primary-btn">VICTORY</button>'
            : '<button id="btn-complete-next" class="menu-btn primary-btn">NEXT LEVEL</button>'
          }
          <button id="btn-complete-replay" class="menu-btn">REPLAY</button>
          <button id="btn-complete-leaderboard" class="menu-btn">LEADERBOARD</button>
          <button id="btn-complete-share" class="menu-btn share-btn">SHARE SCORE 🔗</button>
          <button id="btn-complete-level-select" class="menu-btn">LEVEL SELECT</button>
          <button id="btn-complete-main-menu" class="menu-btn secondary-btn">MAIN MENU</button>
        </div>
      </div>
    `;

    monetizationService.mountAdPlacement('level_complete', this._container);
    this._bindEvents(levelId, timeSec, coins);

    // Asynchronous non-blocking leaderboard submission
    this._submitScoreAsync(levelId, timeMs, deaths, coins);
  }

  private async _submitScoreAsync(levelId: number, timeMs: number, deaths: number, coins: number): Promise<void> {
    const statusEl = this._container?.querySelector('#leaderboard-submission-status .rank-status-val');

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

  private _bindEvents(levelId: number, timeSec: number, coins: number): void {
    if (!this._container) return;

    const btnNext        = this._container.querySelector('#btn-complete-next');
    const btnVictory     = this._container.querySelector('#btn-complete-victory');
    const btnReplay      = this._container.querySelector('#btn-complete-replay');
    const btnLeaderboard = this._container.querySelector('#btn-complete-leaderboard');
    const btnShare       = this._container.querySelector('#btn-complete-share');
    const btnLevelSelect = this._container.querySelector('#btn-complete-level-select');
    const btnMainMenu    = this._container.querySelector('#btn-complete-main-menu');

    const game = (this._ctx.ui as any).gameInstance;

    btnNext?.addEventListener('click', async () => {
      if (game) {
        await leaderboardService.startRun(levelId + 1);
        game.loadLevelById(levelId + 1);
      }
    });

    btnVictory?.addEventListener('click', () => {
      this._ctx.stateMachine.transition('VICTORY');
      this._ctx.ui.show('victory');
    });

    btnReplay?.addEventListener('click', async () => {
      if (game) {
        await leaderboardService.startRun(levelId);
        game.restartLevel();
      }
    });

    btnLeaderboard?.addEventListener('click', () => {
      this._ctx.ui.show('leaderboard');
    });

    btnShare?.addEventListener('click', () => {
      this._shareScore(levelId, timeSec, coins);
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

  private _shareScore(levelId: number, timeSec: number, coins: number): void {
    analyticsService.track('share_clicked', { levelId, timeSec });
    const formatted = this._formatTime(timeSec);
    const text = `I just completed Trap Run Level ${levelId} in ${formatted} with ${coins} coins! Can you beat me? #TrapRun`;

    if (navigator.share) {
      navigator.share({
        title: 'Trap Run Score',
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
        alert('Score copied to clipboard!');
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
