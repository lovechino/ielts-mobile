import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiFetch, setAuthLogoutHandler } from '@/lib/api/client';
import { getSecureItem, setSecureItem, deleteSecureItem, STORAGE_KEYS, zustandStorage } from '@/lib/storage';
import type { UserDTO } from '@/lib/api/types';

export type AuthStateType = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  user: UserDTO | null;
  accessToken: string | null;
  authState: AuthStateType;
  hasCompletedAssessment: boolean;
  hydrate: () => Promise<void>;
  setAssessmentCompleted: () => void;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (code: string, redirectUri?: string) => Promise<void>;
  register: (data: { email: string; password: string; full_name: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<Pick<UserDTO, 'full_name' | 'target_band' | 'ai_persona' | 'avatar_url'>>) => Promise<void>;
  refreshUser: () => Promise<void>;
}
async function getNotificationStore() {
  const { useNotificationStore } = await import('@/stores/useNotificationStore');
  return useNotificationStore.getState();
}

/** Reset toàn bộ dữ liệu cached của các store khác khi logout */
async function resetAllOtherStores() {
  try {
    // Import động để tránh circular dependencies
    const [
      { useDailyStore },
      { useTestStore },
      { useSpeakingStore },
      { useStreakStore },
      { useWritingStore },
      { useVaultSyncStore },
      { useDictionaryStore },
    ] = await Promise.all([
      import('@/stores/useDailyStore'),
      import('@/stores/useTestStore'),
      import('@/stores/useSpeakingStore'),
      import('@/stores/useStreakStore'),
      import('@/stores/useWritingStore'),
      import('@/stores/useVaultSyncStore'),
      import('@/stores/useDictionaryStore'),
    ]);

    useDailyStore.getState().resetStore();
    useTestStore.getState().resetStore();
    useSpeakingStore.getState().resetStore();
    useStreakStore.getState().resetStore();
    useWritingStore.getState().resetStore();
    useVaultSyncStore.getState().resetStore();
    useDictionaryStore.getState().resetStore();
  } catch (e) {
    console.warn('[AuthStore] Failed to reset some stores:', e);
  }
}

