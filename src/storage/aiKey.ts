import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

/**
 * Kullanıcının kendi AI API anahtarı (EVREN LLM Gateway).
 * Önce SecureStore denenir; keystore'u çalışmayan cihazlarda
 * AsyncStorage'a düşer. Anahtar hiçbir zaman koda/log'a yazılmaz.
 */
const KEY = 'negiysem:evrenApiKey';
const FALLBACK_KEY = 'negiysem:evrenApiKey:fallback';

export async function getAiApiKey(): Promise<string | null> {
  try {
    const secure = await SecureStore.getItemAsync(KEY);
    if (secure) return secure;
  } catch {
    // SecureStore okunamadı — yedek depoya bak
  }
  try {
    return await AsyncStorage.getItem(FALLBACK_KEY);
  } catch {
    return null;
  }
}

export async function setAiApiKey(value: string): Promise<void> {
  const trimmed = value.trim();
  if (!trimmed) return;
  try {
    await SecureStore.setItemAsync(KEY, trimmed);
    // Eski yedek kayıt varsa temizle
    void AsyncStorage.removeItem(FALLBACK_KEY).catch(() => undefined);
    return;
  } catch {
    // SecureStore yazılamadı — yedek depoya düş
  }
  await AsyncStorage.setItem(FALLBACK_KEY, trimmed);
}

export async function clearAiApiKey(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(KEY);
  } catch {
    // yoksa sorun değil
  }
  try {
    await AsyncStorage.removeItem(FALLBACK_KEY);
  } catch {
    // yoksa sorun değil
  }
}
