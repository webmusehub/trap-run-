import { describe, it, expect } from 'vitest';
import { HiddenSpike } from '../src/entities/HiddenSpike.js';
import type { HazardData } from '../src/data/types.js';

describe('HiddenSpike Entity', () => {
  const data: HazardData = {
    id: 'hidden-1',
    type: 'hidden-spike',
    x: 500,
    y: 600,
    width: 64,
    height: 30,
    properties: {
      triggerDistance: 100,
      warningDuration: 200,
      riseDuration: 100,
    },
  };

  it('starts hidden and non-lethal', () => {
    const hs = new HiddenSpike(data);
    expect(hs.trapState).toBe('idle');
    expect(hs.isLethal).toBe(false);
  });

  it('triggers when player enters proximity', () => {
    const hs = new HiddenSpike(data);

    // Player far away (300px) -> remains idle
    hs.checkProximity({ x: 100, y: 600 });
    expect(hs.trapState).toBe('idle');

    // Player within 100px -> triggers warning
    hs.checkProximity({ x: 450, y: 600 });
    expect(hs.trapState).toBe('warning');
  });

  it('progresses warning -> activating -> active and becomes lethal', () => {
    const hs = new HiddenSpike(data);
    hs.trigger(); // warning state

    // Advance 0.2s (200ms) -> activating state
    hs.update(0.2);
    expect(hs.trapState).toBe('activating');

    // Advance 0.1s (100ms) -> active state
    hs.update(0.1);
    expect(hs.trapState).toBe('active');
    expect(hs.isLethal).toBe(true);
  });

  it('resets subterranean hidden state on reset()', () => {
    const hs = new HiddenSpike(data);
    hs.trigger();
    hs.update(0.5);

    hs.reset();
    expect(hs.trapState).toBe('idle');
    expect(hs.isLethal).toBe(false);
  });
});
