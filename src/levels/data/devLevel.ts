// ─────────────────────────────────────────────────────────────────────────────
// devLevel.ts — Trap Systems Test Lab for Phase 3 developer verification.
// Contains distinct test sections for all Phase 3 trap & platform entities.
// Data-driven: no level-specific logic in core systems.
// Source of truth: LEVEL_DESIGN.md §2, TRD.md §42
// ─────────────────────────────────────────────────────────────────────────────

import type { LevelData } from '../../data/types.js';

const devLevel: LevelData = {
  id: 0,
  name: 'Phase 3 Trap Systems Test Lab',
  width:  5000,
  height: 720,
  spawn:  { x: 120, y: 560 },

  platforms: [
    // ── SECTION A: Spawn & Moving Platform Landing Grounds ────────────────────
    { id: 'plat-ground-start', x: 0,    y: 630, width: 700,  height: 30 },
    { id: 'plat-sec-a-landing', x: 1200, y: 630, width: 400,  height: 30 },

    // ── SECTION B: Falling Platform Test Landing ──────────────────────────────
    { id: 'plat-sec-b-landing', x: 1700, y: 630, width: 300,  height: 30 },

    // ── SECTION C: Hidden Spike Test Ground ───────────────────────────────────
    { id: 'plat-sec-c-ground',  x: 2100, y: 630, width: 500,  height: 30 },

    // ── SECTION D: Moving Spike Test Ground ───────────────────────────────────
    { id: 'plat-sec-d-ground',  x: 2700, y: 630, width: 500,  height: 30 },

    // ── SECTION E: Fake Exit Platform ─────────────────────────────────────────
    { id: 'plat-sec-e-ground',  x: 3300, y: 520, width: 300,  height: 20 },

    // ── SECTION F: Trigger Trap Ground ────────────────────────────────────────
    { id: 'plat-sec-f-ground',  x: 3700, y: 630, width: 500,  height: 30 },

    // ── SECTION G: Combined Trap & Real Exit Area ─────────────────────────────
    { id: 'plat-sec-g-start',   x: 4300, y: 630, width: 200,  height: 30 },
    { id: 'plat-sec-g-end',     x: 4700, y: 520, width: 300,  height: 20 },

    // ── World boundary walls ──────────────────────────────────────────────────
    { id: 'wall-left',  x: -30,  y: 0, width: 30, height: 720 },
    { id: 'wall-right', x: 5000, y: 0, width: 30, height: 720 },
  ],

  movingPlatforms: [
    // SECTION A: Horizontal moving platform (150 px/s ping-pong)
    {
      id: 'mov-plat-1',
      x: 720,
      y: 630,
      width: 140,
      height: 20,
      movement: {
        startX: 720,
        startY: 630,
        endX: 1060,
        endY: 630,
        speed: 150,
        mode: 'ping-pong',
      },
    },
    // SECTION G: Vertical moving platform
    {
      id: 'mov-plat-sec-g',
      x: 4450,
      y: 630,
      width: 140,
      height: 20,
      movement: {
        startX: 4450,
        startY: 630,
        endX: 4450,
        endY: 480,
        speed: 120,
        mode: 'ping-pong',
      },
    },
  ],

  fallingPlatforms: [
    // SECTION B: Falling platform (shakes 200ms, falls after 500ms)
    {
      id: 'fall-plat-1',
      x: 1450,
      y: 540,
      width: 160,
      height: 20,
      triggerDelay: 500,
      shakeDuration: 200,
      fallSpeed: 600,
      resetOnDeath: true,
    },
    // SECTION G: Falling platform in gauntlet
    {
      id: 'fall-plat-sec-g',
      x: 4610,
      y: 480,
      width: 140,
      height: 20,
      triggerDelay: 500,
      shakeDuration: 200,
      fallSpeed: 600,
      resetOnDeath: true,
    },
  ],

  hazards: [
    // Phase 2 Static Spikes
    { id: 'spike-static-1', type: 'static-spike', x: 400, y: 600, width: 32, height: 30 },

    // SECTION C: Hidden Spike (rises when player comes within 120px)
    {
      id: 'spike-hidden-1',
      type: 'hidden-spike',
      x: 2300,
      y: 600,
      width: 64,
      height: 30,
      properties: {
        triggerDistance: 120,
        warningDuration: 250,
        riseDuration: 150,
      },
    },

    // SECTION D: Moving Spike (oscillating sawblade)
    {
      id: 'spike-moving-1',
      type: 'moving-spike',
      x: 2800,
      y: 598,
      width: 32,
      height: 32,
      properties: {
        startX: 2800,
        startY: 598,
        endX: 3100,
        endY: 598,
        speed: 160,
      },
    },

    // SECTION F: Hidden spike activated by Trigger Trap
    {
      id: 'spike-hidden-trig',
      type: 'hidden-spike',
      x: 4000,
      y: 600,
      width: 64,
      height: 30,
      properties: {
        triggerDistance: 0, // activated manually by trigger zone
        warningDuration: 200,
        riseDuration: 100,
      },
    },

    // SECTION F: Trigger Zone entity
    {
      id: 'trig-zone-1',
      type: 'trigger-trap',
      x: 3850,
      y: 530,
      width: 80,
      height: 100,
      properties: {
        targetId: 'spike-hidden-trig',
        singleUse: true,
      },
    },
  ],

  coins:       [],
  checkpoints: [],

  exits: [
    // SECTION E: Fake Exit (triggers trap death when reached)
    { id: 'exit-fake-1', x: 3420, y: 470, width: 48, height: 50, type: 'fake' },

    // SECTION G: Real Exit (completes level)
    { id: 'exit-real-1', x: 4850, y: 470, width: 48, height: 50, type: 'real' },
  ],

  targetTime: 90,
};

export default devLevel;
