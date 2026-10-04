// ─────────────────────────────────────────────────────────────────────────────
// LevelManager.ts — Manages the level lifecycle.
// Owns: load, unload, restart, complete, advance.
// Does NOT contain physics, collision, or player logic.
// Source of truth: ARCHITECTURE.md §49, TRD.md §44-45
// ─────────────────────────────────────────────────────────────────────────────

import type { LevelData } from '../data/types.js';
import { LevelLoader, type LoadedLevel } from './LevelLoader.js';
import { TOTAL_LEVELS } from '../data/constants.js';

type LevelFactory = () => Promise<{ default: LevelData }>;

export class LevelManager {
  private readonly _loader   = new LevelLoader();
  private _registry          = new Map<number, LevelFactory>();
  private _currentLevel: LoadedLevel | null = null;
  private _currentLevelId    = 0;

  constructor() {
    this.registerDefaultLevels();
  }

  /** Register default production levels (1–10) and devLevel (0). */
  registerDefaultLevels(): void {
    this.register(0,  () => import('./data/devLevel.js'));
    this.register(1,  () => import('./data/level1.js'));
    this.register(2,  () => import('./data/level2.js'));
    this.register(3,  () => import('./data/level3.js'));
    this.register(4,  () => import('./data/level4.js'));
    this.register(5,  () => import('./data/level5.js'));
    this.register(6,  () => import('./data/level6.js'));
    this.register(7,  () => import('./data/level7.js'));
    this.register(8,  () => import('./data/level8.js'));
    this.register(9,  () => import('./data/level9.js'));
    this.register(10, () => import('./data/level10.js'));
  }

  /** Register a level data factory for a given level id (0–10). */
  register(id: number, factory: LevelFactory): void {
    this._registry.set(id, factory);
  }

  /** Asynchronously load a level by id. */
  async loadLevel(id: number): Promise<LoadedLevel> {
    const factory = this._registry.get(id);
    if (!factory) {
      throw new Error(`[LevelManager] No level registered for id: ${id}`);
    }
    const module = await factory();
    this._currentLevel   = this._loader.load(module.default);
    this._currentLevelId = id;
    console.log(`[LevelManager] Level ${id} "${this._currentLevel.data.name}" loaded.`);
    return this._currentLevel;
  }

  /** Unload the current level (clears runtime state). */
  unload(): void {
    this._currentLevel   = null;
    this._currentLevelId = 0;
  }

  /** Reload the current level (used by restart). */
  async restartLevel(): Promise<LoadedLevel> {
    if (this._currentLevelId === 0 && !this._registry.has(0)) {
      throw new Error('[LevelManager] No current level to restart.');
    }
    return await this.loadLevel(this._currentLevelId);
  }

  /** Load the next level after the current one. */
  async loadNextLevel(): Promise<LoadedLevel> {
    const next = this._currentLevelId + 1;
    if (next > TOTAL_LEVELS) {
      throw new Error('[LevelManager] No next level — all levels complete.');
    }
    return await this.loadLevel(next);
  }

  getCurrentLevel(): LoadedLevel | null {
    return this._currentLevel;
  }

  getCurrentLevelId(): number {
    return this._currentLevelId;
  }

  getCurrentLevelData(): LevelData | null {
    return this._currentLevel?.data ?? null;
  }

  isLastLevel(): boolean {
    return this._currentLevelId >= TOTAL_LEVELS;
  }

  hasLevel(id: number): boolean {
    return this._registry.has(id);
  }

  get registeredCount(): number {
    return this._registry.size;
  }
}
