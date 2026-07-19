// ponytail: simple fetch wrapper. No axios, no react-query. Add retry/interceptors when needed.

const BASE_URL = '';

interface Tokens {
  accessToken: string;
  refreshToken: string;
}

function getTokens(): Tokens | null {
  if (typeof window === 'undefined') return null;
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}

function setTokens(tokens: Tokens): void {
  localStorage.setItem('accessToken', tokens.accessToken);
  localStorage.setItem('refreshToken', tokens.refreshToken);
}

function clearTokens(): void {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
}

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const tokens = getTokens();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (tokens) {
    headers['Authorization'] = `Bearer ${tokens.accessToken}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    // Attempt token refresh on 401
    if (res.status === 401 && tokens) {
      const refreshed = await tryRefresh(tokens.refreshToken);
      if (refreshed) {
        headers['Authorization'] = `Bearer ${refreshed.accessToken}`;
        const retry = await fetch(`${BASE_URL}${path}`, { ...options, headers });
        if (retry.ok) return retry.json();
      }
    }

    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.message ?? body.error ?? res.statusText);
  }

  // Handle 201 No Content, 204 No Content
  if (res.status === 204) return undefined as T;
  return res.json();
}

async function tryRefresh(refreshToken: string): Promise<Tokens | null> {
  try {
    const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) {
      clearTokens();
      return null;
    }
    const data = await res.json();
    setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
    // ponytail: storing full user in localStorage for fast access. Re-fetch /me on page load.
    localStorage.setItem('user', JSON.stringify(data.user));
    return { accessToken: data.accessToken, refreshToken: data.refreshToken };
  } catch {
    clearTokens();
    return null;
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(path: string) =>
    request<T>(path, {
      method: 'DELETE',
    }),
};

export { getTokens, setTokens, clearTokens, ApiError };
export type { Tokens };
