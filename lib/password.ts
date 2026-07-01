import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/** Hash a plain-text password for storage in LocalStorage / future DB. */
export function hashPassword(plain: string): string {
  return bcrypt.hashSync(plain, SALT_ROUNDS);
}

/** Verify a plain-text password against a stored bcrypt hash. */
export function verifyPassword(plain: string, storedHash: string): boolean {
  if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$') || storedHash.startsWith('$2y$')) {
    return bcrypt.compareSync(plain, storedHash);
  }
  // Legacy plain-text fallback (migrated on next seed reset)
  return plain === storedHash;
}
