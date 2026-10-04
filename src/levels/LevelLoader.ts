// ─────────────────────────────────────────────────────────────────────────────
// LevelLoader.ts — Converts validated LevelData into a runtime-ready bundle.
// Phase 1: returns the data as-is (entities created in M03+).
// Source of truth: ARCHITECTURE.md §50, TRD.md §44-45
// ─────────────────────────────────────────────────────────────────────────────

import type { LevelData } from '../data/types.js';
import { LevelValidator } from './LevelValidator.js';

export interface LoadedLevel {
  data: LevelData;
}

export class LevelLoader {
  private readonly _validator = new LevelValidator();

  /**
   * Load and validate a level data object.
   * Throws if validation fails — caller should catch and show error screen.
   */
  load(raw: unknown): LoadedLevel {
    const result = this._validator.validate(raw);
    if (!result.valid) {
      throw new Error(
        `[LevelLoader] Level validation failed:\n${result.errors.join('\n')}`,
      );
    }
    // Safe to cast — validation confirmed the shape
    return { data: raw as LevelData };
  }
}
