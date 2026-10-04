// ─────────────────────────────────────────────────────────────────────────────
// level5.ts — Level 5: "Trust Nothing"
// Purpose: Introduce the signature Fake Exit mechanic.
// Source of truth: LEVEL_DESIGN.md §31, PRD §19, GDD §31
// ─────────────────────────────────────────────────────────────────────────────

import type { LevelData } from '../../data/types.js';

const level5: LevelData = {
  id: 5,
  name: 'Trust Nothing',
  width: 4500,
  height: 720,
  targetTime: 100,
  spawn: { x: 120, y: 560 },

  platforms: [
    { id: 'l5-p1', x: 0,    y: 630, width: 500, height: 30 },
    { id: 'l5-p2', x: 1200, y: 630, width: 350, height: 30 },
    { id: 'l5-p3', x: 2100, y: 630, width: 450, height: 30 },
    // Platform leading to Fake Exit
    { id: 'l5-p-fake', x: 3000, y: 520, width: 250, height: 20 },
    // Platform leading past Fake Exit to Real Exit
    { id: 'l5-p-real', x: 3500, y: 630, width: 300, height: 30 },
    // Stepping brick platform to climb up to end platform
    { id: 'l5-p-step', x: 3810, y: 575, width: 70, height: 20 },
    { id: 'l5-p-end',  x: 3900, y: 520, width: 600, height: 20 },

    { id: 'wall-left',  x: -30,  y: 0, width: 30, height: 720 },
    { id: 'wall-right', x: 4500, y: 0, width: 30, height: 720 },
  ],

  movingPlatforms: [
    {
      id: 'l5-mov-1',
      x: 550,
      y: 630,
      width: 140,
      height: 20,
      movement: { startX: 550, startY: 630, endX: 850, endY: 630, speed: 130, mode: 'ping-pong' },
    },
    // Moving platform to upper fake exit platform
    {
      id: 'l5-mov-2',
      x: 2600,
      y: 630,
      width: 140,
      height: 20,
      movement: { startX: 2600, startY: 630, endX: 2850, endY: 520, speed: 120, mode: 'ping-pong' },
    },
    // Upper crossing route past the fake exit to real exit platform
    {
      id: 'l5-mov-3',
      x: 3270,
      y: 540,
      width: 140,
      height: 20,
      movement: { startX: 3270, startY: 540, endX: 3430, endY: 600, speed: 120, mode: 'ping-pong' },
    },
  ],

  fallingPlatforms: [
    { id: 'l5-fall-1', x: 920,  y: 630, width: 140, height: 20, triggerDelay: 500, shakeDuration: 200, fallSpeed: 600, resetOnDeath: true },
    { id: 'l5-fall-2', x: 1650, y: 630, width: 140, height: 20, triggerDelay: 500, shakeDuration: 200, fallSpeed: 600, resetOnDeath: true },
    { id: 'l5-fall-3', x: 1850, y: 630, width: 140, height: 20, triggerDelay: 500, shakeDuration: 200, fallSpeed: 600, resetOnDeath: true },
    // Lower alternate crossing route directly to real exit platform
    { id: 'l5-fall-4', x: 2900, y: 630, width: 140, height: 20, triggerDelay: 500, shakeDuration: 200, fallSpeed: 600, resetOnDeath: true },
    { id: 'l5-fall-5', x: 3150, y: 630, width: 140, height: 20, triggerDelay: 500, shakeDuration: 200, fallSpeed: 600, resetOnDeath: true },
  ],

  hazards: [
    { id: 'l5-spike-1', type: 'static-spike', x: 1300, y: 600, width: 96, height: 30 },
    { id: 'l5-spike-2', type: 'static-spike', x: 2250, y: 600, width: 96, height: 30 },
  ],

  coins: [
    { id: 'l5-coin-1',  x: 300,  y: 570 },
    { id: 'l5-coin-2',  x: 700,  y: 570 },
    { id: 'l5-coin-3',  x: 990,  y: 570 },
    { id: 'l5-coin-4',  x: 1350, y: 570 },
    { id: 'l5-coin-5',  x: 1750, y: 570 },
    { id: 'l5-coin-6',  x: 2200, y: 540 },
    { id: 'l5-coin-7',  x: 2720, y: 530 },
    { id: 'l5-coin-8',  x: 3120, y: 460 }, // coin teasing the fake exit route
    { id: 'l5-coin-9',  x: 3650, y: 570 },
    { id: 'l5-coin-10', x: 4100, y: 460 },
  ],

  checkpoints: [
    { id: 'l5-cp-1', x: 2200, y: 582, width: 24, height: 48 },
  ],

  exits: [
    { id: 'exit-fake-l5', x: 3100, y: 470, width: 48, height: 50, type: 'fake' },
    { id: 'exit-real-l5', x: 4300, y: 470, width: 48, height: 50, type: 'real' },
  ],
};

export default level5;
