// ─────────────────────────────────────────────────────────────────────────────
// level1.ts — Level 1: "First Steps"
// Purpose: Teach basic movement and jumping. No complex traps.
// Source of truth: LEVEL_DESIGN.md §27, PRD §19, GDD §27
// ─────────────────────────────────────────────────────────────────────────────

import type { LevelData } from '../../data/types.js';

const level1: LevelData = {
  id: 1,
  name: 'First Steps',
  width: 3000,
  height: 720,
  targetTime: 45,
  spawn: { x: 120, y: 560 },

  platforms: [
    { id: 'l1-p1', x: 0,    y: 630, width: 600, height: 30 },
    { id: 'l1-p2', x: 720,  y: 630, width: 500, height: 30 },
    { id: 'l1-p3', x: 1320, y: 540, width: 300, height: 20 },
    { id: 'l1-p4', x: 1720, y: 630, width: 500, height: 30 },
    { id: 'l1-p5', x: 2320, y: 560, width: 680, height: 30 },

    { id: 'wall-left',  x: -30,  y: 0, width: 30, height: 720 },
    { id: 'wall-right', x: 3000, y: 0, width: 30, height: 720 },
  ],

  hazards: [
    // Simple static spike group to introduce hazard visual
    { id: 'l1-spike-1', type: 'static-spike', x: 950, y: 600, width: 64, height: 30 },
  ],

  coins: [
    { id: 'l1-coin-1', x: 350,  y: 570 },
    { id: 'l1-coin-2', x: 800,  y: 570 },
    { id: 'l1-coin-3', x: 1450, y: 480 },
    { id: 'l1-coin-4', x: 1950, y: 570 },
    { id: 'l1-coin-5', x: 2500, y: 500 },
  ],

  checkpoints: [],

  exits: [
    { id: 'l1-exit-real', x: 2800, y: 510, width: 48, height: 50, type: 'real' },
  ],
};

export default level1;
