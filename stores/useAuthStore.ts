import { create } from 'zustand';
import { apiFetch, setAuthLogoutHandler } from '@/lib/api/client';
import { getSecureItem, setSecureItem, deleteSecureItem, STORAGE_KEYS } from '@/lib/storage';
import type { UserDTO } from '@/lib/api/types';

export type AuthStateType = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  user: UserDTO | null;
  accessToken: string | null;
  authState: AuthStateType;
  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (code: string, redirectUri?: string) => Promise<void>;
  register: (data: { email: string; password: string; full_name: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<Pick<UserDTO, 'full_name' | 'target_band' | 'ai_persona' | 'avatar_url'>>) => Promise<void>;
}

/** Lazy import để tránh circular dependency */
async function getNotificationStore() {
  const { useNotificationStore } = await import('@/stores/useNotificationStore');
  return useNotificationStore.getState();
}

export const useAuthStore = create<AuthState>((set, get) => {
  // Register logout handler for API client's 401 interceptor
  setAuthLogoutHandler(async () => {
    // Xóa push token trước khi clear auth
    try { (await getNotificationStore()).unregister(); } catch {}
    await deleteSecureItem(STORAGE_KEYS.ACCESS_TOKEN);
    await deleteSecureItem(STORAGE_KEYS.REFRESH_TOKEN);
    set({ user: null, accessToken: null, authState: 'unauthenticated' });
  });

  return {
    user: null,
    accessToken: null,
    authState: 'loading',

    hydrate: async () => {
      try {
        const accessToken = await getSecureItem(STORAGE_KEYS.ACCESS_TOKEN);
        const refreshToken = await getSecureItem(STORAGE_KEYS.REFRESH_TOKEN);

        if (!accessToken && !refreshToken) {
          set({ authState: 'unauthenticated' });
          return;
        }

        if (accessToken) {
          try {
            const user = await apiFetch<UserDTO>('/auth/me');
            set({ user, accessToken, authState: 'authenticated' });
            // Đăng ký push token sau khi xác thực thành công
            getNotificationStore().then((s) => s.register()).catch(() => {});
            return;
          } catch {
            // Token expired, fall through to refresh
          }
        }

        // Try refresh as fallback
        if (refreshToken) {
          try {
            const res = await apiFetch<{ access_token: string; refresh_token: string }>('/auth/refresh', {
              method: 'POST',
              body: JSON.stringify({ refresh_token: refreshToken }),
              skipAuth: true,
            });
            await setSecureItem(STORAGE_KEYS.ACCESS_TOKEN, res.access_token);
            await setSecureItem(STORAGE_KEYS.REFRESH_TOKEN, res.refresh_token);

            const user = await apiFetch<UserDTO>('/auth/me');
            set({ user, accessToken: res.access_token, authState: 'authenticated' });
            getNotificationStore().then((s) => s.register()).catch(() => {});
            return;
          } catch {
            // Refresh failed
          }
        }

        // Both failed
        await deleteSecureItem(STORAGE_KEYS.ACCESS_TOKEN);
        await deleteSecureItem(STORAGE_KEYS.REFRESH_TOKEN);
        set({ authState: 'unauthenticated' });
      } catch {
        set({ authState: 'unauthenticated' });
      }
    },

    loginWithGoogle: async (code: string, redirectUri?: string) => {
      const res = await apiFetch<{ token: string; user: UserDTO }>('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ code, redirect_uri: redirectUri }),
        skipAuth: true,
      });
      await setSecureItem(STORAGE_KEYS.ACCESS_TOKEN, res.token);
      set({ user: res.user, accessToken: res.token, authState: 'authenticated' });
      getNotificationStore().then((s) => s.register()).catch(() => {});
    },

    login: async (email, password) => {
      const res = await apiFetch<{ access_token: string; refresh_token: string; user: UserDTO }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        skipAuth: true,
      });
      await setSecureItem(STORAGE_KEYS.ACCESS_TOKEN, res.access_token);
      await setSecureItem(STORAGE_KEYS.REFRESH_TOKEN, res.refresh_token);
      set({ user: res.user, accessToken: res.access_token, authState: 'authenticated' });
      getNotificationStore().then((s) => s.register()).catch(() => {});
    },

    register: async (data) => {
      const res = await apiFetch<{ access_token: string; refresh_token: string; user: UserDTO }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
        skipAuth: true,
      });
      await setSecureItem(STORAGE_KEYS.ACCESS_TOKEN, res.access_token);
      await setSecureItem(STORAGE_KEYS.REFRESH_TOKEN, res.refresh_token);
      set({ user: res.user, accessToken: res.access_token, authState: 'authenticated' });
      getNotificationStore().then((s) => s.register()).catch(() => {});
    },

    logout: async () => {
      // Xóa push token trước
      try { (await getNotificationStore()).unregister(); } catch {}

      const refreshToken = await getSecureItem(STORAGE_KEYS.REFRESH_TOKEN);
      if (refreshToken) {
        try {
          await apiFetch<null>('/auth/logout', {
            method: 'POST',
            body: JSON.stringify({ refresh_token: refreshToken }),
            skipAuth: true,
          });
        } catch {
          // Ignore logout API errors
        }
      }
      await deleteSecureItem(STORAGE_KEYS.ACCESS_TOKEN);
      await deleteSecureItem(STORAGE_KEYS.REFRESH_TOKEN);
      set({ user: null, accessToken: null, authState: 'unauthenticated' });
    },

    updateProfile: async (data) => {
      const updated = await apiFetch<UserDTO>('/auth/me', {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      set((state) => ({ user: state.user ? { ...state.user, ...updated } : updated }));
    },
  };
});
