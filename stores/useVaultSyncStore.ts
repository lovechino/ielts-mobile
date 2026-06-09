/**
 * Vault Sync Store — Premium users only
 *
 * Chiến lược Hybrid:
 * - Free users: local-only (không sync)
 * - Premium users: auto-sync sau mỗi thay đổi vault + pull khi app khởi động
 *
 * Conflict resolution: server wins (pull overwrites local nếu server có data)
 */
import { create } from 'zustand';
import { syncVaultToServer, pullVaultFromServer } from '@/lib/api/vault';
import { getAllVaultForSync, restoreVaultFromServer } from '@/lib/offline/dictionary';
import { useAuthStore } from './useAuthStore';

interface VaultSyncState {
  isSyncing: boolean;
  lastSyncAt: number | null;
  syncError: string | null;

  /** Push local vault → server. Gọi sau addToVault / updateVaultWord nếu premium. */
  pushSync: () => Promise<void>;

  /** Pull server vault → local. Gọi khi app khởi động (premium) hoặc sau login. */
  pullSync: () => Promise<void>;

  /** Tự động quyết định push hay pull dựa trên lastSyncAt */
  autoSync: () => Promise<void>;
  resetStore: () => void;
}

export const useVaultSyncStore = create<VaultSyncState>((set, get) => ({
  isSyncing: false,
  lastSyncAt: null,
  syncError: null,

  pushSync: async () => {
    const user = useAuthStore.getState().user;
    if ((user as any)?.tier !== 'premium') return; // Free users skip

    if (get().isSyncing) return;
    set({ isSyncing: true, syncError: null });

    try {
      const localItems = await getAllVaultForSync();
      if (localItems.length === 0) return;

      await syncVaultToServer(localItems);
      set({ lastSyncAt: Date.now() });
    } catch (err: any) {
      set({ syncError: err?.message || 'Sync failed' });
      console.warn('[VaultSync] Push failed:', err?.message);
    } finally {
      set({ isSyncing: false });
    }
  },

  pullSync: async () => {
    const user = useAuthStore.getState().user;
    if ((user as any)?.tier !== 'premium') return;

    if (get().isSyncing) return;
    set({ isSyncing: true, syncError: null });

    try {
      const serverItems = await pullVaultFromServer();
      if (serverItems.length === 0) return;

      // Server wins: restore overwrites local
      await restoreVaultFromServer(serverItems);
      set({ lastSyncAt: Date.now() });
    } catch (err: any) {
      set({ syncError: err?.message || 'Pull failed' });
      console.warn('[VaultSync] Pull failed:', err?.message);
    } finally {
      set({ isSyncing: false });
    }
  },

  autoSync: async () => {
    const user = useAuthStore.getState().user;
    if ((user as any)?.tier !== 'premium') return;

    const { lastSyncAt } = get();
    const now = Date.now();

    // Pull nếu chưa sync hoặc đã > 1 giờ
    if (!lastSyncAt || now - lastSyncAt > 60 * 60 * 1000) {
      await get().pullSync();
    } else {
      // Chỉ push nếu đã sync gần đây
      await get().pushSync();
    }
  },

  resetStore: () => {
    set({ isSyncing: false, lastSyncAt: null, syncError: null });
  },
}));

/**
 * Helper: gọi pushSync sau khi thay đổi vault.
 * Import và dùng trong addToVault / updateVaultWord wrappers.
 */
export async function triggerVaultSync() {
  await useVaultSyncStore.getState().pushSync();
}
