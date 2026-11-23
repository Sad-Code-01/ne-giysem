import * as SecureStore from 'expo-secure-store';

/**
 * Kullanıcının kendi AI API anahtarı (EVREN LLM Gateway).
 * SecureStore'da tutulur — AsyncStorage'a girmez, hiçbir zaman
 * koda/log'a yazılmaz, yalnızca kullanıcının cihazında kalır.
 */
const KEY = 'negiysem:evrenApiKey';

export async function getAiApiKey(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(KEY);
  } catch {
    return null;
  }
}

export async function setAiApiKey(value: string): Promise<void> {
  const trimmed = value.trim();
  if (!trimmed) return;
  await SecureStore.setItemAsync(KEY, trimmed);
}

export async function clearAiApiKey(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(KEY);
  } catch {
    // yoksa sorun değil
  }
}
