const TOKEN_LOCAL_KEY = 'vh_token_local';
const TOKEN_SESSION_KEY = 'vh_token_session';
const API_BASE_URL = (() => {
  const envBase =
    (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL) ||
    (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.REACT_APP_API_URL || import.meta.env.VITE_API_URL)) ||
    '';

  const trimmedEnvBase = String(envBase).trim().replace(/\/+$/, '');
  if (trimmedEnvBase) return trimmedEnvBase;

  // Local frontend (Vite) and local API run on different ports.
  if (typeof window !== 'undefined' && /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname)) {
    return 'http://localhost:4000';
  }

  // In production, default to same-origin API paths.
  return '';
})();

function buildApiUrl(path) {
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return API_BASE_URL ? `${API_BASE_URL}${normalizedPath}` : normalizedPath;
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_LOCAL_KEY) || sessionStorage.getItem(TOKEN_SESSION_KEY) || '';
}

export function setStoredToken(token, remember) {
  if (remember) {
    localStorage.setItem(TOKEN_LOCAL_KEY, token);
    sessionStorage.removeItem(TOKEN_SESSION_KEY);
  } else {
    sessionStorage.setItem(TOKEN_SESSION_KEY, token);
    localStorage.removeItem(TOKEN_LOCAL_KEY);
  }
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_LOCAL_KEY);
  sessionStorage.removeItem(TOKEN_SESSION_KEY);
}

export async function apiRequest(path, options = {}) {
  const token = options.token || getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(buildApiUrl(path), {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new Error('Cannot reach the backend API. Run `npm run dev` and try again.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Request failed.');
  }
  return data;
}
