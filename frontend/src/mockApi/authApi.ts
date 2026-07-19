import { api } from '../lib/apiClient';
import { useAuthStore } from '../store/authStore';
import type { LoginCredentials, AuthSession } from '../types';

export interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: 'fleet_manager' | 'dispatcher' | 'safety_officer' | 'financial_analyst';
  };
}

export async function loginApi(credentials: LoginCredentials): Promise<AuthSession> {
  const data = await api.post<LoginResponse>('/auth/login', {
    email: credentials.email,
    password: credentials.password,
    role: credentials.role,
  });

  const session: AuthSession = {
    user: {
      id: data.user.id,
      email: data.user.email,
      name: data.user.name,
      role: data.user.role,
      department: '',
      createdAt: new Date().toISOString(),
    },
    token: data.accessToken,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  };

  // Persist token via auth store (zustand persist writes to localStorage)
  const { setAuth } = useAuthStore.getState();
  setAuth(session.user, session.token);

  return session;
}

export async function logoutApi(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } catch {
    // Ignore — always clear local state
  } finally {
    const { clearAuth } = useAuthStore.getState();
    clearAuth();
  }
}

export async function getMeApi() {
  return api.get<LoginResponse['user']>('/auth/me');
}

// ── Legacy compat shims used by existing components ──────────────────────────
export function getStoredSession(): AuthSession | null {
  const { user, token, isAuthenticated } = useAuthStore.getState();
  if (!isAuthenticated || !user || !token) return null;
  return {
    user,
    token,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  };
}

export function clearSession(): void {
  useAuthStore.getState().clearAuth();
}
