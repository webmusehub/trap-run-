// ─────────────────────────────────────────────────────────────────────────────
// AnalyticsService.ts — Lightweight Gameplay Funnel & Analytics Tracking.
// Non-blocking, failure-tolerant event tracking layer.
// Source of truth: Master Release Candidate Prompt §25, §26
// ─────────────────────────────────────────────────────────────────────────────

export type AnalyticsEventType =
  | 'game_loaded'
  | 'game_started'
  | 'name_created'
  | 'level_started'
  | 'level_completed'
  | 'player_death'
  | 'checkpoint_reached'
  | 'level_restart'
  | 'game_over'
  | 'victory'
  | 'leaderboard_opened'
  | 'score_submission_started'
  | 'score_submission_success'
  | 'score_submission_failed'
  | 'share_clicked'
  | 'ad_impression'
  | 'ad_clicked';

export interface AnalyticsEvent {
  type: AnalyticsEventType;
  payload?: Record<string, any>;
  timestamp: number;
}

export class AnalyticsService {
  private static _instance: AnalyticsService | null = null;
  private _eventsLog: AnalyticsEvent[] = [];

  private constructor() {}

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService._instance) {
      AnalyticsService._instance = new AnalyticsService();
    }
    return AnalyticsService._instance;
  }

  /**
   * Track an event. Never throws errors.
   */
  public track(type: AnalyticsEventType, payload?: Record<string, any>): void {
    try {
      const event: AnalyticsEvent = {
        type,
        payload,
        timestamp: Date.now(),
      };
      this._eventsLog.push(event);

      // Keep max 200 events in memory
      if (this._eventsLog.length > 200) {
        this._eventsLog.shift();
      }

      if (import.meta.env?.DEV) {
        console.log(`[Analytics] ${type}`, payload || '');
      }

      // If an analytics endpoint is configured in env variables, fire-and-forget POST
      const endpoint = import.meta.env?.VITE_ANALYTICS_ENDPOINT;
      if (endpoint && typeof fetch === 'function') {
        fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event),
          keepalive: true,
        }).catch(() => {
          // silently ignore failure
        });
      }
    } catch (_) {
      // never crash game for analytics errors
    }
  }

  public getEventHistory(): readonly AnalyticsEvent[] {
    return this._eventsLog;
  }
}

export const analyticsService = AnalyticsService.getInstance();
