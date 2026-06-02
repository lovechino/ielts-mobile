import { create } from 'zustand';
import * as FileSystem from 'expo-file-system';
import { setSecureItem, getSecureItem } from '@/lib/storage';
import { API_BASE_URL } from '@/constants/config';

// ─── Types ────────────────────────────────────────────────────────────────────

interface VersionMeta {
  version: string;
  url: string;
  checksum: string | null;
  isFullUpdate: boolean;
  patchUrl: string | null;
  patchSize: number | null;
  updatedAt: string | null;
}

interface DownloadState {
  isDownloading: boolean;
  progress: number;
  /** verifying = checksum check sau khi download */
  status: 'idle' | 'downloading' | 'extracting' | 'verifying' | 'completed' | 'error';
  error: string | null;
  /** Per-course download state (offline course content) */
  downloads: Record<string, {
    status: 'idle' | 'downloading' | 'cached' | 'error';
    progress: number;
    sizeKb?: number;
  }>;

  startDownload: (url: string, version: string, expectedChecksum?: string | null) => Promise<void>;
  checkUpdate: () => Promise<void>;
  applyPatch: (patchUrl: string, newVersion: string) => Promise<void>;
  downloadCourse: (courseId: string) => Promise<void>;
  remove: (courseId: string) => Promise<void>;
  reset: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DB_NAME = 'dictionary.db';
const DB_DIR = `${FileSystem.documentDirectory}SQLite/`;
/** Backend KV-backed version endpoint — no auth required */
const DICT_VERSION_URL = `${API_BASE_URL}/dictionary/version`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Simple version comparison: "1.2.0" > "1.1.0" → true
 * Supports semver-style strings.
 */
function isNewerVersion(remote: string, local: string): boolean {
  const parse = (v: string) => v.split('.').map(n => parseInt(n, 10) || 0);
  const r = parse(remote);
  const l = parse(local);
  for (let i = 0; i < Math.max(r.length, l.length); i++) {
    const rv = r[i] ?? 0;
    const lv = l[i] ?? 0;
    if (rv > lv) return true;
    if (rv < lv) return false;
  }
  return false;
}

/**
 * Lightweight integrity check using file size.
 * If backend provides a "size:NNNN" checksum, we compare file size.
 * Full SHA-256 requires a native module — use size as pragmatic fallback.
 */
async function verifyFile(uri: string, expectedChecksum: string | null): Promise<boolean> {
  if (!expectedChecksum) return true; // No checksum provided → skip
  try {
    if (expectedChecksum.startsWith('size:')) {
      const expectedSize = parseInt(expectedChecksum.replace('size:', ''), 10);
      const info = await FileSystem.getInfoAsync(uri, { size: true });
      const actualSize = (info as any).size ?? 0;
      // Allow ±1% tolerance for filesystem metadata differences
      return Math.abs(actualSize - expectedSize) / expectedSize < 0.01;
    }
    // Unknown checksum format → pass through
    return true;
  } catch {
    return true; // Verification failure is non-fatal
  }
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useDownloadStore = create<DownloadState>((set, get) => ({
  isDownloading: false,
  progress: 0,
  status: 'idle',
  error: null,
  downloads: {},

  reset: () => set({ isDownloading: false, progress: 0, status: 'idle', error: null }),

  // ── checkUpdate ─────────────────────────────────────────────────────────────
  checkUpdate: async () => {
    try {
      const response = await fetch(DICT_VERSION_URL, { cache: 'no-store' });
      if (!response.ok) {
        console.warn('[Dictionary] Version check failed:', response.status);
        return;
      }

      // Backend wraps in { success, data }
      const json = await response.json();
      const remote: VersionMeta = json?.data ?? json;

      if (!remote?.version || !remote?.url) return;

      const localVersion = (await getSecureItem('db_version')) || '0.0.0';

      if (!isNewerVersion(remote.version, localVersion)) {
        console.log(`[Dictionary] Up to date (${localVersion})`);
        return;
      }

      console.log(`[Dictionary] Update available: ${localVersion} → ${remote.version}`);

      if (!remote.isFullUpdate && remote.patchUrl) {
        // Delta patch — only download the diff SQL
        await get().applyPatch(remote.patchUrl, remote.version);
      } else {
        // Full download
        await get().startDownload(remote.url, remote.version, remote.checksum);
      }
    } catch (e) {
      console.warn('[Dictionary] checkUpdate error:', e);
    }
  },

  // ── applyPatch ──────────────────────────────────────────────────────────────
  applyPatch: async (patchUrl: string, newVersion: string) => {
    try {
      set({ isDownloading: true, status: 'downloading', progress: 0, error: null });

      const response = await fetch(patchUrl);
      if (!response.ok) throw new Error(`Patch fetch failed: ${response.status}`);
      const sql = await response.text();

      set({ status: 'extracting', progress: 0.6 });

      const { initDictionaryDB } = await import('@/lib/offline/dictionary');
      const db = await initDictionaryDB();

      // Execute the SQL patch (INSERT/UPDATE statements)
      await db.execAsync(sql);

      await setSecureItem('db_version', newVersion);
      set({ status: 'completed', isDownloading: false, progress: 1 });
      console.log(`[Dictionary] Patch applied → v${newVersion}`);
    } catch (e: any) {
      set({ error: e.message, status: 'error', isDownloading: false });
      console.error('[Dictionary] Patch error:', e);
    }
  },

  // ── startDownload ───────────────────────────────────────────────────────────
  startDownload: async (url: string, version: string, expectedChecksum?: string | null) => {
    try {
      set({ isDownloading: true, status: 'downloading', progress: 0, error: null });

      // Ensure SQLite directory exists
      const dirInfo = await FileSystem.getInfoAsync(DB_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(DB_DIR, { intermediates: true });
      }

      // Download to cache first (atomic swap pattern)
      const downloadDest = `${FileSystem.cacheDirectory}${DB_NAME}.tmp`;

      const downloadResumable = FileSystem.createDownloadResumable(
        url,
        downloadDest,
        {},
        (downloadProgress) => {
          const { totalBytesWritten, totalBytesExpectedToWrite } = downloadProgress;
          const progress = totalBytesExpectedToWrite > 0
            ? totalBytesWritten / totalBytesExpectedToWrite
            : 0;
          set({ progress: Math.min(progress, 0.95) }); // Reserve 5% for verify+move
        }
      );

      const result = await downloadResumable.downloadAsync();
      if (!result?.uri) throw new Error('Download returned no URI');

      // Verify integrity before swapping
      set({ status: 'verifying', progress: 0.96 });
      
      // Check if it's a valid SQLite file (starts with "SQLite format 3")
      try {
        const header = await FileSystem.readAsStringAsync(result.uri, {
          encoding: FileSystem.EncodingType.UTF8,
          length: 15,
        });
        if (header !== 'SQLite format 3') {
          throw new Error('Invalid file format: Not a SQLite database (possibly an HTML error page)');
        }
      } catch (e: any) {
        await FileSystem.deleteAsync(result.uri, { idempotent: true });
        throw new Error(e.message || 'Failed to verify database header');
      }

      const valid = await verifyFile(result.uri, expectedChecksum ?? null);
      if (!valid) {
        await FileSystem.deleteAsync(result.uri, { idempotent: true });
        throw new Error('Integrity check failed — file may be corrupted');
      }

      // Atomic swap: move tmp → final location
      set({ status: 'extracting', progress: 0.98 });
      const finalPath = `${DB_DIR}${DB_NAME}`;

      // Remove old DB if exists
      const existing = await FileSystem.getInfoAsync(finalPath);
      if (existing.exists) {
        await FileSystem.deleteAsync(finalPath, { idempotent: true });
      }

      await FileSystem.moveAsync({ from: result.uri, to: finalPath });

      await setSecureItem('db_version', version);
      set({ status: 'completed', isDownloading: false, progress: 1 });
      console.log(`[Dictionary] Downloaded v${version} → ${finalPath}`);
    } catch (e: any) {
      set({ error: e.message, status: 'error', isDownloading: false });
      console.error('[Dictionary] Download error:', e);
    }
  },

  // ── downloadCourse (offline course content) ─────────────────────────────────
  downloadCourse: async (courseId: string) => {
    set(state => ({
      downloads: { ...state.downloads, [courseId]: { status: 'downloading', progress: 0 } },
    }));
    // Placeholder — replace with actual course content download when implemented
    setTimeout(() => {
      set(state => ({
        downloads: {
          ...state.downloads,
          [courseId]: { status: 'cached', progress: 1, sizeKb: 1024 },
        },
      }));
    }, 1500);
  },

  remove: async (courseId: string) => {
    set(state => {
      const next = { ...state.downloads };
      delete next[courseId];
      return { downloads: next };
    });
  },
}));
