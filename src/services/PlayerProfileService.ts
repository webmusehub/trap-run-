// ─────────────────────────────────────────────────────────────────────────────
// PlayerProfileService.ts — Persistent Anonymous Player Identity & Profile.
// Manages anonymous playerId (UUID) and player displayName.
// Source of truth: Master Release Candidate Prompt §6, §7
// ─────────────────────────────────────────────────────────────────────────────

export interface PlayerProfile {
  id: string;
  displayName: string;
  createdAt: number;
}

const PLAYER_ID_KEY = 'trap_run_player_id';
const PLAYER_NAME_KEY = 'trap_run_display_name';
const PLAYER_PROFILE_KEY = 'trap_run_player_profile';

export class PlayerProfileService {
  private static _instance: PlayerProfileService | null = null;
  private _profile: PlayerProfile;

  private constructor() {
    this._profile = this._loadOrCreateProfile();
  }

  public static getInstance(): PlayerProfileService {
    if (!PlayerProfileService._instance) {
      PlayerProfileService._instance = new PlayerProfileService();
    }
    return PlayerProfileService._instance;
  }

  /** Gets current persistent profile. */
  public getProfile(): PlayerProfile {
    return { ...this._profile };
  }

  public getPlayerId(): string {
    return this._profile.id;
  }

  public getDisplayName(): string {
    return this._profile.displayName;
  }

  public hasValidName(): boolean {
    return (
      typeof this._profile.displayName === 'string' &&
      this._profile.displayName.trim().length >= 2 &&
      this._profile.displayName.trim().length <= 16
    );
  }

  /** Set & persist display name with validation & sanitization. */
  public setDisplayName(rawName: string): { success: boolean; error?: string } {
    const validationError = this.validateName(rawName);

    if (validationError) {
      return { success: false, error: validationError };
    }

    const sanitized = this.sanitizeName(rawName);
    this._profile.displayName = sanitized;
    this._saveProfile();
    return { success: true };
  }

  /** Validate display name according to launch specification. */
  public validateName(name: string): string | null {
    const trimmed = name.trim();
    if (!trimmed) {
      return 'Display name cannot be empty.';
    }
    // Check for control characters or HTML tags first
    if (/<[^>]*>/g.test(trimmed)) {
      return 'HTML or script tags are not allowed.';
    }
    if (trimmed.length < 2) {
      return 'Name must be at least 2 characters.';
    }
    if (trimmed.length > 16) {
      return 'Name cannot exceed 16 characters.';
    }
    // Allow letters, numbers, spaces, underscores, hyphens, and common unicode letters
    if (!/^[a-zA-Z0-9_\-\s\u00C0-\u024F\u1E00-\u1EFF]+$/.test(trimmed)) {
      return 'Name contains invalid special characters.';
    }
    return null;
  }

  /** Escapes HTML special characters for XSS prevention. */
  public sanitizeName(input: string): string {
    if (!input) return '';
    return input
      .trim()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /** Unescape HTML entities back to raw string if needed for input boxes. */
  public unescapeName(input: string): string {
    if (!input) return '';
    return input
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'");
  }

  private _loadOrCreateProfile(): PlayerProfile {
    try {
      let id = localStorage.getItem(PLAYER_ID_KEY);
      let name = localStorage.getItem(PLAYER_NAME_KEY) || '';

      const rawProfile = localStorage.getItem(PLAYER_PROFILE_KEY);
      if (rawProfile) {
        try {
          const parsed = JSON.parse(rawProfile);
          if (parsed && typeof parsed === 'object') {
            if (parsed.id) id = parsed.id;
            if (parsed.displayName) name = parsed.displayName;
          }
        } catch (_) {
          // ignore corrupted profile
        }
      }

      if (!id) {
        id = this._generateUUID();
        localStorage.setItem(PLAYER_ID_KEY, id);
      }

      const profile: PlayerProfile = {
        id,
        displayName: this.sanitizeName(name),
        createdAt: Date.now(),
      };

      localStorage.setItem(PLAYER_PROFILE_KEY, JSON.stringify(profile));
      return profile;
    } catch (err) {
      console.warn('[PlayerProfileService] localStorage unavailable, using memory profile:', err);
      return {
        id: this._generateUUID(),
        displayName: '',
        createdAt: Date.now(),
      };
    }
  }

  private _saveProfile(): void {
    try {
      localStorage.setItem(PLAYER_ID_KEY, this._profile.id);
      localStorage.setItem(PLAYER_NAME_KEY, this._profile.displayName);
      localStorage.setItem(PLAYER_PROFILE_KEY, JSON.stringify(this._profile));
    } catch (err) {
      console.warn('[PlayerProfileService] Failed to persist profile to localStorage:', err);
    }
  }

  private _generateUUID(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      try {
        return crypto.randomUUID();
      } catch (_) {
        // fallback
      }
    }
    // Fallback pseudo-UUID v4 generator
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}

export const playerProfileService = PlayerProfileService.getInstance();
