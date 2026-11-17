import * as Location from 'expo-location';

import { ServiceError } from '@/services/http';
import type { Place } from '@/types';

/** Konum alınamazsa sonsuza kadar beklememek için zaman aşımı. */
const BALANCED_TIMEOUT_MS = 15_000;
const LOW_TIMEOUT_MS = 10_000;
const GEOCODE_TIMEOUT_MS = 8_000;

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new ServiceError('location', message)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

/** Konum servisleri açık mı? (Hata durumunda engellememek için `true` varsayılır.) */
export async function isLocationServiceEnabled(): Promise<boolean> {
  try {
    return await Location.hasServicesEnabledAsync();
  } catch {
    return true;
  }
}

/** İzin verilmiş mi — sormadan kontrol eder (ön-bildirim kararı için). */
export async function hasLocationPermission(): Promise<boolean> {
  try {
    const current = await Location.getForegroundPermissionsAsync();
    return current.status === Location.PermissionStatus.GRANTED;
  } catch {
    return false;
  }
}

/** Ön plan konum iznini ister; verilmişse tekrar sormaz. */
export async function requestLocationPermission(): Promise<boolean> {
  const current = await Location.getForegroundPermissionsAsync();
  if (current.status === Location.PermissionStatus.GRANTED) return true;
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === Location.PermissionStatus.GRANTED;
}

/** İzin durumunu hataya çevirir: reddedildiyse 'permission', açıksa null. */
async function ensurePermission(): Promise<void> {
  const current = await Location.getForegroundPermissionsAsync();
  if (current.status === Location.PermissionStatus.GRANTED) return;
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== Location.PermissionStatus.GRANTED) {
    throw new ServiceError('permission', 'Konum izni verilmedi.');
  }
}

async function resolvePosition(): Promise<Location.LocationObject> {
  // Soğuk başlatmada GPS yavaş olabilir: önce dengeli doğruluk, olmazsa düşük doğruluk,
  // o da olmazsa son bilinen konum.
  try {
    return await withTimeout(
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      BALANCED_TIMEOUT_MS,
      'Konum zaman aşımına uğradı.'
    );
  } catch {
    // yut — düşük doğrulukla tekrar dene
  }

  try {
    return await withTimeout(
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }),
      LOW_TIMEOUT_MS,
      'Konum zaman aşımına uğradı.'
    );
  } catch {
    // yut — son bilinen konuma düş
  }

  const lastKnown = await Location.getLastKnownPositionAsync();
  if (lastKnown) return lastKnown;
  throw new ServiceError('location', 'Konumun alınamadı. Konum servilerinin açık olduğundan emin ol.');
}

/**
 * Mevcut konumu alır ve okunabilir bir yer adına çevirir.
 * Ters geokodlama başarısız olursa koordinatlar korunur, ad "Mevcut konum" olur
 * (hava verisi yine gerçek koordinatlardan çekilir).
 */
export async function getCurrentPlace(): Promise<Place> {
  if (!(await isLocationServiceEnabled())) {
    throw new ServiceError('location', 'Konum servisleri kapalı görünüyor.');
  }

  await ensurePermission();
  const position = await resolvePosition();
  const { latitude, longitude } = position.coords;

  let address: Location.LocationGeocodedAddress | null = null;
  try {
    const addresses = await withTimeout(
      Location.reverseGeocodeAsync({ latitude, longitude }),
      GEOCODE_TIMEOUT_MS,
      'Konum adı alınamadı.'
    );
    address = addresses[0] ?? null;
  } catch {
    address = null;
  }

  const district = address?.district ?? null;
  const city = address?.city ?? null;
  const region = address?.region ?? null;
  const country = address?.country ?? null;

  const name = district || city || region || 'Mevcut konum';
  const secondary = district ? city || region || '' : country || region || '';

  return {
    name,
    region: secondary,
    country: country ?? '',
    latitude,
    longitude,
    source: 'gps',
  };
}
