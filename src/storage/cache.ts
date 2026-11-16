import AsyncStorage from '@react-native-async-storage/async-storage';

import { STORAGE_KEYS } from '@/constants/config';
import type { Place, WeatherSnapshot } from '@/types';

/**
 * AsyncStorage sarmalayıcısı.
 * Bozuk/eksik kayıtlar uygulamayı çökertmesin diye tüm okumalar güvenli şekilde `null` döner.
 */

async function readJson<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function writeJson(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Depolama hatası kritik değil; sessizce yut.
  }
}

export async function getOnboardingDone(): Promise<boolean> {
  return (await readJson<boolean>(STORAGE_KEYS.onboardingDone)) === true;
}

export async function setOnboardingDone(done: boolean): Promise<void> {
  await writeJson(STORAGE_KEYS.onboardingDone, done);
}

export async function getSelectedPlace(): Promise<Place | null> {
  return readJson<Place>(STORAGE_KEYS.selectedPlace);
}

export async function setSelectedPlace(place: Place | null): Promise<void> {
  if (place === null) {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.selectedPlace);
    } catch {
      // yut
    }
    return;
  }
  await writeJson(STORAGE_KEYS.selectedPlace, place);
}

export async function getLastSnapshot(): Promise<WeatherSnapshot | null> {
  return readJson<WeatherSnapshot>(STORAGE_KEYS.lastSnapshot);
}

export async function setLastSnapshot(snapshot: WeatherSnapshot): Promise<void> {
  await writeJson(STORAGE_KEYS.lastSnapshot, snapshot);
}

export async function clearLastSnapshot(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.lastSnapshot);
  } catch {
    // yut
  }
}
