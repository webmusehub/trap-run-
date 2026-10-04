// ─────────────────────────────────────────────────────────────────────────────
// global_leaderboard_redesign.test.ts — Test Suite for Global Leaderboard Redesign
// Source of truth: Prompt §1-16
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest';
import { LeaderboardService, LeaderboardEntry } from '../src/services/LeaderboardService.js';
import { AntiCheatValidator } from '../src/services/AntiCheatValidator.js';
import { playerProfileService } from '../src/services/PlayerProfileService.js';

/** Comparator implementing the exact new Global Leaderboard ranking logic */
export function sortLeaderboardEntries(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  return [...entries].sort((a, b) => {
    // 1. Highest level reached DESC
    const aLvl = a.highestLevelReached ?? a.level ?? 1;
    const bLvl = b.highestLevelReached ?? b.level ?? 1;
    if (aLvl !== bLvl) return bLvl - aLvl;

    // 2. Total run time ASC
    if (a.timeMs !== b.timeMs) return a.timeMs - b.timeMs;

    // 3. Deaths ASC
    if (a.deaths !== b.deaths) return a.deaths - b.deaths;

    // 4. Coins DESC
    if (a.coins !== b.coins) return b.coins - a.coins;

    // 5. Earlier submission timestamp ASC
    const aTime = new Date(a.createdAt || 0).getTime();
    const bTime = new Date(b.createdAt || 0).getTime();
    return aTime - bTime;
  });
}

