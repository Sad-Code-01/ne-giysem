import { FORECAST_API_URL } from '@/constants/config';
import { localDateKey } from '@/logic/notifications';
import { fetchJson, ServiceError } from '@/services/http';
import {
  archiveTomorrowForecast,
  listPendingVerifications,
  saveVerification,
  verifyEntry,
} from '@/storage/forecastArchive';
import type { WeatherSnapshot } from '@/types';

/**
 * Tahmin doğruluğu servisi (roadmap §5.4).
 * Her başarılı hava çekiminde: yarının tahmini arşivlenir + tarihi geçmiş
 * kayıtlar için gerçekleşen günlük değerler (precipitation_sum,
 * temperature_2m_max) aynı koordinatlardan çekilip Brier/MAE ile
 * doğrulanır. Tümü cihazda saklanır; ek istek yalnızca doğrulama anında,
 * günde en fazla birkaç kayıt için atılır.
 */

/** Doğrulamanın yapılabileceği en eski gün — forecast API `past_days` sınırı. */
const VERIFY_WINDOW_DAYS = 15;
/** Tek seferde doğrulanan kayıt üst sınırı (ağ dostu). */
const VERIFY_BATCH = 3;

interface PastDailyResponse {
  daily?: {
    time?: unknown;
    precipitation_sum?: unknown;
    temperature_2m_max?: unknown;
  };
}

function numOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/** Tek günün gerçekleşen değerlerini çeker; gün seride yoksa null döner. */
async function fetchActualDay(
  latitude: number,
  longitude: number,
  targetDate: string
): Promise<{ precipitationSum: number | null; temperatureMax: number | null } | null> {
  const query = [
    `latitude=${latitude}`,
    `longitude=${longitude}`,
    'daily=precipitation_sum,temperature_2m_max',
    'timezone=auto',
    'forecast_days=1',
    `past_days=${VERIFY_WINDOW_DAYS}`,
  ].join('&');

  const response = await fetchJson<PastDailyResponse>(`${FORECAST_API_URL}?${query}`);
  const daily = response.daily;
  if (!daily || !Array.isArray(daily.time)) {
    throw new ServiceError('parse', 'Geçmiş günlük veri beklenen biçimde değil.');
  }
  const index = daily.time.findIndex((d) => d === targetDate);
  if (index < 0) return null;

  const precip = Array.isArray(daily.precipitation_sum) ? daily.precipitation_sum[index] : null;
  const tempMax = Array.isArray(daily.temperature_2m_max) ? daily.temperature_2m_max[index] : null;
  return { precipitationSum: numOrNull(precip), temperatureMax: numOrNull(tempMax) };
}

/**
 * Hava yenilendiğinde çağrılır: yarının tahminini arşivler ve tarihi
 * geçmiş kayıtları doğrular. Hatalar yutulur — doğruluk metriği ana
 * akışı asla bloklamaz.
 */
export async function recordAndVerifyForecasts(snapshot: WeatherSnapshot): Promise<void> {
  await archiveTomorrowForecast(snapshot);

  const today = localDateKey(new Date());
  const pending = await listPendingVerifications(today, VERIFY_BATCH);
  for (const entry of pending) {
    try {
      const actual = await fetchActualDay(entry.latitude, entry.longitude, entry.targetDate);
      if (!actual) continue;
      await saveVerification(entry.key, verifyEntry(entry, actual));
    } catch {
      // Tek kaydın hatası diğerlerini durdurmaz; sonraki yenilemede tekrar denenir.
    }
  }
}
