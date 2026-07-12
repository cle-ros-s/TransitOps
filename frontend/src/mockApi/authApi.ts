import { db } from './db';
import { SESSION_KEY } from '../config/constants';
import type { LoginCredentials, AuthSession, User } from '../types';

const PASSWORDS: Record<string, string> = {
  'fleet@transitops.com': 'fleet123',
  'dispatch@transitops.com': 'dispatch123',
  'safety@transitops.com': 'safety123',
  'finance@transitops.com': 'finance123',
};

export async function loginApi(credentials: LoginCredentials): Promise<AuthSession> {
  await db.delay(600);
  const { email, password, role } = credentials;
  const expectedPw = PASSWORDS[email];
  if (!expectedPw || expectedPw !== password) {
    throw new Error('Invalid email or password');
  }
  const user = db.get().users.find((u) => u.email === email && u.role === role);
  if (!user) {
    throw new Error('Role mismatch for this account');
  }
  const session: AuthSession = {
    user: user as User,
    token: `tok_${Date.now()}_${role}`,
    expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
  };
  if (credentials.rememberMe) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
  return session;
}

export function getStoredSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY) ?? sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as AuthSession;
    if (new Date(session.expiresAt) < new Date()) {
      clearSession();
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}
