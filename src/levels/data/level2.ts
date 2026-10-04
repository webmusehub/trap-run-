// ─────────────────────────────────────────────────────────────────────────────
// level2.ts — Level 2: "Spikes"
// Purpose: Teach hazard recognition and precise jumping over static spikes.
// Source of truth: LEVEL_DESIGN.md §28, PRD §19, GDD §28
// ─────────────────────────────────────────────────────────────────────────────

import type { LevelData } from '../../data/types.js';

const level2: LevelData = {
  id: 2,
  name: 'Spikes',
  width: 3500,
  height: 720,
  targetTime: 60,
  spawn: { x: 120, y: 560 },

  platforms: [
    { id: 'l2-p1', x: 0,    y: 630, width: 500, height: 30 },
    { id: 'l2-p2', x: 600,  y: 630, width: 450, height: 30 },
    { id: 'l2-p3', x: 1150, y: 550, width: 160, height: 20 },
    { id: 'l2-p4', x: 1400, y: 470, width: 160, height: 20 },
    { id: 'l2-p5', x: 1650, y: 630, width: 600, height: 30 },
    { id: 'l2-p6', x: 2350, y: 550, width: 250, height: 20 },
    { id: 'l2-p7', x: 2700, y: 630, width: 800, height: 30 },

    { id: 'wall-left',  x: -30,  y: 0, width: 30, height: 720 },
    { id: 'wall-right', x: 3500, y: 0, width: 30, height: 720 },
  ],

  hazards: [
    { id: 'l2-spike-1', type: 'static-spike', x: 760,  y: 600, width: 80, height: 30 },
    { id: 'l2-spike-2', type: 'static-spike', x: 1820, y: 600, width: 96, height: 30 },
    { id: 'l2-spike-3', type: 'static-spike', x: 2400, y: 520, width: 64, height: 30 },
    { id: 'l2-spike-4', type: 'static-spike', x: 2910, y: 600, width: 80, height: 30 },
  ],

  coins: [
    { id: 'l2-coin-1', x: 300,  y: 570 },
    { id: 'l2-coin-2', x: 800,  y: 530 },
    { id: 'l2-coin-3', x: 1230, y: 490 },
    { id: 'l2-coin-4', x: 1480, y: 410 },
    { id: 'l2-coin-5', x: 1860, y: 530 },
    { id: 'l2-coin-6', x: 2480, y: 470 },
    { id: 'l2-coin-7', x: 3100, y: 570 },
  ],

  checkpoints: [],

  exits: [
    { id: 'l2-exit-real', x: 3300, y: 580, width: 48, height: 50, type: 'real' },
  ],
};

export default level2;
