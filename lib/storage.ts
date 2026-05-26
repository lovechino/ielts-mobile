import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

async function getStore() {
  if (isWeb) return localStorage;
  try {
    const SecureStore = require('expo-secure-store');
    return SecureStore;
  } catch {
    return localStorage;
  }
}

export async function getSecureItem(key: string): Promise<string | null> {
  const store = await getStore();
  if (store === localStorage) return store.getItem(key);
  return store.getItemAsync(key);
}

export async function setSecureItem(key: string, value: string): Promise<void> {
  const store = await getStore();
  if (store === localStorage) { store.setItem(key, value); return; }
  return store.setItemAsync(key, value);
}

export async function deleteSecureItem(key: string): Promise<void> {
  const store = await getStore();
  if (store === localStorage) { store.removeItem(key); return; }
  return store.deleteItemAsync(key);
}

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
} as const;
