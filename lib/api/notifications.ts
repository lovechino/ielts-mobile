import { apiFetch } from '@/lib/api/client';

export function registerPushToken(data: {
  expo_push_token: string;
  platform: string;
}): Promise<null> {
  return apiFetch<null>('/auth/device-token', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function unregisterPushToken(expo_push_token: string): Promise<null> {
  return apiFetch<null>('/auth/device-token', {
    method: 'DELETE',
    body: JSON.stringify({ expo_push_token }),
  });
}
