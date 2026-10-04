// ─────────────────────────────────────────────────────────────────────────────
// eventbus.test.ts — Unit tests for the EventBus.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, vi } from 'vitest';
import { EventBus } from '../src/systems/EventBus.js';

describe('EventBus', () => {
  it('calls a listener when event is emitted', () => {
    const bus = new EventBus();
    const fn = vi.fn();
    bus.on('GAME_OVER', fn);
    bus.emit('GAME_OVER', { levelId: 1, deaths: 5 });
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith({ levelId: 1, deaths: 5 });
  });

  it('calls multiple listeners', () => {
    const bus = new EventBus();
    const fn1 = vi.fn();
    const fn2 = vi.fn();
    bus.on('COIN_COLLECTED', fn1);
    bus.on('COIN_COLLECTED', fn2);
    bus.emit('COIN_COLLECTED', { coinId: 'c1', position: { x: 10, y: 20 } });
    expect(fn1).toHaveBeenCalledTimes(1);
    expect(fn2).toHaveBeenCalledTimes(1);
  });

  it('off() stops a listener', () => {
    const bus = new EventBus();
    const fn = vi.fn();
    bus.on('VICTORY', fn);
    bus.off('VICTORY', fn);
    bus.emit('VICTORY', { totalDeaths: 0, totalTime: 120 });
    expect(fn).not.toHaveBeenCalled();
  });

  it('on() returns an unsubscribe function', () => {
    const bus = new EventBus();
    const fn = vi.fn();
    const unsub = bus.on('TRAP_TRIGGERED', fn);
    unsub();
    bus.emit('TRAP_TRIGGERED', { trapId: 't1', trapType: 'static-spike' });
    expect(fn).not.toHaveBeenCalled();
  });

  it('once() fires exactly once', () => {
    const bus = new EventBus();
    const fn = vi.fn();
    bus.once('CHECKPOINT_ACTIVATED', fn);
    bus.emit('CHECKPOINT_ACTIVATED', { checkpointId: 'cp1' });
    bus.emit('CHECKPOINT_ACTIVATED', { checkpointId: 'cp1' });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('clear() removes all listeners', () => {
    const bus = new EventBus();
    const fn = vi.fn();
    bus.on('PLAYER_DIED', fn);
    bus.on('VICTORY', fn);
    bus.clear();
    bus.emit('PLAYER_DIED', { reason: 'spike', position: { x: 0, y: 0 } });
    bus.emit('VICTORY', { totalDeaths: 0, totalTime: 0 });
    expect(fn).not.toHaveBeenCalled();
  });

  it('clearEvent() removes listeners for one event only', () => {
    const bus = new EventBus();
    const fn1 = vi.fn();
    const fn2 = vi.fn();
    bus.on('PLAYER_DIED', fn1);
    bus.on('VICTORY', fn2);
    bus.clearEvent('PLAYER_DIED');
    bus.emit('PLAYER_DIED', { reason: 'spike', position: { x: 0, y: 0 } });
    bus.emit('VICTORY', { totalDeaths: 0, totalTime: 0 });
    expect(fn1).not.toHaveBeenCalled();
    expect(fn2).toHaveBeenCalledTimes(1);
  });

  it('does not throw when emitting with no listeners', () => {
    const bus = new EventBus();
    expect(() =>
      bus.emit('LEVEL_STARTED', { levelId: 1 })
    ).not.toThrow();
  });

  it('STATE_CHANGED carries correct payload', () => {
    const bus = new EventBus();
    const fn = vi.fn();
    bus.on('STATE_CHANGED', fn);
    bus.emit('STATE_CHANGED', { from: 'BOOT', to: 'LOADING' });
    expect(fn).toHaveBeenCalledWith({ from: 'BOOT', to: 'LOADING' });
  });
});
