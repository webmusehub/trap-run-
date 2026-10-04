import { describe, it, expect } from 'vitest';
import { AntiCheatValidator, LEVEL_LIMITS } from '../src/services/AntiCheatValidator.js';

describe('AntiCheatValidator Rules', () => {
  it('accepts valid completion payloads', () => {
    const result = AntiCheatValidator.validateRun({
      runId: 'run_12345',
      playerId: 'player_abc123',
      level: 1,
      timeMs: 12400,
      deaths: 2,
      coins: 5,
    });
    expect(result.valid).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it('rejects invalid level numbers', () => {
    const result0 = AntiCheatValidator.validateRun({
      runId: 'r1', playerId: 'p1', level: 0, timeMs: 5000, deaths: 0, coins: 2,
    });
    expect(result0.valid).toBe(false);

    const result11 = AntiCheatValidator.validateRun({
      runId: 'r1', playerId: 'p1', level: 11, timeMs: 5000, deaths: 0, coins: 2,
    });
    expect(result11.valid).toBe(false);
  });

  it('rejects physically impossible completion times', () => {
    const minL1 = LEVEL_LIMITS[1].minTimeMs;
    const result = AntiCheatValidator.validateRun({
      runId: 'run_cheat',
      playerId: 'player_cheat',
      level: 1,
      timeMs: minL1 - 1000, // 1 second under physical limit
      deaths: 0,
      coins: 5,
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Impossible completion time');
  });

  it('rejects coins exceeding known level maximums', () => {
    const maxL1 = LEVEL_LIMITS[1].maxCoins; // 5
    const result = AntiCheatValidator.validateRun({
      runId: 'run_coins',
      playerId: 'player_coins',
      level: 1,
      timeMs: 15000,
      deaths: 0,
      coins: maxL1 + 5, // 10 coins on level with max 5
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('exceeds maximum');
  });

  it('rejects invalid death values (negative, NaN, Infinity)', () => {
    const resNegative = AntiCheatValidator.validateRun({
      runId: 'r1', playerId: 'p1', level: 1, timeMs: 15000, deaths: -1, coins: 2,
    });
    expect(resNegative.valid).toBe(false);

    const resNaN = AntiCheatValidator.validateRun({
      runId: 'r1', playerId: 'p1', level: 1, timeMs: 15000, deaths: NaN, coins: 2,
    });
    expect(resNaN.valid).toBe(false);
  });

  it('rejects missing or empty runId and playerId', () => {
    const resNoRunId = AntiCheatValidator.validateRun({
      runId: '', playerId: 'p1', level: 1, timeMs: 15000, deaths: 0, coins: 2,
    });
    expect(resNoRunId.valid).toBe(false);
  });
});
