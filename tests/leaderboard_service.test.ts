import { describe, it, expect } from 'vitest';
import { LeaderboardService } from '../src/services/LeaderboardService.js';

describe('LeaderboardService Resilience', () => {
  it('returns valid startRun response even when unconfigured/offline', async () => {
    const service = LeaderboardService.getInstance();
    const res = await service.startRun(1);
    expect(res.runId).toBeDefined();
    expect(typeof res.runId).toBe('string');
    expect(res.startedAt).toBeGreaterThan(0);
  });

  it('handles submitRun offline gracefully without throwing exceptions', async () => {
    const service = LeaderboardService.getInstance();
    const startRes = await service.startRun(1);
    // Simulate start 15 seconds ago
    (service as any)._activeRunStartMs = Date.now() - 15000;

    const res = await service.submitRun({
      runId: startRes.runId,
      level: 1,
      timeMs: 12500,
      deaths: 1,
      coins: 5,
    });
    expect(typeof res.success).toBe('boolean');
    expect(res).toHaveProperty('isOffline');
  });

  it('handles getLeaderboard offline gracefully', async () => {
    const service = LeaderboardService.getInstance();
    const res = await service.getLeaderboard(0);
    expect(res.topScores).toBeDefined();
    expect(Array.isArray(res.topScores)).toBe(true);
  });
});
