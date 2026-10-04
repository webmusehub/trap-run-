// ─────────────────────────────────────────────────────────────────────────────
// EventBus.ts — Typed, lightweight publish/subscribe event bus.
// Decouples systems so entities never call HUD/Audio/Save directly.
// Source of truth: ARCHITECTURE.md §45-46, TRD.md §116-117
// ─────────────────────────────────────────────────────────────────────────────

import type { GameEventMap } from '../data/types.js';

type EventName = keyof GameEventMap;
type EventPayload<K extends EventName> = GameEventMap[K];
type Listener<K extends EventName> = (payload: EventPayload<K>) => void;

export class EventBus {
  private _listeners: {
    [K in EventName]?: Array<Listener<K>>;
  } = {};

  /** Subscribe to an event. Returns an unsubscribe function. */
  on<K extends EventName>(event: K, listener: Listener<K>): () => void {
    if (!this._listeners[event]) {
      this._listeners[event] = [];
    }
    // TypeScript requires the cast here due to the mapped type pattern
    (this._listeners[event] as Array<Listener<K>>).push(listener);

    return () => this.off(event, listener);
  }

  /** Subscribe to an event exactly once. */
  once<K extends EventName>(event: K, listener: Listener<K>): void {
    const wrapper: Listener<K> = (payload) => {
      this.off(event, wrapper);
      listener(payload);
    };
    this.on(event, wrapper);
  }

  /** Unsubscribe a specific listener. */
  off<K extends EventName>(event: K, listener: Listener<K>): void {
    const list = this._listeners[event] as Array<Listener<K>> | undefined;
    if (!list) return;
    // The mapped-type assignment requires a cast here; TypeScript cannot
    // narrow the write side of a generic mapped type.
    (this._listeners as Record<string, unknown[]>)[event] =
      list.filter((l) => l !== listener);
  }

  /** Emit an event with its payload. */
  emit<K extends EventName>(event: K, payload: EventPayload<K>): void {
    const list = this._listeners[event] as Array<Listener<K>> | undefined;
    if (!list) return;
    // Iterate over a snapshot in case a listener unsubscribes during dispatch
    for (const listener of [...list]) {
      listener(payload);
    }
  }

  /** Remove all listeners for all events (useful for level resets). */
  clear(): void {
    this._listeners = {};
  }

  /** Remove all listeners for a single event. */
  clearEvent<K extends EventName>(event: K): void {
    delete this._listeners[event];
  }
}

// Singleton instance — every system imports this one bus.
export const eventBus = new EventBus();
