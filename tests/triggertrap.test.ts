import { describe, it, expect } from 'vitest';
import { TriggerTrap } from '../src/entities/TriggerTrap.js';
import type { HazardData } from '../src/data/types.js';

describe('TriggerTrap Entity', () => {
  const data: HazardData = {
    id: 'trig-1',
    type: 'trigger-trap',
    x: 600,
    y: 500,
    width: 80,
    height: 100,
    properties: {
      targetId: 'spike-hidden-1',
      singleUse: true,
    },
  };

  it('creates a trigger zone with TRIGGER category', () => {
    const tt = new TriggerTrap(data);
    expect(tt.id).toBe('trig-1');
    expect(tt.category).toBe('TRIGGER');
    expect(tt.targetId).toBe('spike-hidden-1');
    expect(tt.triggered).toBe(false);
  });

  it('triggers when activated and respects singleUse', () => {
    const tt = new TriggerTrap(data);
    tt.trigger();
    expect(tt.triggered).toBe(true);
  });

  it('resets triggered state on reset()', () => {
    const tt = new TriggerTrap(data);
    tt.trigger();

    tt.reset();
    expect(tt.triggered).toBe(false);
  });
});
