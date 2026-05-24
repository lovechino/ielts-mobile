import { create } from 'zustand';
import { apiFetch } from '@/lib/api/client';
import { getSecureItem, setSecureItem, deleteSecureItem } from '@/lib/storage';
import type { UserDTO } from '@/lib/api/types';

interface AuthState {
  user: UserDTO | null;
  token: string | null;
  isAuthenticated: boolean;
  isReady: boolean;
  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; full_name: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<Pick<UserDTO, 'full_name' | 'target_band' | 'ai_persona' | 'avatar_url'>>) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isReady: false,

  hydrate: async () => {
    try {
      const token = await getSecureItem('auth_token');
      if (token) {
        const user = await apiFetch<UserDTO>('/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        set({ user, token, isAuthenticated: true, isReady: true });
      } else {
        set({ isReady: true });
      }
    } catch {
      set({ isReady: true });
    }
  },

  login: async (email, password) => {
    const res = await apiFetch<{ token: string; user: UserDTO }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      skipAuth: true,
    });
    await setSecureItem('auth_token', res.token);
    set({ user: res.user, token: res.token, isAuthenticated: true });
  },

  register: async (data) => {
    const res = await apiFetch<{ token: string; user: UserDTO }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
      skipAuth: true,
    });
    await setSecureItem('auth_token', res.token);
    set({ user: res.user, token: res.token, isAuthenticated: true });
  },

  logout: async () => {
    await deleteSecureItem('auth_token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  updateProfile: async (data) => {
    const updated = await apiFetch<UserDTO>('/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    set({ user: updated });
  },
}));
