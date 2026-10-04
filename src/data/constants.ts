// ─────────────────────────────────────────────────────────────────────────────
// constants.ts — Named constants used across the project.
// Magic numbers must NOT appear outside this file or GameConfig.ts.
// Source of truth: TRD.md §20-21, ARCHITECTURE.md §115
// ─────────────────────────────────────────────────────────────────────────────

// ── Game loop ────────────────────────────────────────────────────────────────
export const FIXED_TIMESTEP = 1 / 60;          // seconds — physics tick rate
export const MAX_DELTA_TIME = 0.05;            // seconds — spiral-of-death guard

// ── Virtual canvas ───────────────────────────────────────────────────────────
export const CANVAS_WIDTH  = 1280;
export const CANVAS_HEIGHT = 720;
export const ASPECT_RATIO  = CANVAS_WIDTH / CANVAS_HEIGHT; // 16:9

// ── Physics (GDD §7-8, TRD §20) ──────────────────────────────────────────────
export const GRAVITY          = 1800;   // px/s²
export const MAX_FALL_SPEED   = 900;    // px/s
export const MOVE_SPEED       = 300;    // px/s
export const ACCELERATION     = 1800;   // px/s²
export const DECELERATION     = 2200;   // px/s²
export const JUMP_VELOCITY    = -600;   // px/s  (negative = upward)

// ── Player ───────────────────────────────────────────────────────────────────
export const PLAYER_WIDTH           = 32;    // px
export const PLAYER_HEIGHT          = 48;    // px
export const PLAYER_START_LIVES     = 3;
export const INVULNERABILITY_TIME   = 0.75;  // seconds (GDD §15)
export const COYOTE_TIME            = 0.1;   // seconds (TRD §24)
export const JUMP_BUFFER_TIME       = 0.1;   // seconds (TRD §25)

// ── Respawn ───────────────────────────────────────────────────────────────────
export const DEATH_FREEZE_DURATION  = 0.5;   // seconds
export const RESPAWN_DELAY          = 0.75;  // seconds

// ── Camera ───────────────────────────────────────────────────────────────────
export const CAMERA_SMOOTHING = 0.1;   // lerp factor (ARCHITECTURE.md §115)

// ── Save ─────────────────────────────────────────────────────────────────────
export const SAVE_KEY     = 'trap-run-save';
export const SAVE_VERSION = 1;

// ── Platforms ────────────────────────────────────────────────────────────────
export const PLATFORM_DEFAULT_HEIGHT       = 20;   // px
export const FALLING_PLATFORM_TRIGGER_DELAY = 500;  // ms
export const FALLING_PLATFORM_SHAKE_DURATION = 200; // ms
export const FALLING_PLATFORM_FALL_SPEED   = 600;  // px/s
export const MOVING_PLATFORM_DEFAULT_SPEED = 120;  // px/s

// ── Coins ────────────────────────────────────────────────────────────────────
export const COIN_WIDTH  = 20;   // px
export const COIN_HEIGHT = 20;   // px

// ── Checkpoints ───────────────────────────────────────────────────────────────
export const CHECKPOINT_WIDTH  = 24;   // px
export const CHECKPOINT_HEIGHT = 48;   // px

// ── Exits ────────────────────────────────────────────────────────────────────
export const EXIT_WIDTH  = 48;   // px
export const EXIT_HEIGHT = 50;   // px

// ── Particles ────────────────────────────────────────────────────────────────
export const MAX_PARTICLES = 200;   // hard cap to protect performance

// ── Total levels ─────────────────────────────────────────────────────────────
export const TOTAL_LEVELS = 10;
