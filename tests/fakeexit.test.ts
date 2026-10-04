import { describe, it, expect } from 'vitest';
import { FakeExit } from '../src/entities/FakeExit.js';
import type { ExitData } from '../src/data/types.js';

describe('FakeExit Entity', () => {
  const data: ExitData = {
    id: 'fake-exit-1',
    x: 800,
    y: 500,
    width: 48,
    height: 50,
    type: 'fake',
  };

  it('creates a fake exit entity with EXIT category', () => {
    const fe = new FakeExit(data);
    expect(fe.id).toBe('fake-exit-1');
    expect(fe.category).toBe('EXIT');
    expect(fe.exitType).toBe('fake');
    expect(fe.triggered).toBe(false);
  });

  it('triggers when interacted with', () => {
    const fe = new FakeExit(data);
    fe.trigger();
    expect(fe.triggered).toBe(true);
  });

  it('resets triggered state on reset()', () => {
    const fe = new FakeExit(data);
    fe.trigger();

    fe.reset();
    expect(fe.triggered).toBe(false);
    expect(fe.active).toBe(true);
  });
});
