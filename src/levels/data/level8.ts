// ─────────────────────────────────────────────────────────────────────────────
// level8.ts — Level 8: "Everything Is a Trap"
// Purpose: First major combined trap gauntlet integrating all core trap mechanics.
// Structure: START -> SPIKES -> MOVING PLATFORM -> FALLING PLATFORM -> CHECKPOINT -> HIDDEN SPIKES -> TIMING SECTION -> FAKE EXIT -> REAL EXIT
// Source of truth: LEVEL_DESIGN.md §34, PRD §19, GDD §34
// ─────────────────────────────────────────────────────────────────────────────

import type { LevelData } from '../../data/types.js';

const level8: LevelData = {
  id: 8,
  name: 'Everything Is a Trap',
  width: 5500,
  height: 720,
  targetTime: 140,
  spawn: { x: 120, y: 560 },

  platforms: [
    { id: 'l8-p1', x: 0,    y: 630, width: 500, height: 30 },
    { id: 'l8-p2', x: 1100, y: 630, width: 400, height: 30 },
    { id: 'l8-p3', x: 2500, y: 630, width: 500, height: 30 },
    { id: 'l8-p4', x: 3700, y: 630, width: 500, height: 30 },
    { id: 'l8-p-fake', x: 4400, y: 520, width: 250, height: 20 },
    { id: 'l8-p-end',  x: 4800, y: 550, width: 700, height: 30 },

    { id: 'wall-left',  x: -30,  y: 0, width: 30, height: 720 },
    { id: 'wall-right', x: 5500, y: 0, width: 30, height: 720 },
  ],

  movingPlatforms: [
    {
      id: 'l8-mov-1',
      x: 550,
      y: 630,
      width: 140,
      height: 20,
      movement: { startX: 550, startY: 630, endX: 950, endY: 630, speed: 130, mode: 'ping-pong' },
    },
    {
      id: 'l8-mov-2',
      x: 3050,
      y: 630,
      width: 140,
      height: 20,
      movement: { startX: 3050, startY: 630, endX: 3400, endY: 630, speed: 140, mode: 'ping-pong' },
    },
    {
      id: 'l8-mov-3',
      x: 4220,
      y: 560,
      width: 140,
      height: 20,
      movement: { startX: 4220, startY: 560, endX: 4350, endY: 530, speed: 130, mode: 'ping-pong' },
    },
  ],

  fallingPlatforms: [
    { id: 'l8-fall-1', x: 1550, y: 630, width: 140, height: 20, triggerDelay: 500, shakeDuration: 200, fallSpeed: 600, resetOnDeath: true },
    { id: 'l8-fall-2', x: 1730, y: 630, width: 140, height: 20, triggerDelay: 500, shakeDuration: 200, fallSpeed: 600, resetOnDeath: true },
    { id: 'l8-fall-3', x: 1910, y: 630, width: 140, height: 20, triggerDelay: 500, shakeDuration: 200, fallSpeed: 600, resetOnDeath: true },
    // 2 additional falling platforms to reach checkpoint platform
    { id: 'l8-fall-4', x: 2090, y: 630, width: 140, height: 20, triggerDelay: 500, shakeDuration: 200, fallSpeed: 600, resetOnDeath: true },
    { id: 'l8-fall-5', x: 2270, y: 630, width: 140, height: 20, triggerDelay: 500, shakeDuration: 200, fallSpeed: 600, resetOnDeath: true },
    { id: 'l8-fall-6', x: 3550, y: 630, width: 140, height: 20, triggerDelay: 500, shakeDuration: 200, fallSpeed: 600, resetOnDeath: true },
    { id: 'l8-fall-7', x: 4660, y: 530, width: 120, height: 20, triggerDelay: 500, shakeDuration: 200, fallSpeed: 600, resetOnDeath: true },
  ],

  hazards: [
    { id: 'l8-spike-1', type: 'static-spike', x: 1200, y: 600, width: 96, height: 30 },

    // Hidden spikes in section after checkpoint
    {
      id: 'l8-spike-hidden-1',
      type: 'hidden-spike',
      x: 2750,
      y: 600,
      width: 64,
      height: 30,
      properties: { triggerDistance: 120, warningDuration: 250, riseDuration: 150 },
    },

    // Moving sawblade hazard
    {
      id: 'l8-spike-mov-1',
      type: 'moving-spike',
      x: 3850,
      y: 598,
      width: 32,
      height: 32,
      properties: { startX: 3850, startY: 598, endX: 4100, endY: 598, speed: 160 },
    },
  ],

  coins: [
    { id: 'l8-coin-1',  x: 250,  y: 570 },
    { id: 'l8-coin-2',  x: 700,  y: 570 },
    { id: 'l8-coin-3',  x: 1250, y: 570 },
    { id: 'l8-coin-4',  x: 1650, y: 570 },
    { id: 'l8-coin-5',  x: 1850, y: 570 },
    { id: 'l8-coin-6',  x: 2600, y: 540 },
    { id: 'l8-coin-7',  x: 2780, y: 530 },
    { id: 'l8-coin-8',  x: 3400, y: 570 },
    { id: 'l8-coin-9',  x: 3975, y: 530 },
    { id: 'l8-coin-10', x: 4520, y: 460 },
    { id: 'l8-coin-11', x: 4950, y: 490 },
    { id: 'l8-coin-12', x: 5200, y: 490 },
  ],

  checkpoints: [
    { id: 'l8-cp-1', x: 2600, y: 582, width: 24, height: 48 },
  ],

  exits: [
    { id: 'exit-fake-l8', x: 4500, y: 470, width: 48, height: 50, type: 'fake' },
    { id: 'exit-real-l8', x: 5300, y: 500, width: 48, height: 50, type: 'real' },
  ],
};

export default level8;
