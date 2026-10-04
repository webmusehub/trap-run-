// ─────────────────────────────────────────────────────────────────────────────
// KeyboardInput.ts — Keyboard input handler.
// Captures raw browser keyboard events (A/D/W/Space/Esc/R & Arrow Keys).
// Source of truth: ARCHITECTURE.md §19-22, TRD.md §60-64, PRD Phase 8 §1-2
// ─────────────────────────────────────────────────────────────────────────────

export class KeyboardInput {
  private _held = new Set<string>();
  private _pressed = new Set<string>();

  left = false;
  right = false;
  jump = false;
  pause = false;
  restart = false;

  jumpPressed = false;
  pausePressed = false;
  restartPressed = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this._onKeyDown);
      window.addEventListener('keyup',   this._onKeyUp);
    }
  }

  private _onKeyDown = (e: KeyboardEvent): void => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
      e.preventDefault();
    }
    if (!this._held.has(e.key)) {
      this._pressed.add(e.key);
    }
    this._held.add(e.key);
  };

  private _onKeyUp = (e: KeyboardEvent): void => {
    this._held.delete(e.key);
  };

  update(): void {
    // Continuous held state
    this.left    = this._held.has('ArrowLeft')  || this._held.has('a') || this._held.has('A');
    this.right   = this._held.has('ArrowRight') || this._held.has('d') || this._held.has('D');
    this.jump    = this._held.has('ArrowUp')    || this._held.has('w') || this._held.has('W') || this._held.has(' ');
    this.pause   = this._held.has('Escape');
    this.restart = this._held.has('r') || this._held.has('R');

    // Single-frame press triggers
    this.jumpPressed    = this._pressed.has('ArrowUp') || this._pressed.has('w') || this._pressed.has('W') || this._pressed.has(' ');
    this.pausePressed   = this._pressed.has('Escape');
    this.restartPressed = this._pressed.has('r') || this._pressed.has('R');

    this._pressed.clear();
  }

  reset(): void {
    this._held.clear();
    this._pressed.clear();
    this.left = false;
    this.right = false;
    this.jump = false;
    this.pause = false;
    this.restart = false;
    this.jumpPressed = false;
    this.pausePressed = false;
    this.restartPressed = false;
  }

  destroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', this._onKeyDown);
      window.removeEventListener('keyup',   this._onKeyUp);
    }
  }
}