/**
 * Persist adapter dùng expo-secure-store.
 * Giữ user + authState qua Fast Refresh và app restart — không bắt user login lại.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => {
      // Đăng ký logout handler cho apiFetch 401 interceptor
      setAuthLogoutHandler(async () => {
        try { (await getNotificationStore()).unregister(); } catch {}
        await resetAllOtherStores();
        await deleteSecureItem(STORAGE_KEYS.ACCESS_TOKEN);
        await deleteSecureItem(STORAGE_KEYS.REFRESH_TOKEN);
        set({ user: null, accessToken: null, authState: 'unauthenticated' });
      });

      return {
        user: null,
        accessToken: null,
        // Sau khi persist rehydrate, state có thể là 'authenticated' ngay — không cần 'loading' dài
        authState: 'loading',
        hasCompletedAssessment: false,

        setAssessmentCompleted: () => {
          set({ hasCompletedAssessment: true });
          setSecureItem(STORAGE_KEYS.ASSESSMENT_COMPLETED, 'true').catch(() => {});
          
          // Sync với server nếu đang login
          const { authState, updateProfile } = get();
          if (authState === 'authenticated') {
            updateProfile({ has_completed_assessment: true } as any).catch(console.error);
          }
        },

        hydrate: async () => {
          try {
            const accessToken = await getSecureItem(STORAGE_KEYS.ACCESS_TOKEN);
            const refreshToken = await getSecureItem(STORAGE_KEYS.REFRESH_TOKEN);
            const assessmentDone = await getSecureItem(STORAGE_KEYS.ASSESSMENT_COMPLETED);

            set({ hasCompletedAssessment: assessmentDone === 'true' });

            if (!accessToken && !refreshToken) {
              set({ authState: 'unauthenticated' });
              return;
            }

            if (accessToken) {
              try {
                const user = await apiFetch<UserDTO>('/auth/me');
                set({ 
                  user, 
                  accessToken, 
                  authState: 'authenticated',
                  // Đồng bộ state từ server về local
                  hasCompletedAssessment: user.has_completed_assessment || (assessmentDone === 'true')
                });
                if (user.has_completed_assessment) {
                  setSecureItem(STORAGE_KEYS.ASSESSMENT_COMPLETED, 'true').catch(() => {});
                }
                
                // --- Sync Vocabulary Vault ---
                const { useVaultSyncStore } = await import('@/stores/useVaultSyncStore');
                useVaultSyncStore.getState().pullSync().catch(console.error);

                getNotificationStore().then((s) => s.register()).catch(() => {});
                return;
              } catch {
                // Token expired, thử refresh
              }
            }

            if (refreshToken) {
              try {
                const res = await apiFetch<{ access_token: string; refresh_token: string }>(
                  '/auth/refresh',
                  { method: 'POST', body: JSON.stringify({ refresh_token: refreshToken }), skipAuth: true }
                );
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

            await deleteSecureItem(STORAGE_KEYS.ACCESS_TOKEN);
            await deleteSecureItem(STORAGE_KEYS.REFRESH_TOKEN);
            set({ authState: 'unauthenticated' });
          } catch {
            set({ authState: 'unauthenticated' });
          }
        },

        loginWithGoogle: async (code, redirectUri) => {
          const res = await apiFetch<{ token: string; refresh_token?: string; user: UserDTO }>(
            '/auth/google',
            { method: 'POST', body: JSON.stringify({ code, redirect_uri: redirectUri }), skipAuth: true }
          );
          await setSecureItem(STORAGE_KEYS.ACCESS_TOKEN, res.token);
          if (res.refresh_token) await setSecureItem(STORAGE_KEYS.REFRESH_TOKEN, res.refresh_token);
          
          const assessmentDone = res.user.has_completed_assessment;
          if (assessmentDone) {
            await setSecureItem(STORAGE_KEYS.ASSESSMENT_COMPLETED, 'true');
          }

          set({ 
            user: res.user, 
            accessToken: res.token, 
            authState: 'authenticated',
            hasCompletedAssessment: !!assessmentDone 
          });

          // --- Sync Vocabulary Vault ---
          const { useVaultSyncStore } = await import('@/stores/useVaultSyncStore');
          useVaultSyncStore.getState().pullSync().catch(console.error);

          getNotificationStore().then((s) => s.register()).catch(() => {});
        },

        login: async (email, password) => {
          const res = await apiFetch<{ access_token: string; refresh_token: string; user: UserDTO }>(
            '/auth/login',
            { method: 'POST', body: JSON.stringify({ email, password }), skipAuth: true }
          );
          await setSecureItem(STORAGE_KEYS.ACCESS_TOKEN, res.access_token);
          await setSecureItem(STORAGE_KEYS.REFRESH_TOKEN, res.refresh_token);
          
          const assessmentDone = res.user.has_completed_assessment;
          if (assessmentDone) {
            await setSecureItem(STORAGE_KEYS.ASSESSMENT_COMPLETED, 'true');
          }

          set({ 
            user: res.user, 
            accessToken: res.access_token, 
            authState: 'authenticated',
            hasCompletedAssessment: !!assessmentDone 
          });

          // --- Sync Vocabulary Vault ---
          const { useVaultSyncStore } = await import('@/stores/useVaultSyncStore');
          useVaultSyncStore.getState().pullSync().catch(console.error);

          getNotificationStore().then((s) => s.register()).catch(() => {});
        },

        register: async (data) => {
          const res = await apiFetch<{ access_token: string; refresh_token: string; user: UserDTO }>(
            '/auth/register',
            { method: 'POST', body: JSON.stringify(data), skipAuth: true }
          );
          await setSecureItem(STORAGE_KEYS.ACCESS_TOKEN, res.access_token);
          await setSecureItem(STORAGE_KEYS.REFRESH_TOKEN, res.refresh_token);
          
          set({ 
            user: res.user, 
            accessToken: res.access_token, 
            authState: 'authenticated',
            hasCompletedAssessment: false 
          });
          getNotificationStore().then((s) => s.register()).catch(() => {});
        },

        logout: async () => {
          try { (await getNotificationStore()).unregister(); } catch {}
          await resetAllOtherStores();
          
          const refreshToken = await getSecureItem(STORAGE_KEYS.REFRESH_TOKEN);
          if (refreshToken) {
            try {
              await apiFetch<null>('/auth/logout', {
                method: 'POST',
                body: JSON.stringify({ refresh_token: refreshToken }),
                skipAuth: true,
              });
            } catch {}
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
          set((state) => ({ 
            user: state.user ? { ...state.user, ...updated } : updated,
            hasCompletedAssessment: updated.has_completed_assessment ?? state.hasCompletedAssessment
          }));
          if (updated.has_completed_assessment) {
            setSecureItem(STORAGE_KEYS.ASSESSMENT_COMPLETED, 'true').catch(() => {});
          }
        },

        refreshUser: async () => {
          try {
            const user = await apiFetch<UserDTO>('/auth/me');
            set({ user });
          } catch (e) {
            console.error('[AuthStore] Failed to refresh user:', e);
          }
        },
      };
    },
    {
      name: 'auth-store',                    // key trong SecureStore
      storage: zustandStorage,
      // Chỉ persist user + authState + hasCompletedAssessment
      // accessToken KHÔNG persist ở đây — đã lưu riêng trong SecureStore qua STORAGE_KEYS
      partialize: (state) => ({
        user: state.user,
        authState: state.authState === 'authenticated' ? 'authenticated' : 'unauthenticated',
        hasCompletedAssessment: state.hasCompletedAssessment,
      }),
      onRehydrateStorage: () => (state) => {
        // Sau khi rehydrate từ storage, nếu đã authenticated thì giữ nguyên
        // AuthGuard sẽ gọi hydrate() để verify token vẫn còn hiệu lực
        if (state?.authState === 'authenticated') {
          console.log('[AuthStore] Rehydrated as authenticated');
        }
      },
    }
  )
);
