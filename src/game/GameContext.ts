// ─────────────────────────────────────────────────────────────────────────────
// GameContext.ts — Shared runtime services passed to systems and entities.
// Source of truth: ARCHITECTURE.md §10, TRD.md (§ Game Engine)
// ─────────────────────────────────────────────────────────────────────────────

import type { InputManager }    from '../input/InputManager.js';
import type { LevelManager }    from '../levels/LevelManager.js';
import type { AudioManager }    from '../audio/AudioManager.js';
import type { Renderer }        from '../rendering/Renderer.js';
import type { UIManager }       from '../ui/UIManager.js';
import type { EventBus }        from '../systems/EventBus.js';
import type { PhysicsSystem }   from '../systems/PhysicsSystem.js';
import type { CollisionSystem } from '../systems/CollisionSystem.js';
import type { CameraSystem }    from '../systems/CameraSystem.js';
import type { GameConfig }      from './GameConfig.js';
import type { GameStateMachine } from './GameState.js';
import type { SaveSystem }       from '../systems/SaveSystem.js';
import type { ParticleSystem }   from '../systems/ParticleSystem.js';

export interface GameContext {
  readonly input:        InputManager;
  readonly levelManager: LevelManager;
  readonly audio:        AudioManager;
  readonly renderer:     Renderer;
  readonly ui:           UIManager;
  readonly eventBus:     EventBus;
  readonly physics:      PhysicsSystem;
  readonly collision:    CollisionSystem;
  readonly camera:       CameraSystem;
  readonly config:       GameConfig;
  readonly stateMachine: GameStateMachine;
  readonly saveSystem:   SaveSystem;
  readonly particles:    ParticleSystem;
}
