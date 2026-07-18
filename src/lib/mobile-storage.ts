import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/** SecureStore is native-only; broken/missing on web & some Expo runtimes */
const canUseSecureStore = Platform.OS !== 'web';

async function getSecureStore(): Promise<typeof import('expo-secure-store') | null> {
  if (!canUseSecureStore) return null;
  try {
    const mod = await import('expo-secure-store');
    if (typeof mod.setItemAsync !== 'function') return null;
    return mod;
  } catch {
    return null;
  }
}

export async function storageGetItem(key: string): Promise<string | null> {
  try {
    const SecureStore = await getSecureStore();
    if (SecureStore) {
      const v = await SecureStore.getItemAsync(key);
      if (v != null) return v;
    }
  } catch {
    /* fall through to AsyncStorage */
  }
  return AsyncStorage.getItem(key);
}

export async function storageSetItem(key: string, value: string): Promise<void> {
  let secureOk = false;
  try {
    const SecureStore = await getSecureStore();
    if (SecureStore) {
      await SecureStore.setItemAsync(key, value);
      secureOk = true;
    }
  } catch {
    secureOk = false;
  }
  // Always mirror to AsyncStorage so getAuthHeaders / hydrate stay reliable
  await AsyncStorage.setItem(key, value);
  if (!secureOk) {
    /* AsyncStorage is the source of truth on web / when SecureStore fails */
  }
}

export async function storageRemoveItem(key: string): Promise<void> {
  try {
    const SecureStore = await getSecureStore();
    if (SecureStore) {
      await SecureStore.deleteItemAsync(key);
    }
  } catch {
    /* ignore */
  }
  await AsyncStorage.removeItem(key);
}

/** Sync cache for getAuthHeaders — updated on every storage write */
const memoryCache = new Map<string, string>();

export function getCachedItem(key: string): string | null {
  return memoryCache.get(key) ?? null;
}

export function setCachedItem(key: string, value: string): void {
  memoryCache.set(key, value);
}

export function removeCachedItem(key: string): void {
  memoryCache.delete(key);
}

export async function hydrateStorageCache(): Promise<void> {
  const keys = [
    'token',
    'authToken',
    'userData',
    'tenantData',
    'sessionExpiresAt',
    'sessionLoginAt',
    'sessionLastActivityAt',
    'selectedBranchId',
  ];
  for (const key of keys) {
    const v = await storageGetItem(key);
    if (v != null) memoryCache.set(key, v);
  }
}
