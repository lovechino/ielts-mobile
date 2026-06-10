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
import { fetchMyUnlockedBundles } from '@/lib/api/vocabulary';
import { 
  getPendingVaultItems, 
  markItemsAsSynced, 
  restoreVaultFromServer,
  addBundleToVault 
} from '@/lib/offline/dictionary';
import { useAuthStore } from './useAuthStore';

interface VaultSyncState {
  isSyncing: boolean;
  lastSyncAt: number | null;
  syncError: string | null;
  debounceTimer: any | null;

  /** Push local changes → server (Batch sync). */
  pushSync: () => Promise<void>;

  /** Pull server vault → local. */
  pullSync: () => Promise<void>;

  /** Đặt lịch sync sau một khoảng thời gian (Debounce) */
  scheduleSync: (delay?: number) => void;

  resetStore: () => void;
}

export const useVaultSyncStore = create<VaultSyncState>((set, get) => ({
  isSyncing: false,
  lastSyncAt: null,
  syncError: null,
  debounceTimer: null,

  pushSync: async () => {
    const { authState } = useAuthStore.getState();
    if (authState !== 'authenticated') return;

    if (get().isSyncing) return;
    
    try {
      const pendingItems = await getPendingVaultItems();
      if (pendingItems.length === 0) return;

      set({ isSyncing: true, syncError: null });
      console.log(`[VaultSync] Batch syncing ${pendingItems.length} items...`);

      const result = await syncVaultToServer(pendingItems);
      
      if (result.synced > 0) {
        const ids = pendingItems.map(item => item.vocab_id);
        await markItemsAsSynced(ids);
      }

      set({ lastSyncAt: Date.now() });
    } catch (err: any) {
      set({ syncError: err?.message || 'Sync failed' });
      console.warn('[VaultSync] Push failed:', err?.message);
    } finally {
      set({ isSyncing: false });
    }
  },

  pullSync: async () => {
    const { authState } = useAuthStore.getState();
    if (authState !== 'authenticated') return;

    if (get().isSyncing) return;
    set({ isSyncing: true, syncError: null });

    try {
      console.log('[VaultSync] Pulling data from server...');
      
      const [serverItems, unlockedBundles] = await Promise.all([
        pullVaultFromServer(),
        fetchMyUnlockedBundles().catch(() => [] as string[])
      ]);

      // 1. Restore individual words
      if (serverItems.length > 0) {
        await restoreVaultFromServer(serverItems);
      }

      // 2. Restore bundles (re-nạp từ nếu local chưa có)
      if (unlockedBundles.length > 0) {
        for (const bundleId of unlockedBundles) {
          await addBundleToVault(bundleId, 'Roadmap').catch(console.error);
        }
      }

      set({ lastSyncAt: Date.now() });
      console.log('[VaultSync] Pull completed successfully.');
    } catch (err: any) {
      set({ syncError: err?.message || 'Pull failed' });
      console.warn('[VaultSync] Pull failed:', err?.message);
    } finally {
      set({ isSyncing: false });
    }
  },

  scheduleSync: (delay = 5000) => {
    const { debounceTimer } = get();
    if (debounceTimer) clearTimeout(debounceTimer);

    const timer = setTimeout(() => {
      get().pushSync();
    }, delay);

    set({ debounceTimer: timer });
  },

  resetStore: () => {
    const { debounceTimer } = get();
    if (debounceTimer) clearTimeout(debounceTimer);
    set({ isSyncing: false, lastSyncAt: null, syncError: null, debounceTimer: null });
  },
}));

/**
 * Helper: gọi triggerVaultSync sau khi thay đổi vault.
 * Nó sẽ schedule một đợt sync sau 5s im lặng.
 */
export function triggerVaultSync() {
  useVaultSyncStore.getState().scheduleSync();
}
