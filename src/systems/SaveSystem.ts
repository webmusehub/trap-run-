// ─────────────────────────────────────────────────────────────────────────────
// SaveSystem.ts — Persistence & Progression System.
// Owns loading, saving, level unlocks, best records, coins, and settings.
// Does NOT touch localStorage directly — uses StorageAdapter abstraction.
// Source of truth: ARCHITECTURE.md §65-70, TRD.md §71
// ─────────────────────────────────────────────────────────────────────────────

import { LocalStorageAdapter, type StorageAdapter } from '../utils/storage.js';

export interface GameSettings {
  music: boolean;
  sfx: boolean;
  screenShake: boolean;
}

export interface SaveData {
  version: number;
  unlockedLevels: number[];
  completedLevels: number[];
  bestTimes: Record<number, number>;      // levelId -> best time in seconds
  bestDeaths: Record<number, number>;     // levelId -> min deaths
  coinsCollected: Record<number, number>; // levelId -> max coins collected
  settings: GameSettings;
}

const SAVE_STORAGE_KEY = 'trap_run_save_v1';

const DEFAULT_SAVE_DATA: SaveData = {
  version: 1,
  unlockedLevels: [1],
  completedLevels: [],
  bestTimes: {},
  bestDeaths: {},
  coinsCollected: {},
  settings: {
    music: true,
    sfx: true,
    screenShake: true,
  },
};

export class SaveSystem {
  private _adapter: StorageAdapter;
  private _data: SaveData;

  constructor(adapter?: StorageAdapter) {
    this._adapter = adapter || new LocalStorageAdapter();
    this._data = this.load();
  }

  /** Load save data from storage, fallback to defaults if invalid or missing. */
  load(): SaveData {
    const raw = this._adapter.get(SAVE_STORAGE_KEY);
    if (!raw || typeof raw !== 'string') {
      return this._cloneDefault();
    }
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) || parsed.version !== 1) {
        return this._cloneDefault();
      }

      // Validate unlocked levels array
      let unlockedLevels = [1];
      if (Array.isArray(parsed.unlockedLevels)) {
        const validUnlocked = parsed.unlockedLevels
          .filter((lvl: any) => typeof lvl === 'number' && Number.isInteger(lvl) && lvl >= 1 && lvl <= 10);
        if (validUnlocked.length > 0) {
          unlockedLevels = Array.from(new Set([1, ...validUnlocked]));
        }
      }

      // Validate completed levels array
      let completedLevels: number[] = [];
      if (Array.isArray(parsed.completedLevels)) {
        completedLevels = Array.from(new Set(
          parsed.completedLevels.filter((lvl: any) => typeof lvl === 'number' && Number.isInteger(lvl) && lvl >= 1 && lvl <= 10)
        ));
      }

      // Validate map records
      const sanitizeNumberMap = (rawMap: any): Record<number, number> => {
        const clean: Record<number, number> = {};
        if (rawMap && typeof rawMap === 'object' && !Array.isArray(rawMap)) {
          for (const key of Object.keys(rawMap)) {
            const numKey = Number(key);
            const val = rawMap[key];
            if (Number.isInteger(numKey) && numKey >= 1 && numKey <= 10 && typeof val === 'number' && Number.isFinite(val) && val >= 0) {
              clean[numKey] = val;
            }
          }
        }
        return clean;
      };

      const settings: GameSettings = {
        music: typeof parsed.settings?.music === 'boolean' ? parsed.settings.music : true,
        sfx: typeof parsed.settings?.sfx === 'boolean' ? parsed.settings.sfx : true,
        screenShake: typeof parsed.settings?.screenShake === 'boolean' ? parsed.settings.screenShake : true,
      };

      return {
        version: 1,
        unlockedLevels,
        completedLevels,
        bestTimes: sanitizeNumberMap(parsed.bestTimes),
        bestDeaths: sanitizeNumberMap(parsed.bestDeaths),
        coinsCollected: sanitizeNumberMap(parsed.coinsCollected),
        settings,
      };
    } catch (err) {
      console.warn('[SaveSystem] Failed to parse save data, reverting to defaults:', err);
      return this._cloneDefault();
    }
  }

  /** Save current state to storage adapter. */
  save(): void {
    try {
      this._adapter.set(SAVE_STORAGE_KEY, JSON.stringify(this._data));
    } catch (err) {
      console.warn('[SaveSystem] Save write failed:', err);
    }
  }

  getData(): SaveData {
    return this._data;
  }

  isLevelUnlocked(levelId: number): boolean {
    return this._data.unlockedLevels.includes(levelId);
  }

  isLevelCompleted(levelId: number): boolean {
    return this._data.completedLevels.includes(levelId);
  }

  getBestTime(levelId: number): number | null {
    return this._data.bestTimes[levelId] ?? null;
  }

  getBestDeaths(levelId: number): number | null {
    return this._data.bestDeaths[levelId] ?? null;
  }

  getCoinsCollected(levelId: number): number {
    return this._data.coinsCollected[levelId] ?? 0;
  }

  getTotalCoinsCollected(): number {
    return Object.values(this._data.coinsCollected).reduce((sum, count) => sum + count, 0);
  }

  getHighestUnlockedLevel(): number {
    return Math.max(...this._data.unlockedLevels, 1);
  }

  /**
   * Record level completion.
   * Unlocks level N+1 (if levelId < 10).
   * Updates best time if better, best deaths if lower, coins if higher.
   * Returns badges for new best time / new best deaths.
   */
  recordLevelCompletion(
    levelId: number,
    time: number,
    deaths: number,
    coins: number,
  ): { isNewBestTime: boolean; isNewBestDeaths: boolean } {
    let isNewBestTime = false;
    let isNewBestDeaths = false;

    if (!this._data.completedLevels.includes(levelId)) {
      this._data.completedLevels.push(levelId);
    }

    // Unlock next level up to level 10
    const nextLevel = levelId + 1;
    if (nextLevel <= 10 && !this._data.unlockedLevels.includes(nextLevel)) {
      this._data.unlockedLevels.push(nextLevel);
    }

    // Best Time (lower is better)
    const prevTime = this._data.bestTimes[levelId];
    if (prevTime === undefined || time < prevTime) {
      this._data.bestTimes[levelId] = time;
      isNewBestTime = true;
    }

    // Best Deaths (lower is better)
    const prevDeaths = this._data.bestDeaths[levelId];
    if (prevDeaths === undefined || deaths < prevDeaths) {
      this._data.bestDeaths[levelId] = deaths;
      isNewBestDeaths = true;
    }

    // Coins (higher is better)
    const prevCoins = this._data.coinsCollected[levelId];
    if (prevCoins === undefined || coins > prevCoins) {
      this._data.coinsCollected[levelId] = coins;
    }

    this.save();

    return { isNewBestTime, isNewBestDeaths };
  }

  updateSettings(partial: Partial<GameSettings>): void {
    this._data.settings = {
      ...this._data.settings,
      ...partial,
    };
    this.save();
  }

  getSettings(): GameSettings {
    return { ...this._data.settings };
  }

  /** Reset all persistent progress to defaults (for testing or user wipe). */
  resetProgress(): void {
    this._data = this._cloneDefault();
    this.save();
  }

  private _cloneDefault(): SaveData {
    return JSON.parse(JSON.stringify(DEFAULT_SAVE_DATA));
  }
}
