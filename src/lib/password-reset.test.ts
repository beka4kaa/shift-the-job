import { describe, it, expect } from 'vitest';
import { generateResetToken, hashResetToken, isResetTokenUsable, RESET_TOKEN_TTL_MS } from './password-reset';

describe('generateResetToken', () => {
  it('produces a raw token whose hash matches the returned tokenHash', () => {
    const { rawToken, tokenHash } = generateResetToken();
    expect(hashResetToken(rawToken)).toBe(tokenHash);
  });

  it('never stores the raw token as the hash (they must differ)', () => {
    const { rawToken, tokenHash } = generateResetToken();
    expect(tokenHash).not.toBe(rawToken);
  });

  it('sets expiresAt to now + RESET_TOKEN_TTL_MS', () => {
    const now = new Date('2026-01-01T00:00:00Z');
    const { expiresAt } = generateResetToken(now);
    expect(expiresAt.getTime()).toBe(now.getTime() + RESET_TOKEN_TTL_MS);
  });

  it('generates a different raw token on every call', () => {
    const a = generateResetToken();
    const b = generateResetToken();
    expect(a.rawToken).not.toBe(b.rawToken);
  });
});

describe('hashResetToken', () => {
  it('is deterministic — same input always hashes the same', () => {
    expect(hashResetToken('abc')).toBe(hashResetToken('abc'));
  });

  it('produces different hashes for different inputs', () => {
    expect(hashResetToken('abc')).not.toBe(hashResetToken('abd'));
  });
});

describe('isResetTokenUsable', () => {
  const now = new Date('2026-01-01T12:00:00Z');

  it('is usable when not expired and not used', () => {
    const token = { expiresAt: new Date('2026-01-01T13:00:00Z'), usedAt: null };
    expect(isResetTokenUsable(token, now)).toBe(true);
  });

  it('is not usable once expired', () => {
    const token = { expiresAt: new Date('2026-01-01T11:00:00Z'), usedAt: null };
    expect(isResetTokenUsable(token, now)).toBe(false);
  });

  it('is not usable exactly at the expiry instant', () => {
    const token = { expiresAt: now, usedAt: null };
    expect(isResetTokenUsable(token, now)).toBe(false);
  });

  it('is not usable once already used, even if not expired', () => {
    const token = { expiresAt: new Date('2026-01-01T13:00:00Z'), usedAt: new Date('2026-01-01T12:30:00Z') };
    expect(isResetTokenUsable(token, now)).toBe(false);
  });
});
