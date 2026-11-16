import AsyncStorage from '@react-native-async-storage/async-storage';

import { CONSENT_VERSION, parseConsentRecord, type ConsentRecord } from '@/logic/consent';
import { STORAGE_KEYS } from '@/constants/config';

/**
 * Gizlilik onayı deposu.
 * Onay {version, acceptedAt} olarak saklanır; sürüm artarsa yeniden sorulur.
 */

async function readJson(key: string): Promise<unknown> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw === null) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function getConsent(): Promise<ConsentRecord | null> {
  return parseConsentRecord(await readJson(STORAGE_KEYS.consent));
}

export async function acceptConsent(): Promise<ConsentRecord> {
  const record: ConsentRecord = { version: CONSENT_VERSION, acceptedAt: Date.now() };
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.consent, JSON.stringify(record));
  } catch {
    // Depolama hatası kritik değil; bu oturumda yine de ilerlenebilir.
  }
  return record;
}

export async function clearConsent(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.consent);
  } catch {
    // yut
  }
}
