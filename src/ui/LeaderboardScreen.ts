// ─────────────────────────────────────────────────────────────────────────────
// LeaderboardScreen.ts — Online Leaderboard UI component.
// Renders global & per-level rankings, personal rank, and offline recovery.
// Source of truth: Master Release Candidate Prompt §17, §18, §21
// ─────────────────────────────────────────────────────────────────────────────

import type { GameContext } from '../game/GameContext.js';
import { leaderboardService } from '../services/LeaderboardService.js';
import { playerProfileService } from '../services/PlayerProfileService.js';

export class LeaderboardScreen {
  private _container: HTMLElement | null = null;
  private _ctx: GameContext;
  private _activeLevelFilter: number = 0; // 0 = GLOBAL, 1..10 = Level 1..10

  constructor(context: GameContext) {
    this._ctx = context;
  }

  mount(): void {
    let el = document.getElementById('ui-leaderboard');
    if (!el) {
      el = document.createElement('div');
      el.id = 'ui-leaderboard';
      el.className = 'ui-panel ui-hidden';
      el.setAttribute('role', 'dialog');
      el.setAttribute('aria-modal', 'true');
      document.getElementById('game-container')?.appendChild(el);
    }
    this._container = el;
    this.render();
  }

  render(): void {
    if (!this._container) return;

    this._container.innerHTML = `
      <div class="menu-box leaderboard-box">
        <h2 class="menu-title">GLOBAL LEADERBOARD</h2>
        <p class="subtitle">TOP RUNNERS — TRUST NOTHING</p>

        <!-- Level Filter Tabs -->
        <div class="leaderboard-tabs">
          <button class="tab-btn ${this._activeLevelFilter === 0 ? 'active' : ''}" data-level="0">GLOBAL</button>
          ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
            .map((lvl) => `<button class="tab-btn ${this._activeLevelFilter === lvl ? 'active' : ''}" data-level="${lvl}">L${lvl}</button>`)
            .join('')}
        </div>

        <!-- Leaderboard Table Container -->
        <div id="leaderboard-content" class="leaderboard-content">
          <div class="leaderboard-spinner">Loading rankings...</div>
        </div>

        <div class="menu-actions">
          <button id="btn-leaderboard-back" class="menu-btn secondary-btn">MAIN MENU</button>
        </div>
      </div>
    `;

    this._bindEvents();
    this._fetchAndDisplayData();
  }

  private _bindEvents(): void {
    if (!this._container) return;

    const btnBack = this._container.querySelector('#btn-leaderboard-back');
    btnBack?.addEventListener('click', () => {
      this._ctx.stateMachine.transition('MAIN_MENU');
      this._ctx.ui.show('main-menu');
    });

    const tabs = this._container.querySelectorAll('.tab-btn');
    tabs.forEach((tab) => {
      tab.addEventListener('click', (e) => {
        const lvl = parseInt((e.currentTarget as HTMLElement).getAttribute('data-level') || '0', 10);
        this._activeLevelFilter = lvl;
        tabs.forEach((t) => t.classList.remove('active'));
        (e.currentTarget as HTMLElement).classList.add('active');
        this._fetchAndDisplayData();
      });
    });
  }

  private async _fetchAndDisplayData(): Promise<void> {
    const contentEl = this._container?.querySelector('#leaderboard-content') as HTMLElement;
    if (!contentEl) return;

    contentEl.innerHTML = '<div class="leaderboard-spinner">Loading rankings...</div>';

    const response = await leaderboardService.getLeaderboard(this._activeLevelFilter);

    if (response.isOffline || response.errorMessage) {
      contentEl.innerHTML = `
        <div class="leaderboard-error-box">
          <p class="error-msg">${response.errorMessage || 'Leaderboard unavailable right now.'}</p>
          <button id="btn-leaderboard-retry" class="menu-btn primary-btn">RETRY</button>
        </div>
      `;
      contentEl.querySelector('#btn-leaderboard-retry')?.addEventListener('click', () => {
        this._fetchAndDisplayData();
      });
      return;
    }

    const currentPlayerId = playerProfileService.getPlayerId();
    const { topScores, playerRank } = response;

    let playerRankHtml = '';
    if (playerRank) {
      playerRankHtml = `
        <div class="your-rank-card">
          <div class="your-rank-title">YOUR RANK</div>
          <div class="your-rank-details">
            <span class="rank-badge">#${playerRank.rank}</span>
            <span class="rank-name">${playerProfileService.sanitizeName(playerRank.displayName)}</span>
            <span class="rank-time">${this._formatTime(playerRank.timeMs / 1000)}</span>
            <span class="rank-stats">💀 ${playerRank.deaths} | 🪙 ${playerRank.coins}</span>
          </div>
        </div>
      `;
    }

    if (!topScores || topScores.length === 0) {
      contentEl.innerHTML = `
        ${playerRankHtml}
        <div class="leaderboard-empty">No scores logged yet for this level. Be the first!</div>
      `;
      return;
    }

    const tableRows = topScores
      .map((entry) => {
        const isCurrent = entry.playerId === currentPlayerId;
        const timeStr = this._formatTime(entry.timeMs / 1000);
        const nameSanitized = playerProfileService.sanitizeName(entry.displayName);
        return `
          <tr class="${isCurrent ? 'highlight-player' : ''}">
            <td class="col-rank">#${entry.rank}</td>
            <td class="col-player">${nameSanitized}${isCurrent ? ' <span class="you-tag">(YOU)</span>' : ''}</td>
            <td class="col-time">${timeStr}</td>
            <td class="col-deaths">${entry.deaths}</td>
            <td class="col-coins">${entry.coins}</td>
          </tr>
        `;
      })
      .join('');

    contentEl.innerHTML = `
      ${playerRankHtml}
      <div class="table-responsive">
        <table class="leaderboard-table">
          <thead>
            <tr>
              <th class="col-rank">RANK</th>
              <th class="col-player">PLAYER</th>
              <th class="col-time">TIME</th>
              <th class="col-deaths">DEATHS</th>
              <th class="col-coins">COINS</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>
    `;
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

  show(): void {
    this.render();
    this._container?.classList.remove('ui-hidden');
  }

  hide(): void {
    this._container?.classList.add('ui-hidden');
  }
}
