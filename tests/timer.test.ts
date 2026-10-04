// ─────────────────────────────────────────────────────────────────────────────
// timer.test.ts — Unit tests for Timer and Countdown utilities.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, vi } from 'vitest';
import { Timer, Countdown } from '../src/utils/timer.js';

describe('Timer', () => {
  it('starts at 0 elapsed', () => {
    const t = new Timer();
    expect(t.getElapsed()).toBe(0);
  });

  it('does not accumulate when stopped', () => {
    const t = new Timer();
    t.update(1);
    expect(t.getElapsed()).toBe(0);
  });

  it('accumulates when running', () => {
    const t = new Timer();
    t.start();
    t.update(0.5);
    t.update(0.5);
    expect(t.getElapsed()).toBeCloseTo(1.0);
  });

  it('pause stops accumulation', () => {
    const t = new Timer();
    t.start();
    t.update(1);
    t.pause();
    t.update(1);
    expect(t.getElapsed()).toBeCloseTo(1.0);
  });

  it('resume restarts accumulation', () => {
    const t = new Timer();
    t.start();
    t.update(1);
    t.pause();
    t.resume();
    t.update(0.5);
    expect(t.getElapsed()).toBeCloseTo(1.5);
  });

  it('reset clears elapsed and stops', () => {
    const t = new Timer();
    t.start();
    t.update(5);
    t.reset();
    expect(t.getElapsed()).toBe(0);
    expect(t.isRunning()).toBe(false);
  });

  it('restart resets and starts', () => {
    const t = new Timer();
    t.start();
    t.update(3);
    t.restart();
    expect(t.getElapsed()).toBe(0);
    expect(t.isRunning()).toBe(true);
  });

  it('format() formats seconds correctly', () => {
    expect(Timer.format(90.5)).toBe('01:30.50');
    expect(Timer.format(0)).toBe('00:00.00');
    expect(Timer.format(3661.09)).toBe('61:01.09');
  });
});

describe('Countdown', () => {
  it('starts with full remaining time', () => {
    const c = new Countdown(3);
    expect(c.getRemaining()).toBe(3);
  });

  it('does not tick before start()', () => {
    const c = new Countdown(2);
    c.update(1);
    expect(c.getRemaining()).toBe(2);
  });

  it('counts down when started', () => {
    const c = new Countdown(2);
    c.start();
    c.update(1);
    expect(c.getRemaining()).toBeCloseTo(1);
  });

  it('calls onComplete when done', () => {
    const cb = vi.fn();
    const c = new Countdown(1, cb);
    c.start();
    c.update(1.5);
    expect(cb).toHaveBeenCalledTimes(1);
    expect(c.isDone()).toBe(true);
  });

  it('does not call onComplete more than once', () => {
    const cb = vi.fn();
    const c = new Countdown(1, cb);
    c.start();
    c.update(2);
    c.update(2);
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('reset restores to initial state', () => {
    const cb = vi.fn();
    const c = new Countdown(2, cb);
    c.start();
    c.update(3);
    c.reset();
    expect(c.getRemaining()).toBe(2);
    expect(c.isDone()).toBe(false);
    c.start();
    c.update(3);
    expect(cb).toHaveBeenCalledTimes(2);
  });
});
