// ─────────────────────────────────────────────────────────────────────────────
// level4.ts — Level 4: "Falling Platforms"
// Purpose: Introduce collapsing/falling platforms (500ms delay, 200ms shake).
// Source of truth: LEVEL_DESIGN.md §30, PRD §19, GDD §30
// ─────────────────────────────────────────────────────────────────────────────

import type { LevelData } from '../../data/types.js';

const level4: LevelData = {
  id: 4,
  name: 'Falling Platforms',
  width: 4200,
  height: 720,
  targetTime: 90,
  spawn: { x: 120, y: 560 },

  platforms: [
    { id: 'l4-p1', x: 0,    y: 630, width: 500, height: 30 },
    { id: 'l4-p2', x: 1300, y: 630, width: 300, height: 30 },
    { id: 'l4-p3', x: 1900, y: 630, width: 400, height: 30 },
    { id: 'l4-p4', x: 2900, y: 630, width: 350, height: 30 },
    { id: 'l4-p5', x: 3600, y: 550, width: 600, height: 30 },

    { id: 'wall-left',  x: -30,  y: 0, width: 30, height: 720 },
    { id: 'wall-right', x: 4200, y: 0, width: 30, height: 720 },
  ],

  movingPlatforms: [
    {
      id: 'l4-mov-1',
      x: 880,
      y: 630,
      width: 140,
      height: 20,
      movement: { startX: 880, startY: 630, endX: 1150, endY: 630, speed: 130, mode: 'ping-pong' },
    },
  ],

  fallingPlatforms: [
    // Sequence of falling platforms across first major pit
    { id: 'l4-fall-1', x: 550, y: 630, width: 130, height: 20, triggerDelay: 500, shakeDuration: 200, fallSpeed: 600, resetOnDeath: true },
    { id: 'l4-fall-2', x: 720, y: 630, width: 130, height: 20, triggerDelay: 500, shakeDuration: 200, fallSpeed: 600, resetOnDeath: true },
    // Falling platform to checkpoint platform
    { id: 'l4-fall-2b', x: 1680, y: 630, width: 140, height: 20, triggerDelay: 500, shakeDuration: 200, fallSpeed: 600, resetOnDeath: true },
    // Falling platform bridge after checkpoint
    { id: 'l4-fall-3', x: 2400, y: 630, width: 140, height: 20, triggerDelay: 500, shakeDuration: 200, fallSpeed: 600, resetOnDeath: true },
    { id: 'l4-fall-4', x: 2600, y: 630, width: 140, height: 20, triggerDelay: 500, shakeDuration: 200, fallSpeed: 600, resetOnDeath: true },
    // Falling platform to final exit platform
    { id: 'l4-fall-5', x: 3350, y: 590, width: 150, height: 20, triggerDelay: 500, shakeDuration: 200, fallSpeed: 600, resetOnDeath: true },
  ],

  hazards: [
    { id: 'l4-spike-1', type: 'static-spike', x: 1400, y: 600, width: 96, height: 30 },
    { id: 'l4-spike-2', type: 'static-spike', x: 2050, y: 600, width: 96, height: 30 },
    { id: 'l4-spike-3', type: 'static-spike', x: 3000, y: 600, width: 96, height: 30 },
  ],

  coins: [
    { id: 'l4-coin-1', x: 300,  y: 570 },
    { id: 'l4-coin-2', x: 610,  y: 570 },
    { id: 'l4-coin-3', x: 780,  y: 570 },
    { id: 'l4-coin-4', x: 1450, y: 570 },
    { id: 'l4-coin-5', x: 2000, y: 540 },
    { id: 'l4-coin-6', x: 2470, y: 570 },
    { id: 'l4-coin-7', x: 2670, y: 570 },
    { id: 'l4-coin-8', x: 3800, y: 490 },
  ],

  checkpoints: [
    { id: 'l4-cp-1', x: 2000, y: 582, width: 24, height: 48 },
  ],

  exits: [
    { id: 'l4-exit-real', x: 4000, y: 500, width: 48, height: 50, type: 'real' },
  ],
};

export default level4;
