// ─────────────────────────────────────────────────────────────────────────────
// devlevel.test.ts — Dev level data validates and player spawn is correct.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest';
import { LevelValidator } from '../src/levels/LevelValidator.js';
import devLevel from '../src/levels/data/devLevel.js';

describe('Dev level data', () => {
  const validator = new LevelValidator();

  it('passes validation', () => {
    const result = validator.validate(devLevel);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('has a valid spawn position', () => {
    expect(typeof devLevel.spawn.x).toBe('number');
    expect(typeof devLevel.spawn.y).toBe('number');
    expect(devLevel.spawn.x).toBeGreaterThan(0);
    expect(devLevel.spawn.y).toBeGreaterThan(0);
  });

  it('spawn is within level bounds', () => {
    expect(devLevel.spawn.x).toBeLessThan(devLevel.width);
    expect(devLevel.spawn.y).toBeLessThan(devLevel.height);
  });

  it('has at least one real exit', () => {
    const real = devLevel.exits.filter((e) => e.type === 'real');
    expect(real.length).toBeGreaterThan(0);
  });

  it('has multiple platforms', () => {
    expect(devLevel.platforms.length).toBeGreaterThan(3);
  });

  it('all platform ids are unique', () => {
    const ids = devLevel.platforms.map((p) => p.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('all platforms have positive dimensions', () => {
    for (const p of devLevel.platforms) {
      expect(p.width).toBeGreaterThan(0);
      expect(p.height).toBeGreaterThan(0);
    }
  });

  it('level has positive width and height', () => {
    expect(devLevel.width).toBeGreaterThan(0);
    expect(devLevel.height).toBeGreaterThan(0);
  });
});
