// ─────────────────────────────────────────────────────────────────────────────
// LevelValidator.ts — Validates LevelData before entities are created.
// A bad level produces a controlled error, never a runtime crash.
// Source of truth: TRD.md §43, ARCHITECTURE.md §51
// ─────────────────────────────────────────────────────────────────────────────

import type { LevelData } from '../data/types.js';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export class LevelValidator {
  validate(data: unknown): ValidationResult {
    const errors: string[] = [];

    if (!data || typeof data !== 'object') {
      return { valid: false, errors: ['Level data is not an object.'] };
    }

    const level = data as Partial<LevelData>;

    // Required fields
    if (typeof level.id !== 'number')     errors.push('Missing or invalid: id');
    if (typeof level.name !== 'string')   errors.push('Missing or invalid: name');
    if (typeof level.width !== 'number' || level.width <= 0)  errors.push('Invalid: width');
    if (typeof level.height !== 'number' || level.height <= 0) errors.push('Invalid: height');

    // Spawn
    if (!level.spawn || typeof level.spawn.x !== 'number' || typeof level.spawn.y !== 'number') {
      errors.push('Missing or invalid: spawn');
    }

    // Arrays
    if (!Array.isArray(level.platforms))    errors.push('Missing: platforms array');
    if (!Array.isArray(level.hazards))      errors.push('Missing: hazards array');
    if (!Array.isArray(level.coins))        errors.push('Missing: coins array');
    if (!Array.isArray(level.checkpoints))  errors.push('Missing: checkpoints array');
    if (!Array.isArray(level.exits))        errors.push('Missing: exits array');

    if (errors.length > 0) return { valid: false, errors };

    // Must have at least one real exit
    const exits = level.exits!;
    const realExit = exits.find((e) => e.type === 'real');
    if (!realExit) errors.push('Level has no real exit.');

    // Unique IDs across all entities
    const ids: string[] = [];
    const collectIds = (items: Array<{ id?: string }>, label: string): void => {
      for (const item of items) {
        if (typeof item.id !== 'string' || item.id.trim() === '') {
          errors.push(`${label}: entity missing id`);
        } else if (ids.includes(item.id)) {
          errors.push(`Duplicate entity id: "${item.id}"`);
        } else {
          ids.push(item.id);
        }
      }
    };

    collectIds(level.platforms!,   'platforms');
    collectIds(level.hazards!,     'hazards');
    collectIds(level.coins!,       'coins');
    collectIds(level.checkpoints!, 'checkpoints');
    collectIds(exits,               'exits');

    if (level.movingPlatforms) collectIds(level.movingPlatforms, 'movingPlatforms');
    if (level.fallingPlatforms) collectIds(level.fallingPlatforms, 'fallingPlatforms');

    // Platform dimensions
    for (const p of level.platforms!) {
      if (p.width <= 0 || p.height <= 0) {
        errors.push(`Platform "${p.id}": invalid dimensions`);
      }
    }

    return { valid: errors.length === 0, errors };
  }
}
