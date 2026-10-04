// ─────────────────────────────────────────────────────────────────────────────
// level9.ts — Level 9: "Checkpoint Run"
// Purpose: Strategic checkpoint-heavy marathon combining all trap mechanics across 4 sections.
// Structure: START -> SECTION 1 -> CP 1 -> SECTION 2 -> CP 2 -> SECTION 3 -> CP 3 -> FINAL SECTION -> EXIT
// Source of truth: LEVEL_DESIGN.md §35, PRD §19, GDD §35
// ─────────────────────────────────────────────────────────────────────────────

import type { LevelData } from '../../data/types.js';

const level9: LevelData = {
  id: 9,
  name: 'Checkpoint Run',
  width: 6400,
  height: 720,
  targetTime: 160,
  spawn: { x: 120, y: 560 },

  platforms: [
    // Section 1 Ground
    { id: 'l9-p1', x: 0,    y: 630, width: 600, height: 30 },
    { id: 'l9-p2', x: 1200, y: 630, width: 500, height: 30 }, // CP 1 platform

    // Section 2 Ground
    { id: 'l9-p3', x: 2300, y: 630, width: 400, height: 30 },
    { id: 'l9-p4', x: 3100, y: 630, width: 500, height: 30 }, // CP 2 platform

    // Section 3 Ground
    { id: 'l9-p5', x: 4100, y: 630, width: 400, height: 30 },
    { id: 'l9-p6', x: 4700, y: 630, width: 400, height: 30 }, // CP 3 platform

    // Section 4 Final Ground
    { id: 'l9-p7', x: 5700, y: 550, width: 700, height: 30 },

    { id: 'wall-left',  x: -30,  y: 0, width: 30, height: 720 },
    { id: 'wall-right', x: 6400, y: 0, width: 30, height: 720 },
  ],

  movingPlatforms: [
    // Section 1 Moving Platform
    {
      id: 'l9-mov-1',
      x: 550,
      y: 630,
      width: 140,
      height: 20,
      movement: { startX: 550, startY: 630, endX: 850, endY: 630, speed: 130, mode: 'ping-pong' },
    },
    // Section 2 Moving Platform
    {
      id: 'l9-mov-2',
      x: 1750,
      y: 630,
      width: 140,
      height: 20,
      movement: { startX: 1750, startY: 630, endX: 2100, endY: 630, speed: 140, mode: 'ping-pong' },
    },
    // Section 3 Moving Platform to bridge gap from l9-p3 to l9-p4
    {
      id: 'l9-mov-2b',
      x: 2750,
      y: 630,
      width: 140,
      height: 20,
      movement: { startX: 2750, startY: 630, endX: 2950, endY: 630, speed: 130, mode: 'ping-pong' },
    },
    // Section 4 Moving Platform
    {
      id: 'l9-mov-3',
      x: 3650,
      y: 630,
      width: 140,
      height: 20,
      movement: { startX: 3650, startY: 630, endX: 3950, endY: 630, speed: 140, mode: 'ping-pong' },
    },
    // Section 5 Moving Platform to final gauntlet
    {
      id: 'l9-mov-4',
      x: 5300,
      y: 630,
      width: 140,
      height: 20,
      movement: { startX: 5300, startY: 630, endX: 5550, endY: 550, speed: 130, mode: 'ping-pong' },
    },
  ],

  fallingPlatforms: [
    // Section 1 Falling Platform
    { id: 'l9-fall-1', x: 1020, y: 630, width: 140, height: 20, triggerDelay: 500, shakeDuration: 200, fallSpeed: 600, resetOnDeath: true },
    // Section 3 Falling Platform
    { id: 'l9-fall-2', x: 4520, y: 630, width: 140, height: 20, triggerDelay: 500, shakeDuration: 200, fallSpeed: 600, resetOnDeath: true },
    // Section 4 Falling Platform
    { id: 'l9-fall-3', x: 5120, y: 630, width: 130, height: 20, triggerDelay: 500, shakeDuration: 200, fallSpeed: 600, resetOnDeath: true },
  ],

  hazards: [
    // Static spikes in Section 1
    { id: 'l9-spike-1', type: 'static-spike', x: 350, y: 600, width: 96, height: 30 },

    // Hidden spikes in Section 2
    {
      id: 'l9-spike-hidden-1',
      type: 'hidden-spike',
      x: 2500,
      y: 600,
      width: 64,
      height: 30,
      properties: { triggerDistance: 120, warningDuration: 250, riseDuration: 150 },
    },

    // Moving sawblade hazard in Section 3
    {
      id: 'l9-spike-mov-1',
      type: 'moving-spike',
      x: 4200,
      y: 598,
      width: 32,
      height: 32,
      properties: { startX: 4200, startY: 598, endX: 4400, endY: 598, speed: 160 },
    },

    // Trigger trap in Section 4
    {
      id: 'l9-spike-hidden-trig',
      type: 'hidden-spike',
      x: 5900,
      y: 520,
      width: 64,
      height: 30,
      properties: { triggerDistance: 0, warningDuration: 200, riseDuration: 100 },
    },
    {
      id: 'l9-trig-zone-1',
      type: 'trigger-trap',
      x: 5780,
      y: 450,
      width: 80,
      height: 100,
      properties: { targetId: 'l9-spike-hidden-trig', singleUse: true },
    },
  ],

  coins: [
    { id: 'l9-coin-1',  x: 250,  y: 570 },
    { id: 'l9-coin-2',  x: 800,  y: 570 },
    { id: 'l9-coin-3',  x: 1070, y: 570 },
    { id: 'l9-coin-4',  x: 1400, y: 570 },
    { id: 'l9-coin-5',  x: 1920, y: 570 },
    { id: 'l9-coin-6',  x: 2400, y: 570 },
    { id: 'l9-coin-7',  x: 2530, y: 530 },
    { id: 'l9-coin-8',  x: 3300, y: 570 },
    { id: 'l9-coin-9',  x: 3800, y: 570 },
    { id: 'l9-coin-10', x: 4300, y: 530 },
    { id: 'l9-coin-11', x: 4590, y: 570 },
    { id: 'l9-coin-12', x: 4900, y: 570 },
    { id: 'l9-coin-13', x: 5350, y: 540 },
    { id: 'l9-coin-14', x: 5850, y: 490 },
    { id: 'l9-coin-15', x: 6100, y: 490 },
  ],

  checkpoints: [
    { id: 'cp-l9-1', x: 1600, y: 582, width: 24, height: 48 },
    { id: 'cp-l9-2', x: 3200, y: 582, width: 24, height: 48 },
    { id: 'cp-l9-3', x: 4800, y: 582, width: 24, height: 48 },
  ],

  exits: [
    { id: 'l9-exit-real', x: 6200, y: 500, width: 48, height: 50, type: 'real' },
  ],
};

export default level9;
