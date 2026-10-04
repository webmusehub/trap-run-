import { describe, it, expect } from 'vitest';
import { Exit } from '../src/entities/Exit.js';
import type { ExitData } from '../src/data/types.js';

describe('Exit Entity', () => {
  it('creates a real exit with correct dimensions and category', () => {
    const data: ExitData = {
      id: 'exit-1',
      x: 500,
      y: 400,
      width: 48,
      height: 50,
      type: 'real',
    };

    const exit = new Exit(data);

    expect(exit.id).toBe('exit-1');
    expect(exit.category).toBe('EXIT');
    expect(exit.exitType).toBe('real');
    expect(exit.position.x).toBe(500);
    expect(exit.position.y).toBe(400);
    expect(exit.width).toBe(48);
    expect(exit.height).toBe(50);
    expect(exit.active).toBe(true);
  });

  it('returns valid bounding box for collision detection', () => {
    const data: ExitData = {
      id: 'exit-2',
      x: 1000,
      y: 500,
      width: 48,
      height: 50,
      type: 'real',
    };

    const exit = new Exit(data);
    const bounds = exit.getBounds();

    expect(bounds).toEqual({
      x: 1000,
      y: 500,
      width: 48,
      height: 50,
    });
  });
});
