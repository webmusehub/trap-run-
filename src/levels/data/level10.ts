// ─────────────────────────────────────────────────────────────────────────────
// level10.ts — Level 10: "The Final Run"
// Purpose: Ultimate culmination gauntlet testing full player mastery of all mechanics.
// Structure: START -> BASIC PLATFORMING -> SPIKES -> MOVING PLATFORMS -> FALLING PLATFORMS -> CHECKPOINT 1 -> HIDDEN TRAPS -> TIMING SECTION -> CHECKPOINT 2 -> TRAP COMBINATION -> FAKE EXIT -> FINAL PLATFORMING -> REAL EXIT -> VICTORY
// Source of truth: LEVEL_DESIGN.md §36, PRD §19, GDD §36
// ─────────────────────────────────────────────────────────────────────────────

import type { LevelData } from '../../data/types.js';

const level10: LevelData = {
  id: 10,
  name: 'The Final Run',
  width: 7000,
  height: 720,
  targetTime: 180,
  spawn: { x: 120, y: 560 },

  platforms: [
    // Phase 1: Basic platforming & Spikes
    { id: 'l10-p1', x: 0,    y: 630, width: 600, height: 30 },
    { id: 'l10-p2', x: 1200, y: 630, width: 500, height: 30 },

    // Checkpoint 1 Platform
    { id: 'l10-p3', x: 2100, y: 630, width: 450, height: 30 },

    // Phase 2: Hidden Traps & Timing
    { id: 'l10-p4', x: 3100, y: 630, width: 500, height: 30 },

    // Checkpoint 2 Platform
    { id: 'l10-p5', x: 4400, y: 630, width: 450, height: 30 },

    // Phase 3: Trap Combination & Fake Exit Platform
    { id: 'l10-p-fake', x: 5700, y: 520, width: 250, height: 20 },

    // Phase 4: Final Platforming & Real Exit Ground
    { id: 'l10-p-end',  x: 6200, y: 550, width: 800, height: 30 },

    { id: 'wall-left',  x: -30,  y: 0, width: 30, height: 720 },
    { id: 'wall-right', x: 7000, y: 0, width: 30, height: 720 },
  ],

  movingPlatforms: [
    // Phase 1 Moving Platform
    {
      id: 'l10-mov-1',
      x: 550,
      y: 630,
      width: 140,
      height: 20,
      movement: { startX: 550, startY: 630, endX: 880, endY: 630, speed: 130, mode: 'ping-pong' },
    },
    // Phase 2 Moving Platform
    {
      id: 'l10-mov-2',
      x: 2600,
      y: 630,
      width: 140,
      height: 20,
      movement: { startX: 2600, startY: 630, endX: 2950, endY: 630, speed: 140, mode: 'ping-pong' },
    },
    // Phase 2b Moving Platform over major gap
    {
      id: 'l10-mov-2b',
      x: 3650,
      y: 630,
      width: 140,
      height: 20,
      movement: { startX: 3650, startY: 630, endX: 3950, endY: 630, speed: 140, mode: 'ping-pong' },
    },
    // Phase 3 Moving Platform
    {
      id: 'l10-mov-3',
      x: 4900,
      y: 630,
      width: 140,
      height: 20,
      movement: { startX: 4900, startY: 630, endX: 5250, endY: 520, speed: 140, mode: 'ping-pong' },
    },
    // Phase 4 Final Moving Platform
    {
      id: 'l10-mov-4',
      x: 5440,
      y: 520,
      width: 140,
      height: 20,
      movement: { startX: 5440, startY: 520, endX: 5650, endY: 520, speed: 130, mode: 'ping-pong' },
    },
  ],

  fallingPlatforms: [
    // Phase 1 Falling Platforms
    { id: 'l10-fall-1', x: 1040, y: 630, width: 140, height: 20, triggerDelay: 500, shakeDuration: 200, fallSpeed: 600, resetOnDeath: true },
    { id: 'l10-fall-2', x: 1750, y: 630, width: 140, height: 20, triggerDelay: 500, shakeDuration: 200, fallSpeed: 600, resetOnDeath: true },
    { id: 'l10-fall-2b', x: 1940, y: 630, width: 140, height: 20, triggerDelay: 500, shakeDuration: 200, fallSpeed: 600, resetOnDeath: true },
    // Phase 2 Falling Platform to CP 2
    { id: 'l10-fall-2c', x: 4120, y: 630, width: 140, height: 20, triggerDelay: 500, shakeDuration: 200, fallSpeed: 600, resetOnDeath: true },
    // Phase 3 Falling Platform
    { id: 'l10-fall-3', x: 6000, y: 550, width: 140, height: 20, triggerDelay: 500, shakeDuration: 200, fallSpeed: 600, resetOnDeath: true },
  ],

  hazards: [
    // Phase 1 Static Spikes
    { id: 'l10-spike-1', type: 'static-spike', x: 350, y: 600, width: 96, height: 30 },
    { id: 'l10-spike-2', type: 'static-spike', x: 1400, y: 600, width: 96, height: 30 },

    // Phase 2 Hidden Spikes
    {
      id: 'l10-spike-hidden-1',
      type: 'hidden-spike',
      x: 3300,
      y: 600,
      width: 64,
      height: 30,
      properties: { triggerDistance: 120, warningDuration: 250, riseDuration: 150 },
    },

    // Phase 2 Moving Sawblade
    {
      id: 'l10-spike-mov-1',
      type: 'moving-spike',
      x: 3800,
      y: 598,
      width: 32,
      height: 32,
      properties: { startX: 3800, startY: 598, endX: 4050, endY: 598, speed: 170 },
    },

    // Phase 3 Trigger Trap
    {
      id: 'l10-spike-hidden-trig',
      type: 'hidden-spike',
      x: 6350,
      y: 520,
      width: 64,
      height: 30,
      properties: { triggerDistance: 0, warningDuration: 200, riseDuration: 100 },
    },
    {
      id: 'l10-trig-zone-1',
      type: 'trigger-trap',
      x: 6220,
      y: 450,
      width: 80,
      height: 100,
      properties: { targetId: 'l10-spike-hidden-trig', singleUse: true },
    },
  ],

  coins: [
    { id: 'l10-coin-1',  x: 250,  y: 570 },
    { id: 'l10-coin-2',  x: 800,  y: 570 },
    { id: 'l10-coin-3',  x: 1070, y: 570 },
    { id: 'l10-coin-4',  x: 1450, y: 570 },
    { id: 'l10-coin-5',  x: 1870, y: 570 },
    { id: 'l10-coin-6',  x: 2200, y: 540 }, // CP 1 coin
    { id: 'l10-coin-7',  x: 2800, y: 570 },
    { id: 'l10-coin-8',  x: 3330, y: 530 },
    { id: 'l10-coin-9',  x: 3925, y: 530 },
    { id: 'l10-coin-10', x: 4500, y: 540 }, // CP 2 coin
    { id: 'l10-coin-11', x: 5100, y: 530 },
    { id: 'l10-coin-12', x: 5500, y: 460 },
    { id: 'l10-coin-13', x: 5820, y: 460 }, // fake exit teaser coin
    { id: 'l10-coin-14', x: 6070, y: 490 },
    { id: 'l10-coin-15', x: 6600, y: 490 },
  ],

  checkpoints: [
    { id: 'cp-l10-1', x: 2200, y: 582, width: 24, height: 48 },
    { id: 'cp-l10-2', x: 4500, y: 582, width: 24, height: 48 },
  ],

  exits: [
    { id: 'exit-fake-l10', x: 5800, y: 470, width: 48, height: 50, type: 'fake' },
    { id: 'exit-real-l10', x: 6800, y: 500, width: 48, height: 50, type: 'real' },
  ],
};

export default level10;
