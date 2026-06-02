/**
 * Vault Sync API — Premium users only
 * Syncs local SQLite vault ↔ Cloudflare D1
 */
import { apiFetch } from './client';

export interface VaultSyncItem {
  vocab_id: number;
  status: string;
  group_name?: string;
  ease_factor?: number;
  interval?: number;
  next_review_at?: number | null;
  updated_at?: number | null;
}

/** Push local vault to server (upsert). Returns number of synced items. */
export function syncVaultToServer(items: VaultSyncItem[]): Promise<{ synced: number }> {
  return apiFetch<{ synced: number }>('/vault/sync', {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
}

/** Pull server vault for restore (e.g. new device). */
export function pullVaultFromServer(): Promise<VaultSyncItem[]> {
  return apiFetch<VaultSyncItem[]>('/vault');
}
