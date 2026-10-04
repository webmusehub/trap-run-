import { describe, it, expect } from 'vitest';
import { Spike } from '../src/entities/Spike.js';
import type { HazardData } from '../src/data/types.js';

describe('Spike Entity', () => {
  it('creates a spike with correct dimensions and hazard category', () => {
    const data: HazardData = {
      id: 'spike-1',
      type: 'static-spike',
      x: 100,
      y: 200,
      width: 32,
      height: 30,
    };

    const spike = new Spike(data);

    expect(spike.id).toBe('spike-1');
    expect(spike.category).toBe('HAZARD');
    expect(spike.position.x).toBe(100);
    expect(spike.position.y).toBe(200);
    expect(spike.width).toBe(32);
    expect(spike.height).toBe(30);
    expect(spike.active).toBe(true);
  });

  it('returns valid bounding box for collision detection', () => {
    const data: HazardData = {
      id: 'spike-2',
      type: 'static-spike',
      x: 50,
      y: 60,
      width: 64,
      height: 32,
    };

    const spike = new Spike(data);
    const bounds = spike.getBounds();

    expect(bounds).toEqual({
      x: 52,
      y: 64,
      width: 60,
      height: 28,
    });
  });
});
