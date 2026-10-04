// ─────────────────────────────────────────────────────────────────────────────
// defaults.ts — Default runtime values used when no saved data exists.
// Source of truth: TRD.md §72, ARCHITECTURE.md §68
// ─────────────────────────────────────────────────────────────────────────────

import type { SaveData, SaveSettings } from './types.js';

export const DEFAULT_SETTINGS: SaveSettings = {
  music: true,
  sfx: true,
  screenShake: true,
};

export const DEFAULT_SAVE_DATA: SaveData = {
  version: 1,
  unlockedLevels: [1],
  completedLevels: [],
  bestTimes: {},
  bestDeaths: {},
  coins: {},
  settings: { ...DEFAULT_SETTINGS },
};
