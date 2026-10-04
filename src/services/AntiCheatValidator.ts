// ─────────────────────────────────────────────────────────────────────────────
// AntiCheatValidator.ts — Gameplay Integrity & Run Validation Rules.
// Used client-side for pre-checks and edge functions for server verification.
// Source of truth: Master Release Candidate Prompt §12, §13, §14, §15, §16, §23
// ─────────────────────────────────────────────────────────────────────────────

export interface LevelLimits {
  levelId: number;
  maxCoins: number;
  minTimeMs: number;
}

export const LEVEL_LIMITS: Record<number, LevelLimits> = {
  1:  { levelId: 1,  maxCoins: 5,  minTimeMs: 3500 },
  2:  { levelId: 2,  maxCoins: 7,  minTimeMs: 4500 },
  3:  { levelId: 3,  maxCoins: 8,  minTimeMs: 5000 },
  4:  { levelId: 4,  maxCoins: 8,  minTimeMs: 5500 },
  5:  { levelId: 5,  maxCoins: 10, minTimeMs: 6000 },
  6:  { levelId: 6,  maxCoins: 10, minTimeMs: 6500 },
  7:  { levelId: 7,  maxCoins: 10, minTimeMs: 7000 },
  8:  { levelId: 8,  maxCoins: 12, minTimeMs: 7500 },
  9:  { levelId: 9,  maxCoins: 15, minTimeMs: 9000 },
  10: { levelId: 10, maxCoins: 15, minTimeMs: 11000 },
};

export interface RunValidationPayload {
  runId: string;
  playerId: string;
  level: number;
  timeMs: number;
  deaths: number;
  coins: number;
  startedAt?: number;
  completedAt?: number;
}

export class AntiCheatValidator {
  /** Validate a run completion payload against physics limits and rules. */
  public static validateRun(payload: RunValidationPayload): { valid: boolean; reason?: string } {
    const { runId, playerId, level, timeMs, deaths, coins, startedAt, completedAt } = payload;

    if (!runId || typeof runId !== 'string' || runId.trim().length === 0) {
      return { valid: false, reason: 'Invalid or missing runId.' };
    }

    if (!playerId || typeof playerId !== 'string' || playerId.trim().length === 0) {
      return { valid: false, reason: 'Invalid or missing playerId.' };
    }

    if (!Number.isInteger(level) || level < 1 || level > 10) {
      return { valid: false, reason: `Invalid level number: ${level}. Must be between 1 and 10.` };
    }

    const limits = LEVEL_LIMITS[level];
    if (!limits) {
      return { valid: false, reason: `Unknown level limits for level ${level}.` };
    }

    // Time validation
    if (typeof timeMs !== 'number' || !Number.isFinite(timeMs) || timeMs <= 0) {
      return { valid: false, reason: 'Completion time must be a positive finite number.' };
    }

    if (timeMs < limits.minTimeMs) {
      return {
        valid: false,
        reason: `Impossible completion time ${timeMs}ms for Level ${level} (minimum is ${limits.minTimeMs}ms).`,
      };
    }

    // Coin validation
    if (!Number.isInteger(coins) || coins < 0) {
      return { valid: false, reason: 'Coin count must be a non-negative integer.' };
    }

    if (coins > limits.maxCoins) {
      return {
        valid: false,
        reason: `Coin count ${coins} exceeds maximum of ${limits.maxCoins} for Level ${level}.`,
      };
    }

    // Death validation
    if (!Number.isInteger(deaths) || deaths < 0 || !Number.isFinite(deaths)) {
      return { valid: false, reason: 'Deaths count must be a non-negative integer.' };
    }

    if (deaths > 1000) {
      return { valid: false, reason: 'Deaths count exceeds maximum reasonable threshold (1000).' };
    }

    // Timestamp duration check if available
    if (startedAt && completedAt) {
      if (completedAt < startedAt) {
        return { valid: false, reason: 'Completion timestamp cannot precede start timestamp.' };
      }
      const wallClockDurationMs = completedAt - startedAt;
      // Allow a tiny buffer of 500ms for network latency / tick resolution
      if (wallClockDurationMs < limits.minTimeMs - 500) {
        return { valid: false, reason: 'Wall-clock elapsed time is below physical minimum.' };
      }
    }

    return { valid: true };
  }

  public static getMaxCoinsForLevel(level: number): number {
    return LEVEL_LIMITS[level]?.maxCoins ?? 15;
  }

  public static getMinTimeMsForLevel(level: number): number {
    return LEVEL_LIMITS[level]?.minTimeMs ?? 3500;
  }
}
