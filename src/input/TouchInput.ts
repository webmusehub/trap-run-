// ─────────────────────────────────────────────────────────────────────────────
// TouchInput.ts — Multi-touch pointer events input handler for mobile/tablet.
// Manages touch overlay controls, multi-touch tracking, and touch release safety.
// Source of truth: ARCHITECTURE.md §19-22, TRD.md §60-64, PRD Phase 8 §3-7
// ─────────────────────────────────────────────────────────────────────────────

export class TouchInput {
  private _pointerMap = new Map<number, 'left' | 'right' | 'jump' | 'pause'>();

  left = false;
  right = false;
  jump = false;
  pause = false;

  jumpPressed = false;
  pausePressed = false;

  private _prevJump = false;
  private _prevPause = false;

  private _leftEl: HTMLElement | null = null;
  private _rightEl: HTMLElement | null = null;
  private _jumpEl: HTMLElement | null = null;
  private _pauseEl: HTMLElement | null = null;

  constructor() {
    this.bindDOM();
  }

  /** Query DOM and attach pointer event listeners to touch buttons. */
  bindDOM(): void {
    if (typeof document === 'undefined') return;

    this._leftEl  = document.getElementById('btn-left');
    this._rightEl = document.getElementById('btn-right');
    this._jumpEl  = document.getElementById('btn-jump');
    this._pauseEl = document.getElementById('btn-pause');

    this._bindButton(this._leftEl,  'left');
    this._bindButton(this._rightEl, 'right');
    this._bindButton(this._jumpEl,  'jump');
    this._bindButton(this._pauseEl, 'pause');

    if (typeof window !== 'undefined') {
      window.addEventListener('blur', this._onWindowBlur);
    }
  }

  private _bindButton(el: HTMLElement | null, action: 'left' | 'right' | 'jump' | 'pause'): void {
    if (!el) return;

    const onDown = (e: PointerEvent) => {
      e.preventDefault();
      this._pointerMap.set(e.pointerId, action);
      this._updateActionStates();
    };

    const onUp = (e: PointerEvent) => {
      e.preventDefault();
      this._pointerMap.delete(e.pointerId);
      this._updateActionStates();
    };

    el.addEventListener('pointerdown',   onDown);
    el.addEventListener('pointerup',     onUp);
    el.addEventListener('pointercancel', onUp);
    el.addEventListener('pointerleave',  onUp);
  }

  private _onWindowBlur = (): void => {
    this.reset();
  };

  /** Programmatically simulate pointer down for unit testing or external input. */
  simulatePointerDown(pointerId: number, action: 'left' | 'right' | 'jump' | 'pause'): void {
    this._pointerMap.set(pointerId, action);
    this._updateActionStates();
  }

  /** Programmatically simulate pointer up for unit testing or external input. */
  simulatePointerUp(pointerId: number): void {
    this._pointerMap.delete(pointerId);
    this._updateActionStates();
  }

  private _updateActionStates(): void {
    let hasLeft  = false;
    let hasRight = false;
    let hasJump  = false;
    let hasPause = false;

    for (const action of this._pointerMap.values()) {
      if (action === 'left')  hasLeft  = true;
      if (action === 'right') hasRight = true;
      if (action === 'jump')  hasJump  = true;
      if (action === 'pause') hasPause = true;
    }

    this.left  = hasLeft;
    this.right = hasRight;
    this.jump  = hasJump;
    this.pause = hasPause;
  }

  /** Advance frame tick to calculate one-frame press events (jumpPressed, pausePressed). */
  update(): void {
    this.jumpPressed  = this.jump  && !this._prevJump;
    this.pausePressed = this.pause && !this._prevPause;

    this._prevJump  = this.jump;
    this._prevPause = this.pause;
  }

  reset(): void {
    this._pointerMap.clear();
    this.left  = false;
    this.right = false;
    this.jump  = false;
    this.pause = false;
    this.jumpPressed  = false;
    this.pausePressed = false;
    this._prevJump  = false;
    this._prevPause = false;
  }

  destroy(): void {
    this.reset();
    if (typeof window !== 'undefined') {
      window.removeEventListener('blur', this._onWindowBlur);
    }
  }
}
