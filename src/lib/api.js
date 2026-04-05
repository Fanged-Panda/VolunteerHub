const TOKEN_LOCAL_KEY = 'vh_token_local';
const TOKEN_SESSION_KEY = 'vh_token_session';

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
    response = await fetch(path, {
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
