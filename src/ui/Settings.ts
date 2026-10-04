// ─────────────────────────────────────────────────────────────────────────────
// Settings.ts — Settings UI component.
// Controls Music, SFX, and Screen Shake preferences.
// Integrates with SaveSystem for instant persistence.
// Source of truth: ARCHITECTURE.md §68, TRD.md §(Settings)
// ─────────────────────────────────────────────────────────────────────────────

import type { GameContext } from '../game/GameContext.js';
import { playerProfileService } from '../services/PlayerProfileService.js';

export class Settings {
  private _container: HTMLElement | null = null;
  private _ctx: GameContext;
  private _previousScreen: 'main-menu' | 'pause' = 'main-menu';

  constructor(context: GameContext) {
    this._ctx = context;
  }

  setPreviousScreen(screen: 'main-menu' | 'pause'): void {
    this._previousScreen = screen;
  }

  mount(): void {
    this._container = document.getElementById('ui-settings');
    if (!this._container) return;

    this.render();
  }

  render(): void {
    if (!this._container) return;

    const settings = this._ctx.saveSystem.getSettings();
    const displayName = playerProfileService.getDisplayName();
    const sanitizedName = playerProfileService.sanitizeName(displayName) || 'Not set';

    this._container.innerHTML = `
      <div class="menu-box settings-box">
        <h2 class="menu-title">SETTINGS</h2>

        <div class="settings-list">
          <div class="setting-row">
            <span class="setting-label">RUNNER NAME</span>
            <div class="setting-name-group">
              <span class="setting-name-val">${sanitizedName}</span>
              <button id="btn-change-name" class="menu-btn sm-btn">CHANGE</button>
            </div>
          </div>

          <div class="setting-row">
            <span class="setting-label">MUSIC</span>
            <button id="toggle-music" class="setting-toggle ${settings.music ? 'active' : ''}">
              ${settings.music ? 'ON' : 'OFF'}
            </button>
          </div>

          <div class="setting-row">
            <span class="setting-label">SFX</span>
            <button id="toggle-sfx" class="setting-toggle ${settings.sfx ? 'active' : ''}">
              ${settings.sfx ? 'ON' : 'OFF'}
            </button>
          </div>

          <div class="setting-row">
            <span class="setting-label">SCREEN SHAKE</span>
            <button id="toggle-screenshake" class="setting-toggle ${settings.screenShake ? 'active' : ''}">
              ${settings.screenShake ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        <div class="menu-actions">
          <button id="btn-settings-back" class="menu-btn secondary-btn">BACK</button>
        </div>
      </div>
    `;

    this._bindEvents();
  }

  private _bindEvents(): void {
    if (!this._container) return;

    const btnChangeName    = this._container.querySelector('#btn-change-name');
    const toggleMusic      = this._container.querySelector('#toggle-music') as HTMLButtonElement;
    const toggleSfx        = this._container.querySelector('#toggle-sfx') as HTMLButtonElement;
    const toggleScreenShake = this._container.querySelector('#toggle-screenshake') as HTMLButtonElement;
    const btnBack          = this._container.querySelector('#btn-settings-back');

    btnChangeName?.addEventListener('click', () => {
      this._ctx.ui.show('name-prompt');
    });

    toggleMusic?.addEventListener('click', () => {
      const current = this._ctx.saveSystem.getSettings().music;
      this._ctx.saveSystem.updateSettings({ music: !current });
      this.render();
    });

    toggleSfx?.addEventListener('click', () => {
      const current = this._ctx.saveSystem.getSettings().sfx;
      this._ctx.saveSystem.updateSettings({ sfx: !current });
      this.render();
    });

    toggleScreenShake?.addEventListener('click', () => {
      const current = this._ctx.saveSystem.getSettings().screenShake;
      this._ctx.saveSystem.updateSettings({ screenShake: !current });
      this.render();
    });

    btnBack?.addEventListener('click', () => {
      if (this._previousScreen === 'pause') {
        this._ctx.ui.show('pause');
      } else {
        if (this._ctx.stateMachine.canTransition('MAIN_MENU')) {
          this._ctx.stateMachine.transition('MAIN_MENU');
        }
        this._ctx.ui.show('main-menu');
      }
    });
  }
}
