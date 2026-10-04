// ─────────────────────────────────────────────────────────────────────────────
// levelvalidator.test.ts — Unit tests for LevelValidator.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest';
import { LevelValidator } from '../src/levels/LevelValidator.js';
import type { LevelData } from '../src/data/types.js';

function makeValidLevel(): LevelData {
  return {
    id: 1,
    name: 'Test Level',
    width: 3000,
    height: 720,
    spawn: { x: 100, y: 500 },
    platforms: [
      { id: 'p1', x: 0, y: 620, width: 600, height: 20 },
    ],
    hazards: [],
    coins: [],
    checkpoints: [],
    exits: [
      { id: 'exit-real', x: 2800, y: 540, width: 60, height: 80, type: 'real' },
    ],
  };
}

describe('LevelValidator', () => {
  const validator = new LevelValidator();

  it('accepts a valid level', () => {
    const result = validator.validate(makeValidLevel());
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects null', () => {
    const result = validator.validate(null);
    expect(result.valid).toBe(false);
  });

  it('rejects missing id', () => {
    const level = makeValidLevel();
    // @ts-expect-error intentional
    delete level.id;
    const result = validator.validate(level);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('id'))).toBe(true);
  });

  it('rejects missing spawn', () => {
    const level = makeValidLevel();
    // @ts-expect-error intentional
    delete level.spawn;
    const result = validator.validate(level);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('spawn'))).toBe(true);
  });

  it('rejects missing real exit', () => {
    const level = makeValidLevel();
    level.exits = [];
    const result = validator.validate(level);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('real exit'))).toBe(true);
  });

  it('rejects duplicate entity ids', () => {
    const level = makeValidLevel();
    level.coins = [
      { id: 'dup', x: 100, y: 100 },
      { id: 'dup', x: 200, y: 100 },
    ];
    const result = validator.validate(level);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Duplicate'))).toBe(true);
  });

  it('rejects platform with zero width', () => {
    const level = makeValidLevel();
    level.platforms[0].width = 0;
    const result = validator.validate(level);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('invalid dimensions'))).toBe(true);
  });

  it('rejects invalid width', () => {
    const level = makeValidLevel();
    // @ts-expect-error intentional
    level.width = -100;
    const result = validator.validate(level);
    expect(result.valid).toBe(false);
  });

  it('accepts level with fake exit alongside real exit', () => {
    const level = makeValidLevel();
    level.exits.push({ id: 'exit-fake', x: 1000, y: 540, width: 60, height: 80, type: 'fake' });
    const result = validator.validate(level);
    expect(result.valid).toBe(true);
  });
});
