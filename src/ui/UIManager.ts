// ─────────────────────────────────────────────────────────────────────────────
// UIManager.ts — Controls which HTML/CSS UI screen is visible.
// Instantiates, mounts, and updates UI screen components.
// Source of truth: ARCHITECTURE.md §59-61, TRD.md §65
// ─────────────────────────────────────────────────────────────────────────────

import type { GameContext } from '../game/GameContext.js';
import { MainMenu }          from './MainMenu.js';
import { LevelSelect }       from './LevelSelect.js';
import { HUD }               from './HUD.js';
import { PauseMenu }         from './PauseMenu.js';
import { GameOver }          from './GameOver.js';
import { LevelComplete }     from './LevelComplete.js';
import { VictoryScreen }     from './VictoryScreen.js';
import { Settings }          from './Settings.js';
import { NamePromptModal }   from './NamePromptModal.js';
import { LeaderboardScreen } from './LeaderboardScreen.js';

export type UIScreen =
  | 'none'
  | 'main-menu'
  | 'level-select'
  | 'hud'
  | 'pause'
  | 'game-over'
  | 'level-complete'
  | 'victory'
  | 'settings'
  | 'loading'
  | 'name-prompt'
  | 'leaderboard';

export class UIManager {
  private _activeScreen: UIScreen = 'none';

  // Screen components
  public mainMenu:          MainMenu          | null = null;
  public levelSelect:       LevelSelect       | null = null;
  public hud:               HUD               | null = null;
  public pauseMenu:         PauseMenu         | null = null;
  public gameOver:          GameOver          | null = null;
  public levelComplete:     LevelComplete     | null = null;
  public victoryScreen:     VictoryScreen     | null = null;
  public settings:          Settings          | null = null;
  public namePromptModal:   NamePromptModal   | null = null;
  public leaderboardScreen: LeaderboardScreen | null = null;

  public gameInstance: any = null;

  initialize(context: GameContext, gameInstance: any): void {
    this.gameInstance = gameInstance;

    this.mainMenu          = new MainMenu(context);
    this.levelSelect       = new LevelSelect(context);
    this.hud               = new HUD(context);
    this.pauseMenu         = new PauseMenu(context);
    this.gameOver          = new GameOver(context);
    this.levelComplete     = new LevelComplete(context);
    this.victoryScreen     = new VictoryScreen(context);
    this.settings          = new Settings(context);
    this.namePromptModal   = new NamePromptModal(context);
    this.leaderboardScreen = new LeaderboardScreen(context);

    this.mainMenu.mount();
    this.levelSelect.mount();
    this.hud.mount();
    this.pauseMenu.mount();
    this.gameOver.mount();
    this.levelComplete.mount();
    this.victoryScreen.mount();
    this.settings.mount();
    this.namePromptModal.mount();
    this.leaderboardScreen.mount();
  }

  /** Show a named UI screen, hiding the previous one. */
  show(screen: UIScreen): void {
    if (this._activeScreen === screen) return;
    this._hide(this._activeScreen);
    this._activeScreen = screen;
    this._reveal(screen);

    // Refresh dynamic data on show
    if (screen === 'level-select') {
      this.levelSelect?.render();
    } else if (screen === 'settings') {
      this.settings?.render();
    } else if (screen === 'main-menu') {
      this.mainMenu?.render();
    } else if (screen === 'leaderboard') {
      this.leaderboardScreen?.render();
    } else if (screen === 'name-prompt') {
      this.namePromptModal?.show();
    }
  }

  hide(): void {
    this._hide(this._activeScreen);
    this._activeScreen = 'none';
  }

  getActive(): UIScreen {
    return this._activeScreen;
  }

  private _reveal(screen: UIScreen): void {
    if (screen === 'none') return;
    const el = document.getElementById(`ui-${screen}`);
    if (el) el.classList.remove('ui-hidden');
  }

  private _hide(screen: UIScreen): void {
    if (screen === 'none') return;
    const el = document.getElementById(`ui-${screen}`);
    if (el) el.classList.add('ui-hidden');
  }

  /**
   * Update the development overlay text fields.
   */
  updateDevOverlay(fps: number, state: string): void {
    const fpsEl   = document.getElementById('dev-fps');
    const stateEl = document.getElementById('dev-state');
    if (fpsEl)   fpsEl.textContent   = `FPS: ${fps}`;
    if (stateEl) stateEl.textContent = `State: ${state}`;
  }

  /** Route keyboard navigation to current screen if supported */
  handleKeyDown(key: string): void {
    if (this._activeScreen === 'main-menu') {
      this.mainMenu?.handleKeyDown(key);
    }
  }
}
