// ─────────────────────────────────────────────────────────────────────────────
// level3.ts — Level 3: "Moving Platforms"
// Purpose: Introduce moving platforms (~120 px/s) and timing execution.
// Source of truth: LEVEL_DESIGN.md §29, PRD §19, GDD §29
// ─────────────────────────────────────────────────────────────────────────────

import type { LevelData } from '../../data/types.js';

const level3: LevelData = {
  id: 3,
  name: 'Moving Platforms',
  width: 4000,
  height: 720,
  targetTime: 80,
  spawn: { x: 120, y: 560 },

  platforms: [
    { id: 'l3-p1', x: 0,    y: 630, width: 500, height: 30 },
    { id: 'l3-p2', x: 1100, y: 630, width: 350, height: 30 },
    { id: 'l3-p3', x: 1700, y: 630, width: 450, height: 30 },
    { id: 'l3-p4', x: 2750, y: 630, width: 400, height: 30 },
    { id: 'l3-p5', x: 3400, y: 550, width: 600, height: 30 },

    { id: 'wall-left',  x: -30,  y: 0, width: 30, height: 720 },
    { id: 'wall-right', x: 4000, y: 0, width: 30, height: 720 },
  ],

  movingPlatforms: [
    // Horizontal moving platform over first pit
    {
      id: 'l3-mov-1',
      x: 550,
      y: 630,
      width: 140,
      height: 20,
      movement: { startX: 550, startY: 630, endX: 950, endY: 630, speed: 120, mode: 'ping-pong' },
    },
    // Horizontal moving platform over second pit (to checkpoint)
    {
      id: 'l3-mov-1b',
      x: 1470,
      y: 630,
      width: 130,
      height: 20,
      movement: { startX: 1470, startY: 630, endX: 1620, endY: 630, speed: 120, mode: 'ping-pong' },
    },
    // Vertical moving platform up to high gap
    {
      id: 'l3-mov-2',
      x: 2300,
      y: 630,
      width: 140,
      height: 20,
      movement: { startX: 2300, startY: 630, endX: 2300, endY: 450, speed: 110, mode: 'ping-pong' },
    },
    // Horizontal moving platform over upper gap
    {
      id: 'l3-mov-3',
      x: 2500,
      y: 450,
      width: 140,
      height: 20,
      movement: { startX: 2500, startY: 450, endX: 2650, endY: 450, speed: 120, mode: 'ping-pong' },
    },
    // Diagonal/horizontal moving platform over final gap to exit platform
    {
      id: 'l3-mov-4',
      x: 3170,
      y: 610,
      width: 130,
      height: 20,
      movement: { startX: 3170, startY: 610, endX: 3320, endY: 570, speed: 110, mode: 'ping-pong' },
    },
  ],

  hazards: [
    { id: 'l3-spike-1', type: 'static-spike', x: 1200, y: 600, width: 96, height: 30 },
    { id: 'l3-spike-2', type: 'static-spike', x: 1850, y: 600, width: 96, height: 30 },
    { id: 'l3-spike-3', type: 'static-spike', x: 2900, y: 600, width: 96, height: 30 },
  ],

  coins: [
    { id: 'l3-coin-1', x: 300,  y: 570 },
    { id: 'l3-coin-2', x: 750,  y: 570 },
    { id: 'l3-coin-3', x: 1300, y: 570 },
    { id: 'l3-coin-4', x: 1545, y: 570 },
    { id: 'l3-coin-5', x: 2300, y: 390 },
    { id: 'l3-coin-6', x: 2580, y: 390 },
    { id: 'l3-coin-7', x: 2950, y: 540 },
    { id: 'l3-coin-8', x: 3600, y: 490 },
  ],

  checkpoints: [
    { id: 'l3-cp-1', x: 1750, y: 582, width: 24, height: 48 },
  ],

  exits: [
    { id: 'l3-exit-real', x: 3800, y: 500, width: 48, height: 50, type: 'real' },
  ],
};

export default level3;
