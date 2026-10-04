// ─────────────────────────────────────────────────────────────────────────────
// level6.ts — Level 6: "Hidden Danger"
// Purpose: Introduce subterranean hidden spikes and trigger traps.
// Source of truth: LEVEL_DESIGN.md §32, PRD §19, GDD §32
// ─────────────────────────────────────────────────────────────────────────────

import type { LevelData } from '../../data/types.js';

const level6: LevelData = {
  id: 6,
  name: 'Hidden Danger',
  width: 4800,
  height: 720,
  targetTime: 110,
  spawn: { x: 120, y: 560 },

  platforms: [
    { id: 'l6-p1', x: 0,    y: 630, width: 500, height: 30 },
    { id: 'l6-p2', x: 1200, y: 630, width: 600, height: 30 },
    { id: 'l6-p3', x: 2200, y: 630, width: 500, height: 30 },
    { id: 'l6-p4', x: 3400, y: 630, width: 500, height: 30 },
    { id: 'l6-p-step', x: 4110, y: 560, width: 70, height: 20 },
    { id: 'l6-p5', x: 4200, y: 550, width: 600, height: 30 },

    { id: 'wall-left',  x: -30,  y: 0, width: 30, height: 720 },
    { id: 'wall-right', x: 4800, y: 0, width: 30, height: 720 },
  ],

  movingPlatforms: [
    {
      id: 'l6-mov-1',
      x: 550,
      y: 630,
      width: 140,
      height: 20,
      movement: { startX: 550, startY: 630, endX: 1050, endY: 630, speed: 130, mode: 'ping-pong' },
    },
    {
      id: 'l6-mov-2',
      x: 2800,
      y: 630,
      width: 140,
      height: 20,
      movement: { startX: 2800, startY: 630, endX: 3250, endY: 630, speed: 130, mode: 'ping-pong' },
    },
  ],

  fallingPlatforms: [
    // Bridge gap between l6-p2 and l6-p3
    { id: 'l6-fall-1', x: 1930, y: 630, width: 140, height: 20, triggerDelay: 500, shakeDuration: 200, fallSpeed: 600, resetOnDeath: true },
    // Bridge gap between l6-p4 and l6-p5
    { id: 'l6-fall-2', x: 3950, y: 590, width: 140, height: 20, triggerDelay: 500, shakeDuration: 200, fallSpeed: 600, resetOnDeath: true },
  ],

  hazards: [
    { id: 'l6-spike-1', type: 'static-spike', x: 1300, y: 600, width: 96, height: 30 },

    // Hidden Spikes (with 250ms warning clue per fairness rules)
    {
      id: 'l6-spike-hidden-1',
      type: 'hidden-spike',
      x: 1550,
      y: 600,
      width: 64,
      height: 30,
      properties: { triggerDistance: 120, warningDuration: 250, riseDuration: 150 },
    },
    {
      id: 'l6-spike-hidden-2',
      type: 'hidden-spike',
      x: 2500,
      y: 600,
      width: 64,
      height: 30,
      properties: { triggerDistance: 120, warningDuration: 250, riseDuration: 150 },
    },
    {
      id: 'l6-spike-hidden-trig',
      type: 'hidden-spike',
      x: 3700,
      y: 600,
      width: 64,
      height: 30,
      properties: { triggerDistance: 0, warningDuration: 200, riseDuration: 100 },
    },

    // Trigger Zone linked to l6-spike-hidden-trig
    {
      id: 'l6-trig-zone-1',
      type: 'trigger-trap',
      x: 3550,
      y: 530,
      width: 80,
      height: 100,
      properties: { targetId: 'l6-spike-hidden-trig', singleUse: true },
    },
  ],

  coins: [
    { id: 'l6-coin-1',  x: 300,  y: 570 },
    { id: 'l6-coin-2',  x: 700,  y: 570 },
    { id: 'l6-coin-3',  x: 1350, y: 570 },
    { id: 'l6-coin-4',  x: 1580, y: 530 },
    { id: 'l6-coin-5',  x: 2300, y: 540 },
    { id: 'l6-coin-6',  x: 2530, y: 530 },
    { id: 'l6-coin-7',  x: 2950, y: 570 },
    { id: 'l6-coin-8',  x: 3590, y: 530 },
    { id: 'l6-coin-9',  x: 3730, y: 530 },
    { id: 'l6-coin-10', x: 4400, y: 490 },
  ],

  checkpoints: [
    { id: 'l6-cp-1', x: 2300, y: 582, width: 24, height: 48 },
  ],

  exits: [
    { id: 'l6-exit-real', x: 4600, y: 500, width: 48, height: 50, type: 'real' },
  ],
};

export default level6;
