// ─────────────────────────────────────────────────────────────────────────────
// productionlevels.test.ts — Unit tests validating all 10 production levels.
// Verifies: LevelValidator, entity counts, coin total, checkpoint layout, exits.
// Source of truth: LEVEL_DESIGN.md §18, §20, §21, TRD.md §43
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest';
import { LevelValidator } from '../src/levels/LevelValidator.js';
import { LevelManager }   from '../src/levels/LevelManager.js';
import level1  from '../src/levels/data/level1.js';
import level2  from '../src/levels/data/level2.js';
import level3  from '../src/levels/data/level3.js';
import level4  from '../src/levels/data/level4.js';
import level5  from '../src/levels/data/level5.js';
import level6  from '../src/levels/data/level6.js';
import level7  from '../src/levels/data/level7.js';
import level8  from '../src/levels/data/level8.js';
import level9  from '../src/levels/data/level9.js';
import level10 from '../src/levels/data/level10.js';

const levels = [
  level1, level2, level3, level4, level5,
  level6, level7, level8, level9, level10,
];

describe('Production Levels 1–10 Validation', () => {
  const validator = new LevelValidator();

  it('contains exactly 10 production levels', () => {
    expect(levels).toHaveLength(10);
  });

  it('every production level passes LevelValidator without errors', () => {
    for (const lvl of levels) {
      const result = validator.validate(lvl);
      expect(result.valid, `Level ${lvl.id} ("${lvl.name}") failed validation: ${result.errors.join(', ')}`).toBe(true);
      expect(result.errors).toHaveLength(0);
    }
  });

  it('level IDs are sequential from 1 to 10', () => {
    levels.forEach((lvl, idx) => {
      expect(lvl.id).toBe(idx + 1);
    });
  });

  it('total coin count across all 10 levels equals 100', () => {
    const totalCoins = levels.reduce((sum, lvl) => sum + lvl.coins.length, 0);
    expect(totalCoins).toBe(100);
  });

  it('matches specified coin counts per level', () => {
    const expectedCoinCounts = [5, 7, 8, 8, 10, 10, 10, 12, 15, 15];
    levels.forEach((lvl, idx) => {
      expect(lvl.coins.length, `Level ${lvl.id} coin count`).toBe(expectedCoinCounts[idx]);
    });
  });

  it('matches specified checkpoint counts per level', () => {
    const expectedCheckpointCounts = [0, 0, 1, 1, 1, 1, 1, 1, 3, 2];
    levels.forEach((lvl, idx) => {
      expect(lvl.checkpoints.length, `Level ${lvl.id} checkpoint count`).toBe(expectedCheckpointCounts[idx]);
    });
  });

  it('every level has spawn inside level bounds', () => {
    for (const lvl of levels) {
      expect(lvl.spawn.x, `Level ${lvl.id} spawn.x`).toBeGreaterThan(0);
      expect(lvl.spawn.x, `Level ${lvl.id} spawn.x`).toBeLessThan(lvl.width);
      expect(lvl.spawn.y, `Level ${lvl.id} spawn.y`).toBeGreaterThan(0);
      expect(lvl.spawn.y, `Level ${lvl.id} spawn.y`).toBeLessThan(lvl.height);
    }
  });

  it('every level has at least one real exit within level bounds', () => {
    for (const lvl of levels) {
      const realExits = lvl.exits.filter((e) => e.type === 'real');
      expect(realExits.length, `Level ${lvl.id} real exit count`).toBeGreaterThanOrEqual(1);

      for (const exit of realExits) {
        expect(exit.x).toBeGreaterThan(0);
        expect(exit.x).toBeLessThan(lvl.width);
        expect(exit.y).toBeGreaterThan(0);
        expect(exit.y).toBeLessThan(lvl.height);
      }
    }
  });

  it('fake exits exist in levels 5, 8, and 10 per design', () => {
    const fakeExitLevelIds = [5, 8, 10];
    for (const id of fakeExitLevelIds) {
      const lvl = levels.find((l) => l.id === id)!;
      const fakeExits = lvl.exits.filter((e) => e.type === 'fake');
      expect(fakeExits.length, `Level ${id} fake exits`).toBeGreaterThanOrEqual(1);
    }
  });

  it('all level managers can register and load levels 1 to 10', async () => {
    const manager = new LevelManager();
    expect(manager.registeredCount).toBe(11); // 0 (dev) + 1 to 10

    for (let id = 1; id <= 10; id++) {
      expect(manager.hasLevel(id)).toBe(true);
      const loaded = await manager.loadLevel(id);
      expect(loaded.data.id).toBe(id);
    }
  });
});
