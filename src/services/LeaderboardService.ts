// ─────────────────────────────────────────────────────────────────────────────
// LeaderboardService.ts — Online Supabase Leaderboard & Score Submission Layer.
// Communicates with Supabase Edge Functions. Handles network failure gracefully.
// Source of truth: Master Release Candidate Prompt §8-13, §17-21
// ─────────────────────────────────────────────────────────────────────────────

import { playerProfileService } from './PlayerProfileService.js';
import { AntiCheatValidator } from './AntiCheatValidator.js';
import { analyticsService } from './AnalyticsService.js';

export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  displayName: string;
  level: number;
  timeMs: number;
  deaths: number;
  coins: number;
  createdAt: string;
}

export interface RunStartResponse {
  runId: string;
  startedAt: number;
  isOffline?: boolean;
}

export interface RunSubmitRequest {
  runId: string;
  level: number;
  timeMs: number;
  deaths: number;
  coins: number;
}

export interface RunSubmitResponse {
  success: boolean;
  rank?: number | null;
  isPersonalBest?: boolean;
  reason?: string;
  isOffline?: boolean;
}

export interface LeaderboardResponse {
  topScores: LeaderboardEntry[];
  playerRank: LeaderboardEntry | null;
  isOffline?: boolean;
  errorMessage?: string;
}

export class LeaderboardService {
  private static _instance: LeaderboardService | null = null;
  private _supabaseUrl: string;
  private _supabaseAnonKey: string;
  private _activeRunId: string | null = null;
  private _activeRunStartMs: number = 0;

  private constructor() {
    this._supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || '';
    this._supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || '';
  }

  public static getInstance(): LeaderboardService {
    if (!LeaderboardService._instance) {
      LeaderboardService._instance = new LeaderboardService();
    }
    return LeaderboardService._instance;
  }

  public isConfigured(): boolean {
    return Boolean(this._supabaseUrl && this._supabaseAnonKey);
  }

  /**
   * Start a run on a given level.
   * Calls Supabase Edge Function run-start or falls back gracefully.
   */
  public async startRun(level: number): Promise<RunStartResponse> {
    const playerId = playerProfileService.getPlayerId();
    const displayName = playerProfileService.getDisplayName();
    const now = Date.now();

    this._activeRunStartMs = now;

    if (!this.isConfigured()) {
      const offlineId = `offline_run_${now}_${Math.floor(Math.random() * 10000)}`;
      this._activeRunId = offlineId;
      return { runId: offlineId, startedAt: now, isOffline: true };
    }

    try {
      const response = await fetch(`${this._supabaseUrl}/functions/v1/run-start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this._supabaseAnonKey}`,
          'apikey': this._supabaseAnonKey,
        },
        body: JSON.stringify({
          playerId,
          displayName,
          level,
        }),
      });

      if (!response.ok) {
        throw new Error(`run-start returned status ${response.status}`);
      }

