// ─────────────────────────────────────────────────────────────────────────────
// GameConfig.ts — Single source for all runtime-tunable values.
// Import from here; never scatter magic numbers through the codebase.
// Source of truth: ARCHITECTURE.md §115, TRD.md §80
// ─────────────────────────────────────────────────────────────────────────────

import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  GRAVITY,
  MAX_FALL_SPEED,
  MOVE_SPEED,
  ACCELERATION,
  DECELERATION,
  JUMP_VELOCITY,
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  PLAYER_START_LIVES,
  INVULNERABILITY_TIME,
  COYOTE_TIME,
  JUMP_BUFFER_TIME,
  CAMERA_SMOOTHING,
  DEATH_FREEZE_DURATION,
  RESPAWN_DELAY,
  FIXED_TIMESTEP,
  MAX_DELTA_TIME,
  MAX_PARTICLES,
} from '../data/constants.js';

export interface CanvasConfig {
  width: number;
  height: number;
}

export interface PhysicsConfig {
  gravity: number;
  maxFallSpeed: number;
  moveSpeed: number;
  acceleration: number;
  deceleration: number;
  jumpVelocity: number;
}

export interface PlayerConfig {
  width: number;
  height: number;
  startLives: number;
  invulnerabilityTime: number;
  coyoteTime: number;
  jumpBufferTime: number;
  deathFreezeDuration: number;
  respawnDelay: number;
}

export interface CameraConfig {
  smoothing: number;
}

export interface AudioConfig {
  defaultMusicVolume: number;
  defaultSfxVolume: number;
}

export interface MobileConfig {
  minTouchTargetPx: number;
}

export interface GameplayConfig {
  fixedTimestep: number;
  maxDeltaTime: number;
  maxParticles: number;
}

export interface GameConfig {
  canvas: CanvasConfig;
  physics: PhysicsConfig;
  player: PlayerConfig;
  camera: CameraConfig;
  audio: AudioConfig;
  mobile: MobileConfig;
  gameplay: GameplayConfig;
}

export const GAME_CONFIG: GameConfig = {
  canvas: {
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
  },
  physics: {
    gravity: GRAVITY,
    maxFallSpeed: MAX_FALL_SPEED,
    moveSpeed: MOVE_SPEED,
    acceleration: ACCELERATION,
    deceleration: DECELERATION,
    jumpVelocity: JUMP_VELOCITY,
  },
  player: {
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    startLives: PLAYER_START_LIVES,
    invulnerabilityTime: INVULNERABILITY_TIME,
    coyoteTime: COYOTE_TIME,
    jumpBufferTime: JUMP_BUFFER_TIME,
    deathFreezeDuration: DEATH_FREEZE_DURATION,
    respawnDelay: RESPAWN_DELAY,
  },
  camera: {
    smoothing: CAMERA_SMOOTHING,
  },
  audio: {
    defaultMusicVolume: 0.6,
    defaultSfxVolume: 0.8,
  },
  mobile: {
    minTouchTargetPx: 44,
  },
  gameplay: {
    fixedTimestep: FIXED_TIMESTEP,
    maxDeltaTime: MAX_DELTA_TIME,
    maxParticles: MAX_PARTICLES,
  },
};
