import { describe, it, expect } from 'vitest';
import { MovingPlatform } from '../src/entities/MovingPlatform.js';
import { FallingPlatform } from '../src/entities/FallingPlatform.js';
import { HiddenSpike } from '../src/entities/HiddenSpike.js';
import { MovingSpike } from '../src/entities/MovingSpike.js';
import { FakeExit } from '../src/entities/FakeExit.js';
import { TriggerTrap } from '../src/entities/TriggerTrap.js';

describe('Trap Systems Reset Behavior', () => {
  it('resets all temporary trap states when level or respawn is triggered', () => {
    const mp = new MovingPlatform({
      id: 'mp-1',
      x: 0,
      y: 0,
      width: 100,
      height: 20,
      movement: { startX: 0, startY: 0, endX: 200, endY: 0, speed: 100, mode: 'ping-pong' },
    });

    const fp = new FallingPlatform({
      id: 'fp-1',
      x: 300,
      y: 300,
      width: 100,
      height: 20,
      triggerDelay: 500,
      shakeDuration: 200,
      fallSpeed: 600,
      resetOnDeath: true,
    });

    const hs = new HiddenSpike({
      id: 'hs-1',
      type: 'hidden-spike',
      x: 500,
      y: 500,
      width: 32,
      height: 32,
    });

    const ms = new MovingSpike({
      id: 'ms-1',
      type: 'moving-spike',
      x: 600,
      y: 600,
      width: 32,
      height: 32,
      properties: { startX: 600, startY: 600, endX: 800, endY: 600, speed: 100 },
    });

    const fe = new FakeExit({
      id: 'fe-1',
      x: 900,
      y: 500,
      width: 60,
      height: 80,
      type: 'fake',
    });

    const tt = new TriggerTrap({
      id: 'tt-1',
      type: 'trigger-trap',
      x: 1000,
      y: 500,
      width: 50,
      height: 50,
    });

    // Mutate state of all traps
    mp.update(1.0);
    fp.onPlayerLand();
    fp.update(1.0);
    hs.trigger();
    hs.update(0.5);
    ms.update(1.0);
    fe.trigger();
    tt.trigger();

    // Verify mutated states
    expect(mp.position.x).not.toBe(0);
    expect(fp.isSolid).toBe(false);
    expect(hs.trapState).not.toBe('idle');
    expect(ms.position.x).not.toBe(600);
    expect(fe.triggered).toBe(true);
    expect(tt.triggered).toBe(true);

    // Perform reset on all traps
    mp.reset();
    fp.reset();
    hs.reset();
    ms.reset();
    fe.reset();
    tt.reset();

    // Verify all restored
    expect(mp.position.x).toBe(0);
    expect(fp.isSolid).toBe(true);
    expect(fp.trapState).toBe('idle');
    expect(hs.trapState).toBe('idle');
    expect(hs.isLethal).toBe(false);
    expect(ms.position.x).toBe(600);
    expect(fe.triggered).toBe(false);
    expect(tt.triggered).toBe(false);
  });
});
