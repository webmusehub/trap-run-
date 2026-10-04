// ─────────────────────────────────────────────────────────────────────────────
// level7.ts — Level 7: "Timing"
// Purpose: Introduce moving spikes / sawblades and precision timing windows (150–250ms).
// Source of truth: LEVEL_DESIGN.md §33, PRD §19, GDD §33
// ─────────────────────────────────────────────────────────────────────────────

import type { LevelData } from '../../data/types.js';

const level7: LevelData = {
  id: 7,
  name: 'Timing',
  width: 5000,
  height: 720,
  targetTime: 120,
  spawn: { x: 120, y: 560 },

  platforms: [
    { id: 'l7-p1', x: 0,    y: 630, width: 500, height: 30 },
    { id: 'l7-p2', x: 1200, y: 630, width: 500, height: 30 },
    { id: 'l7-p3', x: 2300, y: 630, width: 500, height: 30 },
    { id: 'l7-p4', x: 3600, y: 630, width: 500, height: 30 },
    { id: 'l7-p-step', x: 4310, y: 560, width: 70, height: 20 },
    { id: 'l7-p5', x: 4400, y: 550, width: 600, height: 30 },

    { id: 'wall-left',  x: -30,  y: 0, width: 30, height: 720 },
    { id: 'wall-right', x: 5000, y: 0, width: 30, height: 720 },
  ],

  movingPlatforms: [
    {
      id: 'l7-mov-1',
      x: 550,
      y: 630,
      width: 140,
      height: 20,
      movement: { startX: 550, startY: 630, endX: 880, endY: 630, speed: 130, mode: 'ping-pong' },
    },
    // Moving platform to bridge gap between l7-p2 and l7-p3
    {
      id: 'l7-mov-1b',
      x: 1750,
      y: 630,
      width: 140,
      height: 20,
      movement: { startX: 1750, startY: 630, endX: 1950, endY: 630, speed: 130, mode: 'ping-pong' },
    },
    {
      id: 'l7-mov-2',
      x: 2850,
      y: 630,
      width: 140,
      height: 20,
      movement: { startX: 2850, startY: 630, endX: 3200, endY: 630, speed: 140, mode: 'ping-pong' },
    },
  ],

  fallingPlatforms: [
    { id: 'l7-fall-1', x: 1040, y: 630, width: 140, height: 20, triggerDelay: 500, shakeDuration: 200, fallSpeed: 600, resetOnDeath: true },
    // Falling platform to checkpoint platform l7-p3
    { id: 'l7-fall-1b', x: 2120, y: 630, width: 140, height: 20, triggerDelay: 500, shakeDuration: 200, fallSpeed: 600, resetOnDeath: true },
    { id: 'l7-fall-2', x: 3400, y: 630, width: 140, height: 20, triggerDelay: 500, shakeDuration: 200, fallSpeed: 600, resetOnDeath: true },
    // Falling platform to final climb
    { id: 'l7-fall-3', x: 4150, y: 590, width: 140, height: 20, triggerDelay: 500, shakeDuration: 200, fallSpeed: 600, resetOnDeath: true },
  ],

  hazards: [
    { id: 'l7-spike-1', type: 'static-spike', x: 1300, y: 600, width: 96, height: 30 },

    // Moving Sawblades (deterministic A ↔ B paths)
    {
      id: 'l7-spike-mov-1',
      type: 'moving-spike',
      x: 1450,
      y: 598,
      width: 32,
      height: 32,
      properties: { startX: 1450, startY: 598, endX: 1650, endY: 598, speed: 150 },
    },
    {
      id: 'l7-spike-mov-2',
      type: 'moving-spike',
      x: 2500,
      y: 598,
      width: 32,
      height: 32,
      properties: { startX: 2500, startY: 598, endX: 2750, endY: 598, speed: 160 },
    },
    {
      id: 'l7-spike-mov-3',
      type: 'moving-spike',
      x: 3750,
      y: 598,
      width: 32,
      height: 32,
      properties: { startX: 3750, startY: 598, endX: 4000, endY: 598, speed: 170 },
    },
  ],

  coins: [
    { id: 'l7-coin-1',  x: 300,  y: 570 },
    { id: 'l7-coin-2',  x: 700,  y: 570 },
    { id: 'l7-coin-3',  x: 990,  y: 570 },
    { id: 'l7-coin-4',  x: 1350, y: 570 },
    { id: 'l7-coin-5',  x: 1550, y: 530 },
    { id: 'l7-coin-6',  x: 2400, y: 540 },
    { id: 'l7-coin-7',  x: 2625, y: 530 },
    { id: 'l7-coin-8',  x: 3050, y: 570 },
    { id: 'l7-coin-9',  x: 3875, y: 530 },
    { id: 'l7-coin-10', x: 4600, y: 490 },
  ],

  checkpoints: [
    { id: 'l7-cp-1', x: 2400, y: 582, width: 24, height: 48 },
  ],

  exits: [
    { id: 'l7-exit-real', x: 4800, y: 500, width: 48, height: 50, type: 'real' },
  ],
};

export default level7;
