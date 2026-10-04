// ─────────────────────────────────────────────────────────────────────────────
// math.ts — Generic math utilities. No gameplay-specific logic here.
// Source of truth: ARCHITECTURE.md §78-79
// ─────────────────────────────────────────────────────────────────────────────

import type { Vector2, Rect } from '../data/types.js';

// ── Scalars ──────────────────────────────────────────────────────────────────

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp(t, 0, 1);
}

export function sign(value: number): -1 | 0 | 1 {
  if (value > 0) return 1;
  if (value < 0) return -1;
  return 0;
}

/**
 * Move `current` toward `target` by at most `step` per call.
 * Does not overshoot.
 */
export function approach(current: number, target: number, step: number): number {
  const delta = target - current;
  if (Math.abs(delta) <= step) return target;
  return current + sign(delta) * step;
}

// ── Vector2 ──────────────────────────────────────────────────────────────────

export function vec2(x: number, y: number): Vector2 {
  return { x, y };
}

export function vec2Add(a: Vector2, b: Vector2): Vector2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function vec2Sub(a: Vector2, b: Vector2): Vector2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function vec2Scale(v: Vector2, s: number): Vector2 {
  return { x: v.x * s, y: v.y * s };
}

export function vec2Length(v: Vector2): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

export function vec2Normalize(v: Vector2): Vector2 {
  const len = vec2Length(v);
  if (len === 0) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

export function vec2Distance(a: Vector2, b: Vector2): number {
  return vec2Length(vec2Sub(b, a));
}

export function vec2Lerp(a: Vector2, b: Vector2, t: number): Vector2 {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
}

export function vec2Copy(v: Vector2): Vector2 {
  return { x: v.x, y: v.y };
}

export function vec2Zero(): Vector2 {
  return { x: 0, y: 0 };
}

// ── Rect / AABB ──────────────────────────────────────────────────────────────

/**
 * AABB overlap test.
 * Returns true when the two rectangles intersect (touching edges = no overlap).
 * Source of truth: ARCHITECTURE.md §29
 */
export function rectsOverlap(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export function rectContainsPoint(rect: Rect, x: number, y: number): boolean {
  return x >= rect.x && x <= rect.x + rect.width &&
         y >= rect.y && y <= rect.y + rect.height;
}

export function rectCenter(rect: Rect): Vector2 {
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
}

export function entityRect(x: number, y: number, w: number, h: number): Rect {
  return { x, y, width: w, height: h };
}
