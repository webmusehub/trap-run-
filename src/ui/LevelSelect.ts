// ─────────────────────────────────────────────────────────────────────────────
// LevelSelect.ts — Level Select UI component for Levels 1–10.
// Displays level progression, locked/unlocked state, best times, best deaths, coins.
// Source of truth: LEVEL_DESIGN.md, ARCHITECTURE.md §59-61
// ─────────────────────────────────────────────────────────────────────────────

import type { GameContext } from '../game/GameContext.js';

interface LevelMeta {
  id: number;
  name: string;
  totalCoins: number;
}

const LEVEL_METADATA: LevelMeta[] = [
  { id: 1,  name: 'First Steps',          totalCoins: 5 },
  { id: 2,  name: 'Spikes',               totalCoins: 7 },
  { id: 3,  name: 'Moving Platforms',     totalCoins: 8 },
  { id: 4,  name: 'Falling Platforms',    totalCoins: 8 },
  { id: 5,  name: 'Trust Nothing',        totalCoins: 10 },
  { id: 6,  name: 'Hidden Danger',        totalCoins: 10 },
  { id: 7,  name: 'Timing',               totalCoins: 10 },
  { id: 8,  name: 'Everything Is a Trap', totalCoins: 12 },
  { id: 9,  name: 'Checkpoint Run',       totalCoins: 15 },
  { id: 10, name: 'The Final Run',        totalCoins: 15 },
];

export class LevelSelect {
  private _container: HTMLElement | null = null;
  private _ctx: GameContext;

  constructor(context: GameContext) {
    this._ctx = context;
  }

  mount(): void {
    this._container = document.getElementById('ui-level-select');
    if (!this._container) return;

    this.render();
  }

  render(): void {
    if (!this._container) return;

    const saveSystem = this._ctx.saveSystem;

    const levelCardsHtml = LEVEL_METADATA.map((lvl) => {
      const isUnlocked = saveSystem.isLevelUnlocked(lvl.id);
      const isCompleted = saveSystem.isLevelCompleted(lvl.id);
      const bestTime = saveSystem.getBestTime(lvl.id);
      const bestDeaths = saveSystem.getBestDeaths(lvl.id);
      const coins = saveSystem.getCoinsCollected(lvl.id);

      const timeStr = bestTime !== null ? this._formatTime(bestTime) : '--:--.--';
      const deathsStr = bestDeaths !== null ? `${bestDeaths}` : '--';
      const coinsStr = isUnlocked ? `${coins}/${lvl.totalCoins}` : '--';

      return `
        <div class="level-card ${isUnlocked ? 'unlocked' : 'locked'} ${isCompleted ? 'completed' : ''}"
             data-level-id="${lvl.id}"
             tabindex="${isUnlocked ? 0 : -1}"
             role="button"
             aria-disabled="${!isUnlocked}">
          <div class="level-card-header">
            <span class="level-number">LEVEL ${lvl.id}</span>
            ${isCompleted ? '<span class="badge badge-complete">✓</span>' : ''}
            ${!isUnlocked ? '<span class="badge badge-lock">🔒</span>' : ''}
          </div>
          <h3 class="level-name">${lvl.name}</h3>

          <div class="level-stats">
            <div class="stat-row"><span class="stat-label">BEST:</span> <span class="stat-val">${timeStr}</span></div>
            <div class="stat-row"><span class="stat-label">DEATHS:</span> <span class="stat-val">${deathsStr}</span></div>
            <div class="stat-row"><span class="stat-label">COINS:</span> <span class="stat-val">${coinsStr}</span></div>
          </div>
        </div>
      `;
    }).join('');

    this._container.innerHTML = `
      <div class="menu-box level-select-box">
        <h2 class="menu-title">SELECT LEVEL</h2>

        <div class="level-grid">
          ${levelCardsHtml}
        </div>

        <div class="menu-actions">
          <button id="btn-level-select-back" class="menu-btn secondary-btn">BACK</button>
        </div>
      </div>
    `;

    this._bindEvents();
  }

  private _bindEvents(): void {
    if (!this._container) return;

    const cards = this._container.querySelectorAll('.level-card.unlocked');
    cards.forEach((card) => {
      card.addEventListener('click', () => {
        const idStr = card.getAttribute('data-level-id');
        if (idStr) {
          const levelId = parseInt(idStr, 10);
          this._loadLevel(levelId);
        }
      });

      card.addEventListener('keydown', (e: Event) => {
        const ke = e as KeyboardEvent;
        if (ke.key === 'Enter' || ke.key === ' ') {
          const idStr = card.getAttribute('data-level-id');
          if (idStr) {
            const levelId = parseInt(idStr, 10);
            this._loadLevel(levelId);
          }
        }
      });
    });

    const btnBack = this._container.querySelector('#btn-level-select-back');
    btnBack?.addEventListener('click', () => {
      this._ctx.stateMachine.transition('MAIN_MENU');
      this._ctx.ui.show('main-menu');
    });
  }

  private _loadLevel(levelId: number): void {
    if (!this._ctx.saveSystem.isLevelUnlocked(levelId)) return;

    const game = (this._ctx.ui as any).gameInstance;
    if (game) {
      game.loadLevelById(levelId);
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
