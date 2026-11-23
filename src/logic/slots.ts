import { t } from '@/i18n';
import {
  computeEffectiveTemp,
  profileOffsetOf,
  DEFAULT_PROFILE,
} from '@/logic/effectiveTemp';
import type {
  HourlyPoint,
  OutfitProfile,
  SlotWeather,
  TimeSlotId,
  WeatherSnapshot,
} from '@/types';

/**
 * Zaman dilimleri (Yönerge 6.4):
 * Sabah 08:00–11:59 · Öğle 12:00–16:59 · Akşam 17:00–21:59 (yerel saat).
 */

interface SlotDef {
  id: TimeSlotId;
  /** i18n anahtarı: `slot.<id>`. */
  labelKey: string;
  hourLabel: string;
  startHour: number;
  /** Bitiş saati (dahil değil): 12, 17, 22. */
  endHour: number;
}

export const SLOT_DEFS: readonly SlotDef[] = [
  { id: 'sabah', labelKey: 'slot.sabah', hourLabel: '08–12', startHour: 8, endHour: 12 },
  { id: 'ogle', labelKey: 'slot.ogle', hourLabel: '12–17', startHour: 12, endHour: 17 },
  { id: 'aksam', labelKey: 'slot.aksam', hourLabel: '17–22', startHour: 17, endHour: 22 },
];

/** "YYYY-MM-DD" tarihine `days` gün ekler (UTC aritmetiği, saat diliminden bağımsız). */
export function addDays(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  const yy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

/** "YYYY-MM-DDTHH:MM" yerel damgadan gün anahtarı. */
export function dayKeyOf(time: string): string {
  return time.slice(0, 10);
}

/** "YYYY-MM-DDTHH:MM" yerel damgadan saat (0–23). */
export function hourOf(time: string): number {
  return Number(time.slice(11, 13));
}

/** Son 14 geçmiş günün `temperature_2m_mean` ortalaması (6.2 adım 5). */
export function meanPast14(snapshot: WeatherSnapshot): number {
  const past = snapshot.daily.filter((day) => day.isPast).slice(-14);
  if (past.length === 0) return 0;
  const sum = past.reduce((acc, day) => acc + day.temperatureMean, 0);
  return sum / past.length;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((acc, value) => acc + value, 0) / values.length;
}

function maxOf(values: number[]): number {
  return values.length === 0 ? 0 : Math.max(...values);
}

/**
 * Verilen gün için üç dilimin hava özetini üretir.
 * `nowTime`: "YYYY-MM-DDTHH:MM" — aynı günse biten dilimler `past: true` olur.
 */
export function buildSlotWeathers(
  snapshot: WeatherSnapshot,
  date: string,
  profile: OutfitProfile = DEFAULT_PROFILE,
  nowTime: string = snapshot.current.time
): SlotWeather[] {
  const mean14 = meanPast14(snapshot);
  const profileOffset = profileOffsetOf(profile);
  const nowDay = dayKeyOf(nowTime);
  const nowHour = hourOf(nowTime);

  const dayHours = snapshot.hourly.filter((point) => dayKeyOf(point.time) === date);

  return SLOT_DEFS.map((def) => {
    const hours = dayHours.filter((point) => {
      const hour = hourOf(point.time);
      return hour >= def.startHour && hour < def.endHour;
    });

    const apparent = hours.map((point) => point.apparentTemperature);
    const temps = hours.map((point) => point.temperature);
    const winds = hours.map((point) => point.windSpeed);
    const uvs = hours.map((point) => point.uvIndex);
    const precips = hours.map((point) => point.precipitationProbability);
    const precipMm = hours.map((point) => point.precipitationMm);
    const codes = hours.map((point) => point.weatherCode);
    const visibilities = hours
      .map((point) => point.visibility)
      .filter((value): value is number => typeof value === 'number');
    const cloudCovers = hours
      .map((point) => point.cloudCover)
      .filter((value): value is number => typeof value === 'number');
    const dewPoints = hours
      .map((point) => point.dewPoint)
      .filter((value): value is number => typeof value === 'number');

    const avgApparent = average(apparent);
    const avgTemp = average(temps);
    const maxWind = maxOf(winds);
    const maxUv = maxOf(uvs);
    const precipitationProbabilityMax = maxOf(precips);
    const precipitationMaxMm = maxOf(precipMm);

    // Baskın kod: yağış ihtimali en yüksek saatin kodu; eşitlikte ilk.
    let dominantCode = codes[0] ?? 3;
    let bestPrecip = -1;
    hours.forEach((point, index) => {
      if (point.precipitationProbability > bestPrecip) {
        bestPrecip = point.precipitationProbability;
        dominantCode = point.weatherCode;
      }
    });

    const dayVotes = hours.filter((point) => point.isDay).length;
    const nightVotes = hours.length - dayVotes;
    const isDay = hours.length > 0 ? dayVotes >= nightVotes : false;

    const past = date < nowDay || (date === nowDay && def.endHour <= nowHour);

    const effectiveTemp = computeEffectiveTemp({
      avgApparent,
      avgTemp,
      maxWind,
      maxUv,
      weatherCodes: codes,
      profileOffset,
      learnedOffset: profile.learnedOffset,
      mean14,
      transport: profile.transport,
    });

    return {
      slot: def.id,
      label: t(def.labelKey),
      hourLabel: def.hourLabel,
      avgApparent,
      avgTemp,
      maxWind,
      maxUv,
      precipitationProbabilityMax,
      precipitationMaxMm,
      weatherCodes: codes,
      visibilityMin: visibilities.length ? Math.min(...visibilities) : Number.POSITIVE_INFINITY,
      cloudCoverMax: cloudCovers.length ? Math.max(...cloudCovers) : 0,
      dewPointMax: dewPoints.length ? Math.max(...dewPoints) : Number.NEGATIVE_INFINITY,
      dominantCode,
      isDay,
      past,
      effectiveTemp,
    };
  });
}

/** Bir saatlik noktanın belirli bir güne ait olup olmadığını kontrol eder (test yardımcısı). */
export function isHourInSlot(point: HourlyPoint, slot: TimeSlotId): boolean {
  const def = SLOT_DEFS.find((item) => item.id === slot);
  if (!def) return false;
  const hour = hourOf(point.time);
  return hour >= def.startHour && hour < def.endHour;
}
