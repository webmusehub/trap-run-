import { describe, it, expect } from 'vitest';
import { MovingSpike } from '../src/entities/MovingSpike.js';
import type { HazardData } from '../src/data/types.js';

describe('MovingSpike Entity', () => {
  const data: HazardData = {
    id: 'mov-spike-1',
    type: 'moving-spike',
    x: 300,
    y: 400,
    width: 32,
    height: 32,
    properties: {
      startX: 300,
      startY: 400,
      endX: 500,
      endY: 400,
      speed: 100, // 100 px/s
    },
  };

  it('creates moving hazard with correct category', () => {
    const ms = new MovingSpike(data);
    expect(ms.id).toBe('mov-spike-1');
    expect(ms.category).toBe('HAZARD');
    expect(ms.position.x).toBe(300);
  });

  it('moves deterministically along line segment', () => {
    const ms = new MovingSpike(data);

    ms.update(1.0); // 1s at 100 px/s -> x = 400
    expect(ms.position.x).toBeCloseTo(400);

    ms.update(1.0); // 2s -> x = 500
    expect(ms.position.x).toBeCloseTo(500);
  });

  it('resets start position on reset()', () => {
    const ms = new MovingSpike(data);
    ms.update(1.5);
    expect(ms.position.x).not.toBe(300);

    ms.reset();
    expect(ms.position.x).toBe(300);
  });
});
