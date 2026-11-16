import * as Location from 'expo-location';

import { ServiceError } from '@/services/http';
import type { Place } from '@/types';

/** Konum alınamazsa sonsuza kadar beklememek için zaman aşımı. */
const LOCATION_TIMEOUT_MS = 20_000;

function withTimeout<T>(promise: Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new ServiceError('location', 'Konumun alınamadı.')),
      LOCATION_TIMEOUT_MS
    );
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

/** Ön plan konum iznini ister. */
export async function requestLocationPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === Location.PermissionStatus.GRANTED;
}

async function resolvePosition(): Promise<Location.LocationObject> {
  // Soğuk başlatmada GPS yavaş olabilir: önce dengeli doğruluk, olmazsa düşük doğruluk,
  // o da olmazsa son bilinen konum.
  try {
    return await withTimeout(
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
    );
  } catch {
    // yut — düşük doğrulukla tekrar dene
  }

  try {
    return await withTimeout(
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low })
    );
  } catch {
    // yut — son bilinen konuma düş
  }

  const lastKnown = await Location.getLastKnownPositionAsync();
  if (lastKnown) return lastKnown;
  throw new ServiceError('location', 'Konumun alınamadı.');
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

  const position = await resolvePosition();
  const { latitude, longitude } = position.coords;

  let address: Location.LocationGeocodedAddress | null = null;
  try {
    const addresses = await Location.reverseGeocodeAsync({ latitude, longitude });
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
