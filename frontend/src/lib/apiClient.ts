/**
 * Centralised HTTP client for TransitOps backend.
 * – Reads the JWT access token from Zustand / localStorage automatically.
 * – Injects Authorization header on every request.
 * – Throws a plain Error with the server's message on non-2xx responses.
 */

const BASE_URL = '/api/v1';

function getToken(): string | null {
  try {
    // Zustand persists the auth store under 'transitops_session'
    const raw = localStorage.getItem('transitops_session');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: { token?: string } };
    return parsed?.state?.token ?? null;
  } catch {
    return null;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, params } = options;

  let url = `${BASE_URL}${endpoint}`;

  // Append query params
  if (params) {
    const qs = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== '' && v !== null)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&');
    if (qs) url += `?${qs}`;
  }

  const headers: HeadersInit = { 'Content-Type': 'application/json' };

  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(url, {
    method,
    headers,
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  });

  // Parse response body (always JSON for our API)
  let data: unknown;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const errorData = data as { error?: { message?: string; code?: string } };
    const message = errorData?.error?.message ?? `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  // Our API wraps everything in { success, data, pagination }
  const result = data as { success: boolean; data: T; pagination?: unknown };
  return result.data;
}

// ── Convenience helpers ──────────────────────────────────────────────────────

export const api = {
  get: <T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>) =>
    request<T>(endpoint, { method: 'GET', params }),

  post: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, { method: 'POST', body }),

  put: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, { method: 'PUT', body }),

  patch: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, { method: 'PATCH', body }),

  delete: <T>(endpoint: string) =>
    request<T>(endpoint, { method: 'DELETE' }),
};

// ── Paginated response helper ─────────────────────────────────────────────────

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export async function requestPaginated<T>(
  endpoint: string,
  params?: Record<string, string | number | boolean | undefined>,
): Promise<{ data: T; pagination: PaginationMeta }> {
  const token = getToken();
  let url = `${BASE_URL}${endpoint}`;
  if (params) {
    const qs = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== '' && v !== null)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&');
    if (qs) url += `?${qs}`;
  }

  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(url, { headers, credentials: 'include' });
  const raw = await response.json() as {
    success: boolean;
    data: T;
    pagination?: PaginationMeta;
  };

  if (!response.ok) {
    const err = raw as unknown as { error?: { message?: string } };
    throw new Error(err?.error?.message ?? 'Request failed');
  }

  return { data: raw.data, pagination: raw.pagination ?? { page: 1, pageSize: 10, total: 0, totalPages: 0 } };
}