      const data = await response.json();
      const runId = data.runId || `run_${now}_${Math.floor(Math.random() * 10000)}`;
      this._activeRunId = runId;
      return { runId, startedAt: now, isOffline: false };
    } catch (err) {
      console.warn('[LeaderboardService] run-start API call failed, falling back to local runId:', err);
      const offlineId = `offline_run_${now}_${Math.floor(Math.random() * 10000)}`;
      this._activeRunId = offlineId;
      return { runId: offlineId, startedAt: now, isOffline: true };
    }
  }

  public getActiveRunId(): string | null {
    return this._activeRunId;
  }

  /**
   * Submit completed level score for verification and leaderboard entry.
   * Non-blocking for the core game loop.
   */
  public async submitRun(req: RunSubmitRequest): Promise<RunSubmitResponse> {
    analyticsService.track('score_submission_started', { level: req.level, timeMs: req.timeMs });

    const playerId = playerProfileService.getPlayerId();
    const displayName = playerProfileService.getDisplayName();
    const runId = req.runId || this._activeRunId || `run_${Date.now()}`;

    // Client-side pre-validation anti-cheat check
    const validation = AntiCheatValidator.validateRun({
      runId,
      playerId,
      level: req.level,
      timeMs: req.timeMs,
      deaths: req.deaths,
      coins: req.coins,
      startedAt: this._activeRunStartMs,
      completedAt: Date.now(),
    });

    if (!validation.valid) {
      console.warn('[LeaderboardService] Client pre-validation rejected run:', validation.reason);
      analyticsService.track('score_submission_failed', { reason: validation.reason });
      return { success: false, reason: validation.reason || 'Invalid run completion parameters.' };
    }

    if (!this.isConfigured()) {
      analyticsService.track('score_submission_success', { isOffline: true });
      return {
        success: true,
        isOffline: true,
        reason: 'Leaderboard credentials not configured. Saved locally.',
      };
    }

    try {
      const response = await fetch(`${this._supabaseUrl}/functions/v1/run-complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this._supabaseAnonKey}`,
          'apikey': this._supabaseAnonKey,
        },
        body: JSON.stringify({
          runId,
          playerId,
          displayName,
          level: req.level,
          timeMs: req.timeMs,
          deaths: req.deaths,
          coins: req.coins,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server returned HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      analyticsService.track('score_submission_success', { rank: data.rank });
      return {
        success: true,
        rank: data.rank ?? null,
        isPersonalBest: Boolean(data.isPersonalBest),
        isOffline: false,
      };
    } catch (err) {
      console.warn('[LeaderboardService] Score submission failed (network/server issue):', err);
      analyticsService.track('score_submission_failed', { error: String(err) });
      return {
        success: false,
        isOffline: true,
        reason: 'Score couldn\'t be submitted right now. You can continue playing.',
      };
    }
  }

  /**
   * Fetch leaderboard rankings for a specific level (1-10) or overall (0).
   */
  public async getLeaderboard(level: number = 0): Promise<LeaderboardResponse> {
    analyticsService.track('leaderboard_opened', { level });

    const playerId = playerProfileService.getPlayerId();

    if (!this.isConfigured()) {
      return {
        topScores: [],
        playerRank: null,
        isOffline: true,
        errorMessage: 'Leaderboard is unavailable in offline mode.',
      };
    }

    try {
      const url = new URL(`${this._supabaseUrl}/functions/v1/leaderboard`);
      url.searchParams.append('level', String(level));
      url.searchParams.append('playerId', playerId);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this._supabaseAnonKey}`,
          'apikey': this._supabaseAnonKey,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return await this._getLeaderboardRestFallback(level, playerId);
        }
        throw new Error(`Leaderboard HTTP ${response.status}`);
      }

      const data = await response.json();
      return {
        topScores: Array.isArray(data.topScores) ? data.topScores : [],
        playerRank: data.playerRank || null,
        isOffline: false,
      };
    } catch (err) {
      console.warn('[LeaderboardService] Edge Function unavailable, attempting PostgREST fallback...', err);
      return await this._getLeaderboardRestFallback(level, playerId);
    }
  }

  /** PostgREST API Fallback for fetching leaderboards directly from Supabase tables */
  private async _getLeaderboardRestFallback(level: number, playerId: string): Promise<LeaderboardResponse> {
    try {
      let restUrl = `${this._supabaseUrl}/rest/v1/runs?select=id,player_id,level,time_ms,deaths,coins,created_at,players(display_name)&status=eq.COMPLETED&order=time_ms.asc,deaths.asc&limit=100`;
      if (level > 0 && level <= 10) {
        restUrl += `&level=eq.${level}`;
      }

      const response = await fetch(restUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this._supabaseAnonKey}`,
          'apikey': this._supabaseAnonKey,
        },
      });

      if (!response.ok) {
        throw new Error(`PostgREST HTTP ${response.status}`);
      }

      const rawRows = await response.json();
      const topScores: LeaderboardEntry[] = (rawRows || []).map((row: any, idx: number) => ({
        rank: idx + 1,
        playerId: row.player_id,
        displayName: row.players?.display_name || 'Runner',
        level: row.level,
        timeMs: row.time_ms,
        deaths: row.deaths,
        coins: row.coins,
        createdAt: row.created_at,
      }));

      const playerRank = topScores.find((entry) => entry.playerId === playerId) || null;

      return {
        topScores,
        playerRank,
        isOffline: false,
      };
    } catch (err) {
      console.warn('[LeaderboardService] PostgREST fallback also failed:', err);
      return {
        topScores: [],
        playerRank: null,
        isOffline: true,
        errorMessage: 'Leaderboard unavailable right now.',
      };
    }
  }
}

export const leaderboardService = LeaderboardService.getInstance();
