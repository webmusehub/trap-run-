// ─────────────────────────────────────────────────────────────────────────────
// GameState.ts — State machine for the overall game state.
// Valid transitions are explicit; invalid transitions throw.
// Source of truth: TRD.md §46-47, ARCHITECTURE.md §14-16
// ─────────────────────────────────────────────────────────────────────────────

import type { GameState } from '../data/types.js';

// Valid transitions: key = FROM, value = allowed TO states
const VALID_TRANSITIONS: Readonly<Record<GameState, ReadonlyArray<GameState>>> = {
  BOOT:           ['LOADING'],
  LOADING:        ['MAIN_MENU'],
  MAIN_MENU:      ['LEVEL_SELECT', 'LOADING'],
  LEVEL_SELECT:   ['LEVEL_LOADING', 'MAIN_MENU'],
  LEVEL_LOADING:  ['PLAYING'],
  PLAYING:        ['PAUSED', 'DEAD', 'LEVEL_COMPLETE', 'GAME_OVER'],
  PAUSED:         ['PLAYING', 'MAIN_MENU', 'LEVEL_SELECT'],
  DEAD:           ['RESPAWNING', 'GAME_OVER'],
  RESPAWNING:     ['PLAYING'],
  LEVEL_COMPLETE: ['LEVEL_LOADING', 'LEVEL_SELECT', 'VICTORY', 'PLAYING'],
  GAME_OVER:      ['LEVEL_LOADING', 'LEVEL_SELECT', 'MAIN_MENU', 'PLAYING'],
  VICTORY:        ['MAIN_MENU', 'LEVEL_SELECT'],
};

export class GameStateMachine {
  private _current: GameState = 'BOOT';
  private _listeners: Array<(from: GameState, to: GameState) => void> = [];

  get current(): GameState {
    return this._current;
  }

  /** Attempt a transition. Throws if the transition is invalid. */
  transition(next: GameState): void {
    const allowed = VALID_TRANSITIONS[this._current];
    if (!allowed.includes(next)) {
      throw new Error(
        `[GameStateMachine] Invalid transition: ${this._current} → ${next}`,
      );
    }
    const previous = this._current;
    this._current = next;
    for (const listener of this._listeners) {
      listener(previous, next);
    }
  }

  /** Returns true if the transition would be valid without throwing. */
  canTransition(next: GameState): boolean {
    return VALID_TRANSITIONS[this._current].includes(next);
  }

  /** Register a callback to be notified when state changes. */
  onChange(listener: (from: GameState, to: GameState) => void): void {
    this._listeners.push(listener);
  }

  /** Remove a previously registered listener. */
  offChange(listener: (from: GameState, to: GameState) => void): void {
    this._listeners = this._listeners.filter((l) => l !== listener);
  }

  is(state: GameState): boolean {
    return this._current === state;
  }

  isAnyOf(...states: GameState[]): boolean {
    return states.includes(this._current);
  }
}
