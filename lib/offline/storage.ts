import * as FileSystem from 'expo-file-system';

const OFFLINE_DIR = `${FileSystem.documentDirectory}offline`;

async function ensureDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(OFFLINE_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(OFFLINE_DIR, { intermediates: true });
  }
}

export async function saveJSON(type: 'course' | 'vocab', id: string, data: unknown): Promise<void> {
  await ensureDir();
  const path = `${OFFLINE_DIR}/${type}/${id}.json`;
  await FileSystem.makeDirectoryAsync(`${OFFLINE_DIR}/${type}`, { intermediates: true });
  await FileSystem.writeAsStringAsync(path, JSON.stringify({ data, cachedAt: Date.now() }));
}

export async function readJSON<T>(type: 'course' | 'vocab', id: string): Promise<{ data: T; cachedAt: number } | null> {
  const path = `${OFFLINE_DIR}/${type}/${id}.json`;
  try {
    const raw = await FileSystem.readAsStringAsync(path);
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function removeJSON(type: 'course' | 'vocab', id: string): Promise<void> {
  const path = `${OFFLINE_DIR}/${type}/${id}.json`;
  await FileSystem.deleteAsync(path, { idempotent: true });
}

export async function hasJSON(type: 'course' | 'vocab', id: string): Promise<boolean> {
  const path = `${OFFLINE_DIR}/${type}/${id}.json`;
  const info = await FileSystem.getInfoAsync(path);
  return info.exists;
}

export async function getCacheSize(type: 'course' | 'vocab', id: string): Promise<number> {
  const path = `${OFFLINE_DIR}/${type}/${id}.json`;
  try {
    const info = await FileSystem.getInfoAsync(path, { size: true });
    return (info as any).size ?? 0;
  } catch {
    return 0;
  }
}
