import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

export async function getSecureItem(key: string): Promise<string | null> {
  if (isWeb) return localStorage.getItem(key);
  try {
    const SecureStore = require('expo-secure-store');
    return SecureStore.getItemAsync(key);
  } catch {
    return localStorage.getItem(key);
  }
}

export async function setSecureItem(key: string, value: string): Promise<void> {
  if (isWeb) { localStorage.setItem(key, value); return; }
  try {
    const SecureStore = require('expo-secure-store');
    return SecureStore.setItemAsync(key, value);
  } catch {
    localStorage.setItem(key, value);
  }
}

export async function deleteSecureItem(key: string): Promise<void> {
  if (isWeb) { localStorage.removeItem(key); return; }
  try {
    const SecureStore = require('expo-secure-store');
    return SecureStore.deleteItemAsync(key);
  } catch {
    localStorage.removeItem(key);
  }
}
