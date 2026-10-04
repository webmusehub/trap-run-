// ─────────────────────────────────────────────────────────────────────────────
// MainMenu.ts — Main Menu UI component.
// Renders options: PLAY, LEVEL SELECT, SETTINGS, HOW TO PLAY.
// Dark, mysterious, pixel-art-inspired styling.
// Source of truth: ARCHITECTURE.md §59-61, TRD.md §65
// ─────────────────────────────────────────────────────────────────────────────

import type { GameContext } from '../game/GameContext.js';
import { playerProfileService } from '../services/PlayerProfileService.js';
import { leaderboardService } from '../services/LeaderboardService.js';
import { analyticsService } from '../services/AnalyticsService.js';
import { monetizationService } from '../services/MonetizationService.js';

export class MainMenu {
  private _container: HTMLElement | null = null;
  private _ctx: GameContext;
  private _focusedIndex = 0;
  private _buttons: HTMLButtonElement[] = [];

  constructor(context: GameContext) {
    this._ctx = context;
  }

  mount(): void {
    this._container = document.getElementById('ui-main-menu');
    if (!this._container) return;

    this.render();
  }

  render(): void {
    if (!this._container) return;

    // Check if player profile has a valid display name. If not, trigger name prompt modal first!
    if (!playerProfileService.hasValidName()) {
      setTimeout(() => {
        this._ctx.ui.show('name-prompt');
      }, 0);
    }

    const displayName = playerProfileService.getDisplayName();
    const sanitizedName = playerProfileService.sanitizeName(displayName) || 'Runner';

    this._container.innerHTML = `
      <div class="menu-box main-menu-box">
        <div class="player-profile-badge" id="player-profile-tag" title="Click to edit name in Settings">
          <span class="player-icon">🏃</span>
          <span class="player-name-text">${sanitizedName}</span>
        </div>

        <h1 class="game-title">TRAP RUN</h1>
        <p class="game-tagline">RUN. JUMP. TRUST NOTHING.</p>

        <div class="menu-actions">
          <button id="btn-play" class="menu-btn primary-btn">PLAY</button>
          <button id="btn-level-select" class="menu-btn">LEVEL SELECT</button>
          <button id="btn-leaderboard" class="menu-btn">LEADERBOARD</button>
          <button id="btn-settings" class="menu-btn">SETTINGS</button>
          <button id="btn-how-to-play" class="menu-btn secondary-btn">HOW TO PLAY</button>
        </div>

        <div id="how-to-play-modal" class="modal-dialog ui-hidden">
          <div class="modal-content">
            <h2>HOW TO PLAY</h2>
            <ul class="controls-list">
              <li><span class="key">A</span> / <span class="key">◄</span> : Move Left</li>
              <li><span class="key">D</span> / <span class="key">►</span> : Move Right</li>
              <li><span class="key">Space</span> / <span class="key">W</span> / <span class="key">▲</span> : Jump</li>
              <li><span class="key">Esc</span> : Pause Game</li>
              <li><span class="key">R</span> : Restart Attempt</li>
            </ul>
            <p class="tip-text">Watch out for hidden spikes, falling platforms & fake exits!</p>
            <button id="btn-close-help" class="menu-btn">CLOSE</button>
          </div>
        </div>
      </div>
    `;

    monetizationService.mountAdPlacement('main_menu', this._container);
    this._bindEvents();
  }

  private _bindEvents(): void {
    if (!this._container) return;

    const btnPlay = this._container.querySelector('#btn-play');
    const btnLevelSelect = this._container.querySelector('#btn-level-select');
    const btnLeaderboard = this._container.querySelector('#btn-leaderboard');
    const btnSettings = this._container.querySelector('#btn-settings');
    const btnHowToPlay = this._container.querySelector('#btn-how-to-play');
    const btnCloseHelp = this._container.querySelector('#btn-close-help');
    const modal = this._container.querySelector('#how-to-play-modal');
    const playerTag = this._container.querySelector('#player-profile-tag');

    playerTag?.addEventListener('click', () => {
      this._ctx.ui.show('settings');
    });

    btnPlay?.addEventListener('click', async () => {
      // Start at highest unlocked level or level 1
      const startLevel = this._ctx.saveSystem.getHighestUnlockedLevel();
      analyticsService.track('game_started', { level: startLevel });
      await leaderboardService.startRun(startLevel);

      this._ctx.eventBus.emit('LEVEL_STARTED', { levelId: startLevel });
      this._ctx.stateMachine.transition('LEVEL_SELECT');
      this._ctx.stateMachine.transition('LEVEL_LOADING');
      this._ctx.levelManager.loadLevel(startLevel).then(() => {
        (this._ctx.ui as any).gameInstance?.loadLevelById(startLevel);
      }).catch(() => {
        (this._ctx.ui as any).gameInstance?.loadLevelById(1);
      });
    });

    btnLevelSelect?.addEventListener('click', () => {
      this._ctx.stateMachine.transition('LEVEL_SELECT');
      this._ctx.ui.show('level-select');
    });

    btnLeaderboard?.addEventListener('click', () => {
      this._ctx.ui.show('leaderboard');
    });

    btnSettings?.addEventListener('click', () => {
      this._ctx.ui.show('settings');
    });

    btnHowToPlay?.addEventListener('click', () => {
      modal?.classList.remove('ui-hidden');
    });

    btnCloseHelp?.addEventListener('click', () => {
      modal?.classList.add('ui-hidden');
    });

    this._buttons = Array.from(this._container.querySelectorAll('.menu-actions .menu-btn'));
  }

  /** Keyboard navigation for menu */
  handleKeyDown(key: string): void {
    if (this._buttons.length === 0) return;

    if (key === 'ArrowDown' || key === 's' || key === 'S') {
      this._focusedIndex = (this._focusedIndex + 1) % this._buttons.length;
      this._buttons[this._focusedIndex].focus();
    } else if (key === 'ArrowUp' || key === 'w' || key === 'W') {
      this._focusedIndex = (this._focusedIndex - 1 + this._buttons.length) % this._buttons.length;
      this._buttons[this._focusedIndex].focus();
    }
  }
}
