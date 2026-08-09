/**
 * AgroLink API Client
 * Centralized fetch wrapper that injects JWT auth header and handles errors.
 * All routes are proxied by Vite to http://localhost:3001 during development.
 */

function getApiBaseUrl() {
  let envUrl = import.meta.env.VITE_API_URL?.trim();

  // If VITE_API_URL is missing or set to a Vercel domain, fallback to live Railway backend in production
  if (!envUrl || envUrl.includes('vercel.app')) {
    if (import.meta.env.PROD) {
      return 'https://agrolink-production-182c.up.railway.app/api';
    }
    return '/api';
  }

  if (envUrl.startsWith('http://') && !envUrl.includes('localhost')) {
    envUrl = envUrl.replace(/^http:\/\//i, 'https://');
  }
  const clean = envUrl.replace(/\/+$/, '');
  return clean.endsWith('/api') ? clean : `${clean}/api`;
}

const BASE = getApiBaseUrl();

// Token management
export const tokenStorage = {
  get: ()        => localStorage.getItem('agrolink_token'),
  set: (token)   => localStorage.setItem('agrolink_token', token),
  clear: ()      => localStorage.removeItem('agrolink_token'),
};

/**
 * Core fetch wrapper.
 * @param {'GET'|'POST'|'PATCH'|'PUT'|'DELETE'} method
 * @param {string} path   — e.g. '/products' (the /api prefix is added automatically)
 * @param {any}    [body] — JSON-serializable body for POST/PATCH/PUT
 */
async function request(method, path, body) {
  const token = tokenStorage.get();

  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Parse response (may be empty for 204)
  let data;
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) {
    const errorMsg = data?.error || `HTTP ${res.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

// ─── Typed helpers ─────────────────────────────────────────────────────────────

export const api = {
  /** GET /api<path> */
  get:    (path)        => request('GET',    path),
  /** POST /api<path> with body */
  post:   (path, body)  => request('POST',   path, body),
  /** PATCH /api<path> with body */
  patch:  (path, body)  => request('PATCH',  path, body),
  /** PUT /api<path> with body */
  put:    (path, body)  => request('PUT',    path, body),
  /** DELETE /api<path> */
  del:    (path)        => request('DELETE', path),
};

// ─── Auth helpers ──────────────────────────────────────────────────────────────

/** Login: POST /api/auth/login. Returns { user, token }. */
export async function apiLogin(email, password) {
  const res = await api.post('/auth/login', { email, password });
  tokenStorage.set(res.data.token);
  return res.data;
}

/** Register: POST /api/auth/register. Returns { user, token }. */
export async function apiRegister(name, email, password, role) {
  const res = await api.post('/auth/register', { name, email, password, role });
  tokenStorage.set(res.data.token);
  return res.data;
}

/** Fetch current user from token: GET /api/auth/me. Returns user or null. */
export async function apiFetchMe() {
  if (!tokenStorage.get()) return null;
  try {
    const res = await api.get('/auth/me');
    return res.data;
  } catch {
    tokenStorage.clear();
    return null;
  }
}

/** Logout — clears token. */
export function apiLogout() {
  tokenStorage.clear();
}

/** Request Reset Code: POST /api/auth/request-reset-code. */
export async function apiRequestResetCode(email) {
  const res = await api.post('/auth/request-reset-code', { email });
  return res.data || res;
}

/** Verify Reset Code: POST /api/auth/verify-reset-code. */
export async function apiVerifyResetCode(email, code) {
  const res = await api.post('/auth/verify-reset-code', { email, code });
  return res.data || res;
}

/** Reset Password: POST /api/auth/reset-password with verified code. */
export async function apiResetPassword(email, code, newPassword) {
  const res = await api.post('/auth/reset-password', { email, code, newPassword });
  return res.data || res;
}
