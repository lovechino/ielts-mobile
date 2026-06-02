import { API_BASE_URL } from '@/constants/config';
import { getSecureItem, setSecureItem, deleteSecureItem, STORAGE_KEYS } from '@/lib/storage';

interface ApiOptions extends RequestInit {
  skipAuth?: boolean;
}

let refreshingPromise: Promise<boolean> | null = null;
let onLogout: (() => void) | null = null;

export function setAuthLogoutHandler(handler: () => void) {
  onLogout = handler;
}

async function tryRefresh(): Promise<boolean> {
  const refreshToken = await getSecureItem(STORAGE_KEYS.REFRESH_TOKEN);
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    const json = await res.json();
    if (!res.ok || json?.success === false) return false;

    await setSecureItem(STORAGE_KEYS.ACCESS_TOKEN, json.data.access_token);
    await setSecureItem(STORAGE_KEYS.REFRESH_TOKEN, json.data.refresh_token);
    return true;
  } catch {
    return false;
  }
}

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { skipAuth, ...fetchOptions } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    // Bypass ngrok interstitial warning page (free tier)
    'ngrok-skip-browser-warning': 'true',
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (!skipAuth) {
    const token = await getSecureItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...fetchOptions,
    headers,
  });

  // 401 → try refresh once, then retry
  if (res.status === 401 && !skipAuth) {
    let refreshed: boolean;
    if (refreshingPromise) {
      refreshed = await refreshingPromise;
    } else {
      refreshingPromise = tryRefresh();
      refreshed = await refreshingPromise;
      refreshingPromise = null;
    }

    if (refreshed) {
      const newToken = await getSecureItem(STORAGE_KEYS.ACCESS_TOKEN);
      if (newToken) headers['Authorization'] = `Bearer ${newToken}`;

      const retryRes = await fetch(`${API_BASE_URL}${path}`, {
        ...fetchOptions,
        headers,
      });
      const retryJson = await retryRes.json();
      if (!retryRes.ok || retryJson?.success === false) {
        throw new Error(retryJson?.error || retryJson?.message || `Request failed: ${retryRes.status}`);
      }
      return retryJson?.data ?? retryJson;
    }

    // Refresh failed — clear tokens to prevent infinite 401 loops
    await deleteSecureItem(STORAGE_KEYS.ACCESS_TOKEN);
    await deleteSecureItem(STORAGE_KEYS.REFRESH_TOKEN);
    setTimeout(() => onLogout?.(), 0);
    throw new Error('Session expired. Please login again.');
  }

  const json = await res.json().catch(() => {
    // Server trả non-JSON (HTML error page, plain text) — wrap thành Error rõ ràng
    throw new Error(`Server error ${res.status}: ${res.statusText || 'Non-JSON response'}`);
  });
  if (!res.ok || json?.success === false) {
    throw new Error(json?.error || json?.message || `Request failed: ${res.status}`);
  }

  return json?.data ?? json;
}
