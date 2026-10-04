// ─────────────────────────────────────────────────────────────────────────────
// NamePromptModal.ts — First-time player name entry UI modal.
// Prompts first-time players for their display name before entering Main Menu.
// Source of truth: Master Release Candidate Prompt §6
// ─────────────────────────────────────────────────────────────────────────────

import type { GameContext } from '../game/GameContext.js';
import { playerProfileService } from '../services/PlayerProfileService.js';
import { analyticsService } from '../services/AnalyticsService.js';

export class NamePromptModal {
  private _container: HTMLElement | null = null;
  private _ctx: GameContext;
  private _onSuccessCallback: (() => void) | null = null;

  constructor(context: GameContext) {
    this._ctx = context;
  }

  mount(): void {
    let el = document.getElementById('ui-name-prompt');
    if (!el) {
      el = document.createElement('div');
      el.id = 'ui-name-prompt';
      el.className = 'ui-panel ui-hidden';
      el.setAttribute('role', 'dialog');
      el.setAttribute('aria-modal', 'true');
      document.getElementById('game-container')?.appendChild(el);
    }
    this._container = el;
    this.render();
  }

  render(onSuccess?: () => void): void {
    if (onSuccess) this._onSuccessCallback = onSuccess;
    if (!this._container) return;

    const currentName = playerProfileService.getDisplayName();

    this._container.innerHTML = `
      <div class="menu-box name-prompt-box">
        <h1 class="game-title">TRAP RUN</h1>
        <p class="game-tagline">RUN. JUMP. TRUST NOTHING.</p>

        <div class="name-prompt-form">
          <h2 class="name-prompt-title">WHAT'S YOUR NAME?</h2>
          <p class="name-prompt-sub">Enter a display name for the global leaderboard.</p>

          <div class="input-group">
            <input
              type="text"
              id="player-name-input"
              class="name-input"
              placeholder="Your runner name..."
              maxlength="16"
              value="${playerProfileService.unescapeName(currentName)}"
              autocomplete="off"
              spellcheck="false"
            />
            <div id="name-input-error" class="input-error-msg"></div>
          </div>

          <div class="menu-actions">
            <button id="btn-name-continue" class="menu-btn primary-btn">CONTINUE</button>
          </div>
        </div>
      </div>
    `;

    this._bindEvents();
  }

  private _bindEvents(): void {
    if (!this._container) return;

    const input = this._container.querySelector('#player-name-input') as HTMLInputElement;
    const btnContinue = this._container.querySelector('#btn-name-continue') as HTMLButtonElement;
    const errorEl = this._container.querySelector('#name-input-error') as HTMLElement;

    const submitName = () => {
      if (!input) return;
      const rawValue = input.value;
      const result = playerProfileService.setDisplayName(rawValue);

      if (!result.success) {
        if (errorEl) {
          errorEl.textContent = result.error || 'Invalid name.';
          errorEl.style.display = 'block';
        }
        input.classList.add('input-invalid');
        return;
      }

      if (errorEl) errorEl.style.display = 'none';
      input.classList.remove('input-invalid');

      analyticsService.track('name_created', { nameLength: rawValue.trim().length });

      this.hide();

      if (this._onSuccessCallback) {
        this._onSuccessCallback();
      } else {
        this._ctx.ui.show('main-menu');
      }
    };

    btnContinue?.addEventListener('click', submitName);

    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        submitName();
      }
      if (errorEl) errorEl.style.display = 'none';
      input.classList.remove('input-invalid');
    });
  }

  show(onSuccess?: () => void): void {
    this.render(onSuccess);
    this._container?.classList.remove('ui-hidden');
    const input = this._container?.querySelector('#player-name-input') as HTMLInputElement;
    if (input) {
      setTimeout(() => input.focus(), 100);
    }
  }

  hide(): void {
    this._container?.classList.add('ui-hidden');
  }
}
