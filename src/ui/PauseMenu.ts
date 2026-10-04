// ─────────────────────────────────────────────────────────────────────────────
// PauseMenu.ts — Pause Menu UI component.
// Options: RESUME, RESTART, LEVEL SELECT, MAIN MENU.
// Toggled by Escape key during gameplay.
// Source of truth: GDD §15, ARCHITECTURE.md §59-61
// ─────────────────────────────────────────────────────────────────────────────

import type { GameContext } from '../game/GameContext.js';

export class PauseMenu {
  private _container: HTMLElement | null = null;
  private _ctx: GameContext;

  constructor(context: GameContext) {
    this._ctx = context;
  }

  mount(): void {
    this._container = document.getElementById('ui-pause');
    if (!this._container) return;

    this.render();
  }

  render(): void {
    if (!this._container) return;

    this._container.innerHTML = `
      <div class="menu-box pause-menu-box">
        <h2 class="menu-title">PAUSED</h2>

        <div class="menu-actions">
          <button id="btn-pause-resume" class="menu-btn primary-btn">RESUME</button>
          <button id="btn-pause-restart" class="menu-btn">RESTART</button>
          <button id="btn-pause-level-select" class="menu-btn">LEVEL SELECT</button>
          <button id="btn-pause-main-menu" class="menu-btn secondary-btn">MAIN MENU</button>
        </div>
      </div>
    `;

    this._bindEvents();
  }

  private _bindEvents(): void {
    if (!this._container) return;

    const btnResume      = this._container.querySelector('#btn-pause-resume');
    const btnRestart     = this._container.querySelector('#btn-pause-restart');
    const btnLevelSelect = this._container.querySelector('#btn-pause-level-select');
    const btnMainMenu    = this._container.querySelector('#btn-pause-main-menu');

    const game = (this._ctx.ui as any).gameInstance;

    btnResume?.addEventListener('click', () => {
      this._ctx.stateMachine.transition('PLAYING');
      this._ctx.ui.show('hud');
    });

    btnRestart?.addEventListener('click', () => {
      if (game) {
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
}
