import { describe, it, expect } from 'vitest';
import { FallingPlatform } from '../src/entities/FallingPlatform.js';
import type { FallingPlatformData } from '../src/data/types.js';

describe('FallingPlatform Entity', () => {
  const data: FallingPlatformData = {
    id: 'fall-1',
    x: 200,
    y: 300,
    width: 140,
    height: 20,
    triggerDelay: 500,  // ms
    shakeDuration: 200, // ms
    fallSpeed: 600,     // px/s
    resetOnDeath: true,
  };

  it('starts in idle state and solid', () => {
    const fp = new FallingPlatform(data);
    expect(fp.trapState).toBe('idle');
    expect(fp.isSolid).toBe(true);
  });

  it('transitions to triggered state when player lands', () => {
    const fp = new FallingPlatform(data);
    fp.onPlayerLand();
    expect(fp.trapState).toBe('triggered');
    expect(fp.isSolid).toBe(true);
  });

  it('shakes during warning phase and falls after trigger delay', () => {
    const fp = new FallingPlatform(data);
    fp.onPlayerLand();

    // Advance 0.35s (350ms) -> warning phase (300ms to 500ms window)
    fp.update(0.35);
    expect(fp.trapState).toBe('warning');

    // Advance another 0.2s (total 550ms) -> active falling phase
    fp.update(0.2);
    expect(fp.trapState).toBe('active');
    expect(fp.isSolid).toBe(false);
    expect(fp.position.y).toBeGreaterThan(300);
  });

  it('resets position and solid state on reset()', () => {
    const fp = new FallingPlatform(data);
    fp.onPlayerLand();
    fp.update(1.0); // fell down

    fp.reset();
    expect(fp.trapState).toBe('idle');
    expect(fp.isSolid).toBe(true);
    expect(fp.position.y).toBe(300);
  });
});
