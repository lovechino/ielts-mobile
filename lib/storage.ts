import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * Cross-platform storage:
 * - Native (Android/iOS): expo-secure-store
 * - Web: localStorage
 *
 * Không fallback về localStorage trên native — tránh ReferenceError.
 */

const isWeb = Platform.OS === 'web';

export async function getSecureItem(key: string): Promise<string | null> {
  if (isWeb) {
    try { return window.localStorage.getItem(key); } catch { return null; }
  }
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

export async function setSecureItem(key: string, value: string): Promise<void> {
  if (isWeb) {
    try { window.localStorage.setItem(key, value); } catch {}
    return;
  }
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (e) {
    console.warn('[Storage] setSecureItem failed:', e);
  }
}

export async function deleteSecureItem(key: string): Promise<void> {
  if (isWeb) {
    try { window.localStorage.removeItem(key); } catch {}
    return;
  }
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (e) {
    console.warn('[Storage] deleteSecureItem failed:', e);
  }
}

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  ASSESSMENT_COMPLETED: 'assessment_completed',
} as const;
