import { randomBytes, createHash } from 'crypto';

/** Reset links expire 1 hour after issuance. */
export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

export interface GeneratedResetToken {
  /** The raw token — goes in the reset link URL, never stored. */
  rawToken: string;
  /** SHA-256 hex digest of rawToken — what actually gets stored in the DB. */
  tokenHash: string;
  expiresAt: Date;
}

/**
 * Generates a fresh password-reset token. The raw token is only ever held in
 * memory long enough to build the reset link; only its hash is persisted, so
 * a database read can't be turned into a usable reset link.
 */
export function generateResetToken(now: Date = new Date()): GeneratedResetToken {
  const rawToken = randomBytes(32).toString('hex');
  return {
    rawToken,
    tokenHash: hashResetToken(rawToken),
    expiresAt: new Date(now.getTime() + RESET_TOKEN_TTL_MS),
  };
}

export function hashResetToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}

export interface ResetTokenRecord {
  expiresAt: Date;
  usedAt: Date | null;
}

/** A token is usable exactly once, and only before it expires. */
export function isResetTokenUsable(token: ResetTokenRecord, now: Date = new Date()): boolean {
  return token.usedAt === null && token.expiresAt.getTime() > now.getTime();
}
