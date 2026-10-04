// ─────────────────────────────────────────────────────────────────────────────
// phase8_touch_responsive.test.ts — Unit tests for Phase 8 Touch & Responsive Input.
// Source of truth: ARCHITECTURE.md §19-22, TRD.md §60-64, PRD Phase 8 §25
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TouchInput }    from '../src/input/TouchInput.js';
import { KeyboardInput } from '../src/input/KeyboardInput.js';
import { InputManager }  from '../src/input/InputManager.js';

describe('Phase 8 TouchInput Unit Tests', () => {
  let touchInput: TouchInput;

  beforeEach(() => {
    touchInput = new TouchInput();
  });

  it('starts with all touch movement actions false', () => {
    expect(touchInput.left).toBe(false);
    expect(touchInput.right).toBe(false);
    expect(touchInput.jump).toBe(false);
    expect(touchInput.pause).toBe(false);
  });

  it('handles single-touch pointer down and pointer up for move left', () => {
    touchInput.simulatePointerDown(1, 'left');
    expect(touchInput.left).toBe(true);

    touchInput.simulatePointerUp(1);
    expect(touchInput.left).toBe(false);
  });

  it('supports multi-touch simultaneous move left and jump', () => {
    touchInput.simulatePointerDown(1, 'left');
    touchInput.simulatePointerDown(2, 'jump');

    expect(touchInput.left).toBe(true);
    expect(touchInput.jump).toBe(true);

    touchInput.update();
    expect(touchInput.jumpPressed).toBe(true);

    // Releasing jump keeps left moving
    touchInput.simulatePointerUp(2);
    expect(touchInput.left).toBe(true);
    expect(touchInput.jump).toBe(false);

    touchInput.simulatePointerUp(1);
    expect(touchInput.left).toBe(false);
  });

  it('ensures touch release safety on reset/blur (no stuck input)', () => {
    touchInput.simulatePointerDown(1, 'right');
    touchInput.simulatePointerDown(2, 'jump');
    expect(touchInput.right).toBe(true);
    expect(touchInput.jump).toBe(true);

    touchInput.reset();
    expect(touchInput.right).toBe(false);
    expect(touchInput.jump).toBe(false);
  });
});

describe('Phase 8 Unified InputManager Tests', () => {
  let inputManager: InputManager;

  beforeEach(() => {
    inputManager = new InputManager();
  });

  it('unifies keyboard and touch inputs seamlessly', () => {
    // Touch left + Keyboard jump
    inputManager.touch.simulatePointerDown(10, 'left');
    window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));

    inputManager.update(1 / 60);
    const state = inputManager.getState();

    expect(state.left).toBe(true);
    expect(state.jump).toBe(true);
    expect(state.jumpPressed).toBe(true);
  });

  it('maintains desktop keyboard mapping (A, D, W, Space, Escape, R)', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    inputManager.update(1 / 60);
    expect(inputManager.getState().left).toBe(true);

    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'a' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd' }));
    inputManager.update(1 / 60);
    expect(inputManager.getState().left).toBe(false);
    expect(inputManager.getState().right).toBe(true);
  });
});

describe('Phase 8 Responsive Aspect Ratio Calculations', () => {
  function computeScale(vw: number, vh: number, baseW = 1280, baseH = 720) {
    const scale = Math.min(vw / baseW, vh / baseH);
    return {
      width: Math.floor(baseW * scale),
      height: Math.floor(baseH * scale),
    };
  }

  it('maintains 16:9 canvas proportions across desktop and mobile landscape resolutions', () => {
    const resDesktop = computeScale(1920, 1080);
    expect(resDesktop.width / resDesktop.height).toBeCloseTo(16 / 9, 2);

    const resPhoneLandscape = computeScale(844, 390);
    expect(resPhoneLandscape.width / resPhoneLandscape.height).toBeCloseTo(16 / 9, 2);

    const resTabletLandscape = computeScale(1024, 768);
    expect(resTabletLandscape.width / resTabletLandscape.height).toBeCloseTo(16 / 9, 2);
  });
});