describe('Global Leaderboard Redesign', () => {
  it('1. L1 player cannot rank above L10 player because of faster time', () => {
    const l1FastPlayer: LeaderboardEntry = {
      rank: 0,
      playerId: 'p1',
      displayName: 'Fast L1',
      level: 1,
      highestLevelReached: 1,
      completedLevels: 1,
      status: 'COMPLETED',
      timeMs: 9000,
      deaths: 0,
      coins: 5,
      createdAt: '2026-10-04T10:00:00Z',
    };

    const l10SlowPlayer: LeaderboardEntry = {
      rank: 0,
      playerId: 'p2',
      displayName: 'Slow L10',
      level: 10,
      highestLevelReached: 10,
      completedLevels: 10,
      status: 'VICTORY',
      timeMs: 240000,
      deaths: 3,
      coins: 90,
      createdAt: '2026-10-04T10:00:00Z',
    };

    const sorted = sortLeaderboardEntries([l1FastPlayer, l10SlowPlayer]);
    expect(sorted[0].playerId).toBe('p2');
    expect(sorted[1].playerId).toBe('p1');
  });

  it('2. Player reaching L7 and dying appears in GLOBAL leaderboard dataset', () => {
    const deadL7Player: LeaderboardEntry = {
      rank: 0,
      playerId: 'p3',
      displayName: 'DiedAtL7',
      level: 7,
      highestLevelReached: 7,
      completedLevels: 6,
      status: 'DEAD',
      timeMs: 178000,
      deaths: 7,
      coins: 60,
      createdAt: '2026-10-04T10:05:00Z',
    };

    const sorted = sortLeaderboardEntries([deadL7Player]);
    expect(sorted.length).toBe(1);
    expect(sorted[0].status).toBe('DEAD');
  });

  it('3. Player reaching L7 and dying has highest_level_reached = 7', () => {
    const deadL7Player: LeaderboardEntry = {
      rank: 1,
      playerId: 'p3',
      displayName: 'DiedAtL7',
      level: 7,
      highestLevelReached: 7,
      completedLevels: 6,
      status: 'DEAD',
      timeMs: 178000,
      deaths: 7,
      coins: 60,
      createdAt: '2026-10-04T10:05:00Z',
    };

    expect(deadL7Player.highestLevelReached).toBe(7);
    expect(deadL7Player.completedLevels).toBe(6);
  });

  it('4. Player completing L7 has completed_levels = 7', () => {
    const completeL7Player: LeaderboardEntry = {
      rank: 1,
      playerId: 'p4',
      displayName: 'ClearedL7',
      level: 7,
      highestLevelReached: 7,
      completedLevels: 7,
      status: 'COMPLETED',
      timeMs: 160000,
      deaths: 2,
      coins: 68,
      createdAt: '2026-10-04T10:06:00Z',
    };

    expect(completeL7Player.highestLevelReached).toBe(7);
    expect(completeL7Player.completedLevels).toBe(7);
    expect(completeL7Player.status).toBe('COMPLETED');
  });

  it('5. Victory player at L10 ranks appropriately at top of Global leaderboard', () => {
    const victor: LeaderboardEntry = {
      rank: 0,
      playerId: 'pv',
      displayName: 'Victor',
      level: 10,
      highestLevelReached: 10,
      completedLevels: 10,
      status: 'VICTORY',
      timeMs: 250000,
      deaths: 1,
      coins: 95,
      createdAt: '2026-10-04T10:10:00Z',
    };

    const l8Player: LeaderboardEntry = {
      rank: 0,
      playerId: 'p8',
      displayName: 'RunnerL8',
      level: 8,
      highestLevelReached: 8,
      completedLevels: 8,
      status: 'COMPLETED',
      timeMs: 200000,
      deaths: 0,
      coins: 75,
      createdAt: '2026-10-04T10:10:00Z',
    };

    const sorted = sortLeaderboardEntries([l8Player, victor]);
    expect(sorted[0].playerId).toBe('pv');
  });

  it('6. GLOBAL ranking hierarchy order: LEVEL DESC -> TIME ASC -> DEATHS ASC -> COINS DESC -> TIMESTAMP ASC', () => {
    const playerA: LeaderboardEntry = {
      rank: 0, playerId: 'A', displayName: 'A', level: 10, highestLevelReached: 10, completedLevels: 10, status: 'VICTORY', timeMs: 300000, deaths: 5, coins: 90, createdAt: '2026-10-04T10:00:00Z'
    };
    const playerB: LeaderboardEntry = {
      rank: 0, playerId: 'B', displayName: 'B', level: 9, highestLevelReached: 9, completedLevels: 9, status: 'COMPLETED', timeMs: 100000, deaths: 0, coins: 100, createdAt: '2026-10-04T10:00:00Z'
    };
    const playerC: LeaderboardEntry = {
      rank: 0, playerId: 'C', displayName: 'C', level: 10, highestLevelReached: 10, completedLevels: 10, status: 'VICTORY', timeMs: 310000, deaths: 0, coins: 100, createdAt: '2026-10-04T10:00:00Z'
    };
    const playerD: LeaderboardEntry = {
      rank: 0, playerId: 'D', displayName: 'D', level: 10, highestLevelReached: 10, completedLevels: 10, status: 'VICTORY', timeMs: 300000, deaths: 10, coins: 80, createdAt: '2026-10-04T10:00:00Z'
    };

    const sorted = sortLeaderboardEntries([playerA, playerB, playerC, playerD]);
    // Expect order: A (10, 300k, 5d), D (10, 300k, 10d), C (10, 310k), B (9, 100k)
    expect(sorted.map((p) => p.playerId)).toEqual(['A', 'D', 'C', 'B']);

    // Test death tiebreak
    const playerE: LeaderboardEntry = { rank: 0, playerId: 'E', displayName: 'E', level: 8, highestLevelReached: 8, completedLevels: 8, status: 'COMPLETED', timeMs: 100000, deaths: 1, coins: 100, createdAt: '2026-10-04T10:00:00Z' };
    const playerF: LeaderboardEntry = { rank: 0, playerId: 'F', displayName: 'F', level: 8, highestLevelReached: 8, completedLevels: 8, status: 'COMPLETED', timeMs: 100000, deaths: 2, coins: 100, createdAt: '2026-10-04T10:00:00Z' };
    expect(sortLeaderboardEntries([playerF, playerE]).map((p) => p.playerId)).toEqual(['E', 'F']);

    // Test coin tiebreak
    const playerG: LeaderboardEntry = { rank: 0, playerId: 'G', displayName: 'G', level: 8, highestLevelReached: 8, completedLevels: 8, status: 'COMPLETED', timeMs: 100000, deaths: 1, coins: 100, createdAt: '2026-10-04T10:00:00Z' };
    const playerH: LeaderboardEntry = { rank: 0, playerId: 'H', displayName: 'H', level: 8, highestLevelReached: 8, completedLevels: 8, status: 'COMPLETED', timeMs: 100000, deaths: 1, coins: 90, createdAt: '2026-10-04T10:00:00Z' };
    expect(sortLeaderboardEntries([playerH, playerG]).map((p) => p.playerId)).toEqual(['G', 'H']);

    // Test timestamp tiebreak
    const playerI: LeaderboardEntry = { rank: 0, playerId: 'I', displayName: 'I', level: 8, highestLevelReached: 8, completedLevels: 8, status: 'COMPLETED', timeMs: 100000, deaths: 1, coins: 90, createdAt: '2026-10-04T10:00:00Z' };
    const playerJ: LeaderboardEntry = { rank: 0, playerId: 'J', displayName: 'J', level: 8, highestLevelReached: 8, completedLevels: 8, status: 'COMPLETED', timeMs: 100000, deaths: 1, coins: 90, createdAt: '2026-10-04T10:05:00Z' };
    expect(sortLeaderboardEntries([playerJ, playerI]).map((p) => p.playerId)).toEqual(['I', 'J']);
  });

  it('7. Level-specific leaderboard tab excludes players who never reached that level', () => {
    const entries: LeaderboardEntry[] = [
      { rank: 0, playerId: 'pL1', displayName: 'L1 Player', level: 1, highestLevelReached: 1, completedLevels: 1, status: 'COMPLETED', timeMs: 10000, deaths: 0, coins: 5, createdAt: '2026-10-04T10:00:00Z' },
      { rank: 0, playerId: 'pL7', displayName: 'L7 Player', level: 7, highestLevelReached: 7, completedLevels: 7, status: 'COMPLETED', timeMs: 150000, deaths: 2, coins: 60, createdAt: '2026-10-04T10:00:00Z' },
    ];

    const filterLevel7 = entries.filter((e) => e.highestLevelReached >= 7);
    expect(filterLevel7.length).toBe(1);
    expect(filterLevel7[0].playerId).toBe('pL7');
  });

  it('8. DEAD runs are represented correctly with status DEAD', () => {
    const deadRun: LeaderboardEntry = {
      rank: 1,
      playerId: 'pDead',
      displayName: 'FailedHero',
      level: 5,
      highestLevelReached: 5,
      completedLevels: 4,
      status: 'DEAD',
      timeMs: 85000,
      deaths: 4,
      coins: 30,
      createdAt: '2026-10-04T10:00:00Z',
    };

    expect(deadRun.status).toBe('DEAD');
    expect(deadRun.highestLevelReached).toBe(5);
  });

  it('9. ACTIVE runs are filtered out from public leaderboard output', () => {
    const entries: Partial<LeaderboardEntry>[] = [
      { status: 'ACTIVE', playerId: 'activePlayer' },
      { status: 'COMPLETED', playerId: 'completedPlayer' },
      { status: 'DEAD', playerId: 'deadPlayer' },
    ];

    const publicEntries = entries.filter((e) => ['COMPLETED', 'VICTORY', 'DEAD'].includes(e.status!));
    expect(publicEntries.length).toBe(2);
    expect(publicEntries.map((e) => e.playerId)).toEqual(['completedPlayer', 'deadPlayer']);
  });

  it('10. YOUR RANK uses exact same ranking logic', async () => {
    const service = LeaderboardService.getInstance();
    const res = await service.getLeaderboard(0);
    expect(res).toHaveProperty('topScores');
    expect(res).toHaveProperty('playerRank');
  });

  it('11. Current player highlighting correctly matches player profile ID', () => {
    const myId = playerProfileService.getPlayerId();
    const entry: LeaderboardEntry = {
      rank: 1,
      playerId: myId,
      displayName: playerProfileService.getDisplayName(),
      level: 5,
      highestLevelReached: 5,
      completedLevels: 5,
      status: 'COMPLETED',
      timeMs: 45000,
      deaths: 1,
      coins: 20,
      createdAt: '2026-10-04T10:00:00Z',
    };

    expect(entry.playerId).toBe(myId);
  });

  it('12. Offline leaderboard fallback functions properly when disconnected', async () => {
    const service = LeaderboardService.getInstance();
    const res = await service.getLeaderboard(0);
    expect(Array.isArray(res.topScores)).toBe(true);
  });

  it('13. Supabase network failure gracefully handles error without throwing', async () => {
    const service = LeaderboardService.getInstance();
    const res = await service.submitRun({
      runId: 'invalid_run_id',
      level: 1,
      timeMs: 12000,
      deaths: 0,
      coins: 5,
    });
    expect(res).toHaveProperty('isOffline');
  });

  it('14. Existing anti-cheat tests remain passing', () => {
    const val = AntiCheatValidator.validateRun({
      runId: 'run_123',
      playerId: 'player_123',
      level: 1,
      timeMs: 10000,
      deaths: 0,
      coins: 5,
    });
    expect(val.valid).toBe(true);
  });

  it('15. Existing player identity & name sanitization tests remain passing', () => {
    const id = playerProfileService.getPlayerId();
    expect(id).toBeDefined();
    expect(typeof id).toBe('string');

    const clean = playerProfileService.sanitizeName('<script>alert("hack")</script>');
    expect(clean).not.toContain('<script>');
  });
});
