import { API_BASE_URL } from '@/constants/config';
import { getSecureItem } from '@/lib/storage';

interface ApiOptions extends RequestInit {
  skipAuth?: boolean;
}

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { skipAuth, ...fetchOptions } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (!skipAuth) {
    const token = await getSecureItem('auth_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...fetchOptions,
    headers,
  });

  const json = await res.json();

  if (!res.ok || json?.success === false) {
    throw new Error(json?.error || json?.message || `Request failed: ${res.status}`);
  }

  return json?.data ?? json;
}
