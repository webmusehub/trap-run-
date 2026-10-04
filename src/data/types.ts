// ─────────────────────────────────────────────────────────────────────────────
// types.ts — All shared TypeScript interfaces and enums for Trap Run.
// Source of truth: TRD.md §15-19, §41, §46, §61, §72, §77
// ─────────────────────────────────────────────────────────────────────────────

// ── Primitives ──────────────────────────────────────────────────────────────

export interface Vector2 {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ── Game State ───────────────────────────────────────────────────────────────

export type GameState =
  | 'BOOT'
  | 'LOADING'
  | 'MAIN_MENU'
  | 'LEVEL_SELECT'
  | 'LEVEL_LOADING'
  | 'PLAYING'
  | 'PAUSED'
  | 'DEAD'
  | 'RESPAWNING'
  | 'LEVEL_COMPLETE'
  | 'GAME_OVER'
  | 'VICTORY';

// ── Player ───────────────────────────────────────────────────────────────────

export type PlayerStateType =
  | 'IDLE'
  | 'RUNNING'
  | 'JUMPING'
  | 'FALLING'
  | 'LANDING'
  | 'DEAD'
  | 'RESPAWNING'
  | 'LEVEL_COMPLETE';

export type FacingDirection = 'left' | 'right';

export interface PlayerState {
  position: Vector2;
  velocity: Vector2;
  width: number;
  height: number;
  grounded: boolean;
  facing: FacingDirection;
  state: PlayerStateType;
  lives: number;
  deaths: number;
  checkpointId: string | null;
  invulnerableUntil: number;  // timestamp (ms)
  coinsCollected: number;
}

// ── Input ────────────────────────────────────────────────────────────────────

export interface InputState {
  left: boolean;
  right: boolean;
  /** true while the jump key is held down */
  jump: boolean;
  /** true only on the single frame the jump key was first pressed */
  jumpPressed: boolean;
  /** true only on the single frame pause was pressed */
  pausePressed: boolean;
  /** true only on the single frame restart was pressed */
  restartPressed: boolean;
  pause: boolean;
  restart: boolean;
  // Jump buffering: tracks if jump was pressed recently
  jumpBufferTime: number;
}

// ── Entity ───────────────────────────────────────────────────────────────────

export type EntityCategory =
  | 'PLAYER'
  | 'PLATFORM'
  | 'MOVING_PLATFORM'
  | 'FALLING_PLATFORM'
  | 'HAZARD'
  | 'COLLECTIBLE'
  | 'CHECKPOINT'
  | 'EXIT'
  | 'TRIGGER'
  | 'EFFECT';

// ── Collision ────────────────────────────────────────────────────────────────

export type CollisionType =
  | 'SOLID'
  | 'HAZARD'
  | 'TRIGGER'
  | 'COLLECTIBLE'
  | 'CHECKPOINT'
  | 'EXIT';

// ── Traps ────────────────────────────────────────────────────────────────────

export type HazardType =
  | 'static-spike'
  | 'hidden-spike'
  | 'moving-spike'
  | 'fake-exit'
  | 'trigger-trap'
  | 'falling-floor';

export type TrapState =
  | 'idle'
  | 'warning'
  | 'triggered'
  | 'activating'
  | 'active'
  | 'disabled'
  | 'resetting';

export type MovementMode = 'ping-pong' | 'loop' | 'one-way';

export type ExitType = 'real' | 'fake';

// ── Level Data ───────────────────────────────────────────────────────────────

export interface PlatformData {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  oneWay?: boolean;
}

export interface MovingPlatformData extends PlatformData {
  movement: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    speed: number;
    mode: MovementMode;
  };
}

export interface FallingPlatformData extends PlatformData {
  triggerDelay: number;   // ms before fall
  shakeDuration: number;  // ms of shake warning
  fallSpeed: number;      // px/s
  resetOnDeath: boolean;
}

export interface HazardData {
  id: string;
  type: HazardType;
  x: number;
  y: number;
  width: number;
  height: number;
  properties?: Record<string, number | boolean | string>;
}

export interface CoinData {
  id: string;
  x: number;
  y: number;
}

export interface CheckpointData {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ExitData {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: ExitType;
}

export interface LevelData {
  id: number;
  name: string;
  width: number;
  height: number;
  spawn: Vector2;
  platforms: PlatformData[];
  movingPlatforms?: MovingPlatformData[];
  fallingPlatforms?: FallingPlatformData[];
  hazards: HazardData[];
  coins: CoinData[];
  checkpoints: CheckpointData[];
  exits: ExitData[];      // array to support fake + real exits
  background?: string;
  targetTime?: number;    // seconds, for par time display
}

// ── Save Data ────────────────────────────────────────────────────────────────

export interface SaveSettings {
  music: boolean;
  sfx: boolean;
  screenShake: boolean;
}

export interface SaveData {
  version: number;
  unlockedLevels: number[];
  completedLevels: number[];
  bestTimes: Record<number, number>;
  bestDeaths: Record<number, number>;
  coins: Record<number, number>;
  settings: SaveSettings;
}

// ── Camera ───────────────────────────────────────────────────────────────────

export interface CameraState {
  position: Vector2;
  viewportWidth: number;
  viewportHeight: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

// ── Particles ────────────────────────────────────────────────────────────────

export type ParticleType =
  | 'JUMP_DUST'
  | 'COIN'
  | 'DEATH'
  | 'CHECKPOINT'
  | 'TRAP'
  | 'VICTORY';

export interface Particle {
  position: Vector2;
  velocity: Vector2;
  lifetime: number;  // seconds
  age: number;       // seconds elapsed
  size: number;
  opacity: number;
  color: string;
  type: ParticleType;
}

// ── Events ───────────────────────────────────────────────────────────────────
// Typed payload map used by EventBus
export interface GameEventMap {
  PLAYER_DIED: { reason: string; position: Vector2 };
  PLAYER_RESPAWNED: { checkpointId: string | null; position: Vector2 };
  COIN_COLLECTED: { coinId: string; position: Vector2 };
  CHECKPOINT_ACTIVATED: { checkpointId: string };
  TRAP_TRIGGERED: { trapId: string; trapType: HazardType };
  LEVEL_STARTED: { levelId: number };
  LEVEL_COMPLETED: { levelId: number; time: number; deaths: number; coins: number };
  GAME_OVER: { levelId: number; deaths: number };
  VICTORY: { totalDeaths: number; totalTime: number };
  STATE_CHANGED: { from: GameState; to: GameState };
  SETTINGS_CHANGED: { settings: SaveSettings };
}
