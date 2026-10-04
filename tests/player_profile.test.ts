import { describe, it, expect, beforeEach } from 'vitest';
import { PlayerProfileService } from '../src/services/PlayerProfileService.js';

describe('PlayerProfileService & Name Validation', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('generates persistent anonymous UUID on initialization', () => {
    const service = PlayerProfileService.getInstance();
    const id1 = service.getPlayerId();
    expect(id1).toBeDefined();
    expect(typeof id1).toBe('string');
    expect(id1.length).toBeGreaterThan(10);
  });

  it('validates name length restrictions (min 2, max 16)', () => {
    const service = PlayerProfileService.getInstance();
    expect(service.validateName('')).toBe('Display name cannot be empty.');
    expect(service.validateName(' ')).toBe('Display name cannot be empty.');
    expect(service.validateName('A')).toBe('Name must be at least 2 characters.');
    expect(service.validateName('ThisNameIsWayTooLongForTrapRun')).toBe('Name cannot exceed 16 characters.');
    expect(service.validateName('NinjaRunner')).toBeNull();
  });

  it('prevents HTML and script injection tags', () => {
    const service = PlayerProfileService.getInstance();
    const scriptTag = '<script>alert(1)</script>';
    const err = service.validateName(scriptTag);
    expect(err).toBe('HTML or script tags are not allowed.');

    const sanitized = service.sanitizeName('<b>Shadow</b>');
    expect(sanitized).toBe('&lt;b&gt;Shadow&lt;/b&gt;');
  });

  it('saves and retrieves valid display name', () => {
    const service = PlayerProfileService.getInstance();
    const res = service.setDisplayName('   ShadowRunner   ');
    expect(res.success).toBe(true);
    expect(service.getDisplayName()).toBe('ShadowRunner');
    expect(service.hasValidName()).toBe(true);
  });

  it('rejects invalid names without mutating profile', () => {
    const service = PlayerProfileService.getInstance();
    service.setDisplayName('ValidRunner');
    const res = service.setDisplayName('A');
    expect(res.success).toBe(false);
    expect(service.getDisplayName()).toBe('ValidRunner');
  });
});
