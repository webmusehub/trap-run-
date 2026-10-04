import { describe, it, expect } from 'vitest';
import { MovingPlatform } from '../src/entities/MovingPlatform.js';
import type { MovingPlatformData } from '../src/data/types.js';

describe('MovingPlatform Entity', () => {
  const data: MovingPlatformData = {
    id: 'mov-1',
    x: 100,
    y: 200,
    width: 120,
    height: 20,
    movement: {
      startX: 100,
      startY: 200,
      endX: 300,
      endY: 200,
      speed: 100, // 100 px/s over 200 px distance = 2.0s one-way
      mode: 'ping-pong',
    },
  };

  it('initializes at start position with correct category', () => {
    const mp = new MovingPlatform(data);
    expect(mp.id).toBe('mov-1');
    expect(mp.category).toBe('MOVING_PLATFORM');
    expect(mp.position.x).toBe(100);
    expect(mp.position.y).toBe(200);
  });

  it('moves deterministically along defined path based on speed and delta', () => {
    const mp = new MovingPlatform(data);

    // Update 1 second at 100 px/s -> should reach x = 200 (halfway)
    mp.update(1.0);
    expect(mp.position.x).toBeCloseTo(200);
    expect(mp.deltaX).toBeCloseTo(100);

    // Update another 1 second -> should reach x = 300 (end point)
    mp.update(1.0);
    expect(mp.position.x).toBeCloseTo(300);
  });

  it('reverses direction upon reaching end point in ping-pong mode', () => {
    const mp = new MovingPlatform(data);

    // Update 2.0 seconds -> reaches end point (x = 300)
    mp.update(2.0);
    expect(mp.position.x).toBeCloseTo(300);

    // Update another 0.5 seconds -> moves back left (x = 250)
    mp.update(0.5);
    expect(mp.position.x).toBeCloseTo(250);
    expect(mp.deltaX).toBeLessThan(0); // moving left (-50 px)
  });

  it('resets position and progress on reset()', () => {
    const mp = new MovingPlatform(data);
    mp.update(1.5);
    expect(mp.position.x).not.toBe(100);

    mp.reset();
    expect(mp.position.x).toBe(100);
    expect(mp.position.y).toBe(200);
    expect(mp.deltaX).toBe(0);
  });
});
