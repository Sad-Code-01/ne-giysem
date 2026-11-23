import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  scoreForecastDay,
  summarizeVerifications,
  type AccuracySummary,
  type DayVerification,
  type ForecastRecord,
} from '@/logic/forecastScore';
import type { WeatherSnapshot } from '@/types';

/**
 * Tahmin arşivi (roadmap §5.4): her başarılı hava çekiminde "yarının" günlük
 * tahmini saklanır; gün geçince Open-Meteo'dan gerçekleşen değerler alınıp
 * Brier/MAE ile doğrulanır. Tüm veri cihazda kalır — ağa yalnızca hava
 * sağlayıcısına zaten giden istekle aynı koordinatlar için çıkılır.
 */
const STORAGE_KEY = 'negiysem:forecastArchive:v1';
/** Saklanan kayıt üst sınırı — eskiler budanır. */
const MAX_RECORDS = 120;

interface ArchiveEntry extends ForecastRecord {
  /** Aynı koordinat+gün için tek kayıt (üzerine yazılır). */
  key: string;
  verified?: DayVerification;
}

function entryKey(latitude: number, longitude: number, targetDate: string): string {
  return `${latitude.toFixed(3)},${longitude.toFixed(3)}|${targetDate}`;
}

async function readEntries(): Promise<ArchiveEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) return parsed as ArchiveEntry[];
  } catch {
    // bozuk kayıt → sıfırdan başla
  }
  return [];
}

async function writeEntries(entries: ArchiveEntry[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(-MAX_RECORDS)));
  } catch {
    // depolama hatası sessizce yutulur — doğruluk metriği kritik değil
  }
}

/**
 * Snapshot'taki "yarın" günlük özetini arşive yazar (aynı gün için tek kayıt).
 * Yarın verisi yoksa hiçbir şey yapmaz.
 */
export async function archiveTomorrowForecast(snapshot: WeatherSnapshot): Promise<void> {
  const tomorrow = snapshot.daily.find((d) => !d.isPast && d.date > snapshot.current.time.slice(0, 10));
  if (!tomorrow) return;

  const entries = await readEntries();
  const key = entryKey(snapshot.place.latitude, snapshot.place.longitude, tomorrow.date);
  const record: ArchiveEntry = {
    key,
    targetDate: tomorrow.date,
    recordedAt: snapshot.fetchedAt,
    latitude: snapshot.place.latitude,
    longitude: snapshot.place.longitude,
    tempMax: tomorrow.temperatureMax,
    tempMin: tomorrow.temperatureMin,
    precipProbMax: tomorrow.precipitationProbabilityMax,
  };
  const index = entries.findIndex((e) => e.key === key);
  if (index >= 0) {
    // Aynı gün için yeniden tahmin: eskisini koru (ilk tahmin daha adil
    // ölçüm), ama hiç yoksa ekle.
    return;
  }
  entries.push(record);
  await writeEntries(entries);
}

/** Henüz doğrulanmamış ve tarihi geçmiş kayıtlar (en eskiler önce). */
export async function listPendingVerifications(todayKey: string, limit = 5): Promise<ArchiveEntry[]> {
  const entries = await readEntries();
  return entries
    .filter((e) => !e.verified && e.targetDate < todayKey)
    .sort((a, b) => a.targetDate.localeCompare(b.targetDate))
    .slice(0, limit);
}

/** Doğrulama sonucunu kayda işler. */
export async function saveVerification(key: string, verification: DayVerification): Promise<void> {
  const entries = await readEntries();
  const entry = entries.find((e) => e.key === key);
  if (!entry) return;
  entry.verified = verification;
  await writeEntries(entries);
}

/** Kayıt + gerçekleşen sonuçtan doğrulama üretir (saf hesap sarmalayıcı). */
export function verifyEntry(
  entry: ArchiveEntry,
  actual: { precipitationSum: number | null; temperatureMax: number | null }
): DayVerification {
  return scoreForecastDay(entry, actual, Date.now());
}

/** Tüm doğrulanmış kayıtların özeti (UI gösterimi için). */
export async function getAccuracySummary(): Promise<AccuracySummary> {
  const entries = await readEntries();
  return summarizeVerifications(
    entries.filter((e) => e.verified).map((e) => e.verified as DayVerification)
  );
}
