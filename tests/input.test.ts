// ─────────────────────────────────────────────────────────────────────────────
// input.test.ts — InputManager tests using simulated keyboard events.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { InputManager } from '../src/input/InputManager.js';
import { GAME_CONFIG }  from '../src/game/GameConfig.js';

const DT = 1 / 60;

// Simulate keydown / keyup in jsdom-like environments
function keyDown(key: string): void {
  window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
}
function keyUp(key: string): void {
  window.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }));
}

describe('InputManager', () => {
  let input: InputManager;

  beforeEach(() => { input = new InputManager(); });
  afterEach(()  => { input.destroy(); });

  // ── Left / Right ─────────────────────────────────────────────────────────

  it('left is true when ArrowLeft is held', () => {
    keyDown('ArrowLeft');
    input.update(DT);
    expect(input.getState().left).toBe(true);
    keyUp('ArrowLeft');
  });

  it('left is true when a is held', () => {
    keyDown('a');
    input.update(DT);
    expect(input.getState().left).toBe(true);
    keyUp('a');
  });

  it('right is true when ArrowRight is held', () => {
    keyDown('ArrowRight');
    input.update(DT);
    expect(input.getState().right).toBe(true);
    keyUp('ArrowRight');
  });

  it('right is true when d is held', () => {
    keyDown('d');
    input.update(DT);
    expect(input.getState().right).toBe(true);
    keyUp('d');
  });

  it('left is false after key release', () => {
    keyDown('ArrowLeft');
    input.update(DT);
    keyUp('ArrowLeft');
    input.update(DT);
    expect(input.getState().left).toBe(false);
  });

  // ── Jump held vs pressed ─────────────────────────────────────────────────

  it('jump is true while Space is held', () => {
    keyDown(' ');
    input.update(DT);
    expect(input.getState().jump).toBe(true);
    keyUp(' ');
  });

  it('jumpPressed is true only on the first tick of Space', () => {
    keyDown(' ');
    input.update(DT);
    expect(input.getState().jumpPressed).toBe(true);
    // second tick — key is still held but not a new press
    input.update(DT);
    expect(input.getState().jumpPressed).toBe(false);
    keyUp(' ');
  });

  it('jump sets jumpBufferTime to JUMP_BUFFER_TIME on press', () => {
    keyDown('w');
    input.update(DT);
    expect(input.getState().jumpBufferTime).toBeCloseTo(GAME_CONFIG.player.jumpBufferTime, 5);
    keyUp('w');
  });

  it('jumpBufferTime decays each tick when not pressed', () => {
    keyDown(' ');
    input.update(DT);
    keyUp(' ');
    const after1 = input.getState().jumpBufferTime;
    input.update(DT);
    expect(input.getState().jumpBufferTime).toBeLessThan(after1);
  });

  it('jumpBufferTime reaches 0 after enough ticks', () => {
    keyDown('ArrowUp');
    input.update(DT);
    keyUp('ArrowUp');
    const bufferTicks = Math.ceil(GAME_CONFIG.player.jumpBufferTime / DT) + 5;
    for (let i = 0; i < bufferTicks; i++) input.update(DT);
    expect(input.getState().jumpBufferTime).toBe(0);
  });

  // ── Pause ────────────────────────────────────────────────────────────────

  it('pausePressed is true on first Escape tick', () => {
    keyDown('Escape');
    input.update(DT);
    expect(input.getState().pausePressed).toBe(true);
    keyUp('Escape');
  });

  it('pausePressed is false on second tick while held', () => {
    keyDown('Escape');
    input.update(DT);
    input.update(DT); // still held, no new keydown
    expect(input.getState().pausePressed).toBe(false);
    keyUp('Escape');
  });

  // ── Restart ──────────────────────────────────────────────────────────────

  it('restartPressed is true on first R tick', () => {
    keyDown('r');
    input.update(DT);
    expect(input.getState().restartPressed).toBe(true);
    keyUp('r');
  });

  // ── No input ─────────────────────────────────────────────────────────────

  it('all actions false with no keys pressed', () => {
    input.update(DT);
    const s = input.getState();
    expect(s.left).toBe(false);
    expect(s.right).toBe(false);
    expect(s.jump).toBe(false);
    expect(s.jumpPressed).toBe(false);
    expect(s.pause).toBe(false);
  });
});
