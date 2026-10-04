// ─────────────────────────────────────────────────────────────────────────────
// math.test.ts — Unit tests for Vector2, Rect, and scalar math utilities.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest';
import {
  clamp, lerp, sign, approach,
  vec2, vec2Add, vec2Sub, vec2Scale, vec2Length,
  vec2Normalize, vec2Distance, vec2Lerp,
  rectsOverlap, rectCenter, entityRect,
} from '../src/utils/math.js';

describe('clamp', () => {
  it('clamps below min', () => expect(clamp(-5, 0, 10)).toBe(0));
  it('clamps above max', () => expect(clamp(15, 0, 10)).toBe(10));
  it('leaves value in range', () => expect(clamp(5, 0, 10)).toBe(5));
  it('handles equal min/max', () => expect(clamp(3, 5, 5)).toBe(5));
});

describe('lerp', () => {
  it('returns a at t=0', () => expect(lerp(0, 100, 0)).toBe(0));
  it('returns b at t=1', () => expect(lerp(0, 100, 1)).toBe(100));
  it('returns midpoint at t=0.5', () => expect(lerp(0, 100, 0.5)).toBe(50));
  it('clamps t above 1', () => expect(lerp(0, 100, 2)).toBe(100));
  it('clamps t below 0', () => expect(lerp(0, 100, -1)).toBe(0));
});

describe('sign', () => {
  it('returns 1 for positive', () => expect(sign(5)).toBe(1));
  it('returns -1 for negative', () => expect(sign(-3)).toBe(-1));
  it('returns 0 for zero', () => expect(sign(0)).toBe(0));
});

describe('approach', () => {
  it('moves toward target', () => expect(approach(0, 10, 3)).toBe(3));
  it('does not overshoot', () => expect(approach(8, 10, 5)).toBe(10));
  it('works in negative direction', () => expect(approach(0, -10, 3)).toBe(-3));
});

describe('vec2', () => {
  it('creates a vector', () => expect(vec2(3, 4)).toEqual({ x: 3, y: 4 }));
});

describe('vec2Add', () => {
  it('adds two vectors', () =>
    expect(vec2Add({ x: 1, y: 2 }, { x: 3, y: 4 })).toEqual({ x: 4, y: 6 }));
});

describe('vec2Sub', () => {
  it('subtracts two vectors', () =>
    expect(vec2Sub({ x: 5, y: 7 }, { x: 2, y: 3 })).toEqual({ x: 3, y: 4 }));
});

describe('vec2Scale', () => {
  it('scales a vector', () =>
    expect(vec2Scale({ x: 2, y: 3 }, 4)).toEqual({ x: 8, y: 12 }));
});

describe('vec2Length', () => {
  it('calculates length of 3-4-5 triangle', () =>
    expect(vec2Length({ x: 3, y: 4 })).toBeCloseTo(5));
  it('returns 0 for zero vector', () =>
    expect(vec2Length({ x: 0, y: 0 })).toBe(0));
});

describe('vec2Normalize', () => {
  it('returns unit vector', () => {
    const n = vec2Normalize({ x: 3, y: 4 });
    expect(n.x).toBeCloseTo(0.6);
    expect(n.y).toBeCloseTo(0.8);
  });
  it('handles zero vector without NaN', () =>
    expect(vec2Normalize({ x: 0, y: 0 })).toEqual({ x: 0, y: 0 }));
});

describe('vec2Distance', () => {
  it('computes distance between two points', () =>
    expect(vec2Distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBeCloseTo(5));
});

describe('vec2Lerp', () => {
  it('interpolates between two vectors', () => {
    const r = vec2Lerp({ x: 0, y: 0 }, { x: 10, y: 20 }, 0.5);
    expect(r.x).toBe(5);
    expect(r.y).toBe(10);
  });
});

describe('rectsOverlap', () => {
  const a = entityRect(0, 0, 10, 10);

  it('detects overlap', () =>
    expect(rectsOverlap(a, entityRect(5, 5, 10, 10))).toBe(true));
  it('detects no overlap (right side)', () =>
    expect(rectsOverlap(a, entityRect(11, 0, 10, 10))).toBe(false));
  it('detects no overlap (below)', () =>
    expect(rectsOverlap(a, entityRect(0, 11, 10, 10))).toBe(false));
  it('touching edges = no overlap', () =>
    expect(rectsOverlap(a, entityRect(10, 0, 10, 10))).toBe(false));
  it('contained rect overlaps', () =>
    expect(rectsOverlap(a, entityRect(2, 2, 4, 4))).toBe(true));
});

describe('rectCenter', () => {
  it('returns correct center', () =>
    expect(rectCenter({ x: 0, y: 0, width: 10, height: 20 })).toEqual({ x: 5, y: 10 }));
});
