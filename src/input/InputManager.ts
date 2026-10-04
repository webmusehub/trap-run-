// ─────────────────────────────────────────────────────────────────────────────
// InputManager.ts — Unified input abstraction layer combining keyboard & touch.
// Source of truth: ARCHITECTURE.md §19-22, TRD.md §60-64, PRD Phase 8 §1-2
// ─────────────────────────────────────────────────────────────────────────────

import type { InputState } from '../data/types.js';
import { JUMP_BUFFER_TIME } from '../data/constants.js';
import { KeyboardInput } from './KeyboardInput.js';
import { TouchInput }    from './TouchInput.js';

export class InputManager {
  private readonly _keyboard: KeyboardInput;
  private readonly _touch:    TouchInput;

  private _state: InputState = {
    left:           false,
    right:          false,
    jump:           false,
    jumpPressed:    false,
    pausePressed:   false,
    restartPressed: false,
    pause:          false,
    restart:        false,
    jumpBufferTime: 0,
  };

  constructor() {
    this._keyboard = new KeyboardInput();
    this._touch    = new TouchInput();
  }

  get keyboard(): KeyboardInput { return this._keyboard; }
  get touch(): TouchInput       { return this._touch; }

  /** Call after DOM mounts to ensure touch button elements are bound. */
  bindDOM(): void {
    this._touch.bindDOM();
  }

  /**
   * Call once per fixed-physics tick.
   * Merges keyboard + touch inputs and updates jump buffer.
   */
  update(delta: number): void {
    this._keyboard.update();
    this._touch.update();

    // Unified held state (Keyboard OR Touch)
    this._state.left    = this._keyboard.left    || this._touch.left;
    this._state.right   = this._keyboard.right   || this._touch.right;
    this._state.jump    = this._keyboard.jump    || this._touch.jump;
    this._state.pause   = this._keyboard.pause   || this._touch.pause;
    this._state.restart = this._keyboard.restart;

    // Unified one-frame press triggers
    const jumpJustPressed = this._keyboard.jumpPressed || this._touch.jumpPressed;
    this._state.jumpPressed    = jumpJustPressed;
    this._state.pausePressed   = this._keyboard.pausePressed || this._touch.pausePressed;
    this._state.restartPressed = this._keyboard.restartPressed;

    // Jump buffer logic
    if (jumpJustPressed) {
      this._state.jumpBufferTime = JUMP_BUFFER_TIME;
    } else {
      this._state.jumpBufferTime = Math.max(0, this._state.jumpBufferTime - delta);
    }
  }

  /** Read-only snapshot of current input state. */
  getState(): Readonly<InputState> {
    return this._state;
  }

  /** Manual touch injection helper (for backward compatibility / tests). */
  setTouchState(partial: Partial<Omit<InputState, 'jumpBufferTime' | 'jumpPressed' | 'pausePressed' | 'restartPressed'>>): void {
    if (partial.left    !== undefined) this._touch.left  = partial.left;
    if (partial.right   !== undefined) this._touch.right = partial.right;
    if (partial.jump    !== undefined) {
      this._touch.jump = partial.jump;
    }
    if (partial.pause   !== undefined) this._touch.pause = partial.pause;
  }

  destroy(): void {
    this._keyboard.destroy();
    this._touch.destroy();
  }
}
