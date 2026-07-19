import bcrypt from 'bcryptjs';
import { env } from '../config/env';

export async function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, env.BCRYPT_ROUNDS);
}

export async function comparePassword(
  plaintext: string,
  hashed: string,
): Promise<boolean> {
  return bcrypt.compare(plaintext, hashed);
}

export function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  if (password.length < 8) errors.push('Must be at least 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('Must contain at least one uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('Must contain at least one lowercase letter');
  if (!/\d/.test(password)) errors.push('Must contain at least one number');
  return { valid: errors.length === 0, errors };
}
