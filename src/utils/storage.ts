// ─────────────────────────────────────────────────────────────────────────────
// storage.ts — localStorage abstraction. Only this module touches storage.
// Entities must use EventBus → SaveSystem → this module. Never direct access.
// Source of truth: ARCHITECTURE.md §65-66, TRD.md §71, Rule 12
// ─────────────────────────────────────────────────────────────────────────────

export interface StorageAdapter {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
}

/** Production adapter backed by window.localStorage. */
export class LocalStorageAdapter implements StorageAdapter {
  get(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  set(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      console.warn('[Storage] localStorage write failed:', key);
    }
  }

  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      console.warn('[Storage] localStorage remove failed:', key);
    }
  }
}

/** In-memory adapter — used in unit tests (no real localStorage needed). */
export class MemoryStorageAdapter implements StorageAdapter {
  private _store = new Map<string, string>();

  get(key: string): string | null {
    return this._store.get(key) ?? null;
  }

  set(key: string, value: string): void {
    this._store.set(key, value);
  }

  remove(key: string): void {
    this._store.delete(key);
  }

  /** Test helper — wipe all stored data. */
  clear(): void {
    this._store.clear();
  }
}
