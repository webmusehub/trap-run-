import { describe, it, expect, beforeEach } from 'vitest';
import { SaveSystem } from '../src/systems/SaveSystem.ts';

class MockStorageAdapter {
  public store: Record<string, string> = {};
  get(key: string): string | null { return this.store[key] ?? null; }
  set(key: string, value: string): void { this.store[key] = value; }
  remove(key: string): void { delete this.store[key]; }
  clear(): void { this.store = {}; }
}

describe('SaveSystem Hardening & Corruption Recovery', () => {
  let adapter: MockStorageAdapter;

  beforeEach(() => {
    adapter = new MockStorageAdapter();
  });

  it('initializes default values when no save exists', () => {
    const saveSystem = new SaveSystem(adapter);
    const data = saveSystem.getData();
    expect(data.version).toBe(1);
    expect(data.unlockedLevels).toEqual([1]);
    expect(data.completedLevels).toEqual([]);
    expect(data.settings.music).toBe(true);
  });

  it('recovers safely from invalid JSON string', () => {
    adapter.set('trap_run_save_v1', '{corrupted_json:::123');
    const saveSystem = new SaveSystem(adapter);
    const data = saveSystem.getData();
    expect(data.version).toBe(1);
    expect(data.unlockedLevels).toEqual([1]);
  });

  it('recovers safely from non-object JSON values (string, number, array)', () => {
    adapter.set('trap_run_save_v1', JSON.stringify('im a string not an object'));
    const saveSystem = new SaveSystem(adapter);
    expect(saveSystem.getData().unlockedLevels).toEqual([1]);

    adapter.set('trap_run_save_v1', JSON.stringify([1, 2, 3]));
    const saveSystem2 = new SaveSystem(adapter);
    expect(saveSystem2.getData().unlockedLevels).toEqual([1]);
  });

  it('filters out corrupted values from unlockedLevels and map objects', () => {
    adapter.set('trap_run_save_v1', JSON.stringify({
      version: 1,
      unlockedLevels: [1, 'corrupted', null, -5, 12, 2],
      completedLevels: ['invalid', 1],
      bestTimes: { 1: 15.2, 2: -10, 3: 'NaN', 4: 25.0 },
      bestDeaths: { 1: 2, 'invalid_key': 5 },
      settings: { music: 'not_a_bool' },
    }));

    const saveSystem = new SaveSystem(adapter);
    const data = saveSystem.getData();

    expect(data.unlockedLevels).toEqual([1, 2]);
    expect(data.completedLevels).toEqual([1]);
    expect(data.bestTimes[1]).toBe(15.2);
    expect(data.bestTimes[2]).toBeUndefined(); // negative time filtered out
    expect(data.bestTimes[4]).toBe(25.0);
    expect(data.settings.music).toBe(true); // invalid boolean falls back to default true
  });
});
