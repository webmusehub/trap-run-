// ─────────────────────────────────────────────────────────────────────────────
// TrapFactory.ts — Factory for creating runtime trap & platform entities.
// Converts data-driven LevelData configurations into active Entity instances.
// Source of truth: ARCHITECTURE.md §38, TRD.md §19
// ─────────────────────────────────────────────────────────────────────────────

import { Entity }          from './Entity.js';
import { Platform }        from './Platform.js';
import { MovingPlatform }  from './MovingPlatform.js';
import { FallingPlatform } from './FallingPlatform.js';
import { Spike }           from './Spike.js';
import { HiddenSpike }     from './HiddenSpike.js';
import { MovingSpike }     from './MovingSpike.js';
import { FakeExit }        from './FakeExit.js';
import { Exit }            from './Exit.js';
import { TriggerTrap }     from './TriggerTrap.js';
import { Coin }            from './Coin.js';
import { Checkpoint }      from './Checkpoint.js';
import type {
  PlatformData,
  MovingPlatformData,
  FallingPlatformData,
  HazardData,
  ExitData,
  CoinData,
  CheckpointData,
} from '../data/types.js';

export class TrapFactory {
  createPlatform(data: PlatformData): Platform {
    return new Platform(data);
  }

  createMovingPlatform(data: MovingPlatformData): MovingPlatform {
    return new MovingPlatform(data);
  }

  createFallingPlatform(data: FallingPlatformData): FallingPlatform {
    return new FallingPlatform(data);
  }

  createHazard(data: HazardData): Entity {
    switch (data.type) {
      case 'static-spike':
        return new Spike(data);
      case 'hidden-spike':
        return new HiddenSpike(data);
      case 'moving-spike':
        return new MovingSpike(data);
      case 'fake-exit':
        return new FakeExit({
          id: data.id,
          x: data.x,
          y: data.y,
          width: data.width,
          height: data.height,
          type: 'fake',
        });
      case 'trigger-trap':
        return new TriggerTrap(data);
      default:
        return new Spike(data);
    }
  }

  createExit(data: ExitData): Entity {
    if (data.type === 'fake') {
      return new FakeExit(data);
    }
    return new Exit(data);
  }

  createCoin(data: CoinData): Coin {
    return new Coin(data);
  }

  createCheckpoint(data: CheckpointData): Checkpoint {
    return new Checkpoint(data);
  }
}

export const trapFactory = new TrapFactory();
