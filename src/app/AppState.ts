// ─────────────────────────────────────────────────────────────────────────────
// AppState.ts — Application-level state (separate from game state).
// Tracks whether the app is initializing, running, or shut down.
// Source of truth: ARCHITECTURE.md §5
// ─────────────────────────────────────────────────────────────────────────────

export type AppLifecycle = 'INITIALIZING' | 'RUNNING' | 'STOPPED' | 'ERROR';

export class AppState {
  private _lifecycle: AppLifecycle = 'INITIALIZING';
  private _error: string | null = null;

  get lifecycle(): AppLifecycle {
    return this._lifecycle;
  }

  get error(): string | null {
    return this._error;
  }

  setRunning(): void {
    this._lifecycle = 'RUNNING';
  }

  setStopped(): void {
    this._lifecycle = 'STOPPED';
  }

  setError(message: string): void {
    this._lifecycle = 'ERROR';
    this._error = message;
    console.error('[AppState] Fatal error:', message);
  }

  isRunning(): boolean {
    return this._lifecycle === 'RUNNING';
  }
}
