// ─────────────────────────────────────────────────────────────────────────────
// gamestate.test.ts — Unit tests for the GameStateMachine.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, vi } from 'vitest';
import { GameStateMachine } from '../src/game/GameState.js';

describe('GameStateMachine', () => {
  it('starts in BOOT state', () => {
    const sm = new GameStateMachine();
    expect(sm.current).toBe('BOOT');
  });

  it('allows BOOT → LOADING', () => {
    const sm = new GameStateMachine();
    sm.transition('LOADING');
    expect(sm.current).toBe('LOADING');
  });

  it('allows LOADING → MAIN_MENU', () => {
    const sm = new GameStateMachine();
    sm.transition('LOADING');
    sm.transition('MAIN_MENU');
    expect(sm.current).toBe('MAIN_MENU');
  });

  it('allows PLAYING → PAUSED', () => {
    const sm = new GameStateMachine();
    sm.transition('LOADING');
    sm.transition('MAIN_MENU');
    sm.transition('LEVEL_SELECT');
    sm.transition('LEVEL_LOADING');
    sm.transition('PLAYING');
    sm.transition('PAUSED');
    expect(sm.current).toBe('PAUSED');
  });

  it('allows PLAYING → DEAD → RESPAWNING → PLAYING', () => {
    const sm = new GameStateMachine();
    sm.transition('LOADING');
    sm.transition('MAIN_MENU');
    sm.transition('LEVEL_SELECT');
    sm.transition('LEVEL_LOADING');
    sm.transition('PLAYING');
    sm.transition('DEAD');
    sm.transition('RESPAWNING');
    sm.transition('PLAYING');
    expect(sm.current).toBe('PLAYING');
  });

  it('throws on invalid transition', () => {
    const sm = new GameStateMachine();
    expect(() => sm.transition('PLAYING')).toThrow();
  });

  it('canTransition returns false for invalid', () => {
    const sm = new GameStateMachine();
    expect(sm.canTransition('PLAYING')).toBe(false);
  });

  it('canTransition returns true for valid', () => {
    const sm = new GameStateMachine();
    expect(sm.canTransition('LOADING')).toBe(true);
  });

  it('calls onChange listeners on transition', () => {
    const sm = new GameStateMachine();
    const listener = vi.fn();
    sm.onChange(listener);
    sm.transition('LOADING');
    expect(listener).toHaveBeenCalledWith('BOOT', 'LOADING');
  });

  it('supports removing a listener', () => {
    const sm = new GameStateMachine();
    const listener = vi.fn();
    sm.onChange(listener);
    sm.offChange(listener);
    sm.transition('LOADING');
    expect(listener).not.toHaveBeenCalled();
  });

  it('is() returns correct boolean', () => {
    const sm = new GameStateMachine();
    expect(sm.is('BOOT')).toBe(true);
    expect(sm.is('LOADING')).toBe(false);
  });

  it('isAnyOf() matches current state', () => {
    const sm = new GameStateMachine();
    expect(sm.isAnyOf('BOOT', 'LOADING')).toBe(true);
    expect(sm.isAnyOf('PLAYING', 'PAUSED')).toBe(false);
  });

  it('LEVEL_COMPLETE → VICTORY is valid', () => {
    const sm = new GameStateMachine();
    sm.transition('LOADING');
    sm.transition('MAIN_MENU');
    sm.transition('LEVEL_SELECT');
    sm.transition('LEVEL_LOADING');
    sm.transition('PLAYING');
    sm.transition('LEVEL_COMPLETE');
    sm.transition('VICTORY');
    expect(sm.current).toBe('VICTORY');
  });
});
