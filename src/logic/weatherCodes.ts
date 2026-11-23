import { t } from '@/i18n';
import type { IllustrationKind, TempBand, WeatherVisual } from '@/types';

/**
 * WMO hava kodu → görünen etiket ve illüstrasyon türü.
 * Etiket ve illüstrasyon AYNI kayıttan gelir; böylece ikon–etiket uyuşmazlığı olmaz (A6).
 * Gece varyantı `isDay` ile `WeatherIllustration` içinde çözülür (Yönerge 7.3).
 */
export interface WeatherCondition {
  /** i18n anahtarı: `weather.code.<wmo>`. */
  labelKey: string;
  illustration: IllustrationKind;
}

/** WMO hava durumu kodları (Open-Meteo `weather_code`). */
const CONDITIONS: Record<number, WeatherCondition> = {
  0: { labelKey: 'weather.code.0', illustration: 'sunny' },
  1: { labelKey: 'weather.code.1', illustration: 'partly' },
  2: { labelKey: 'weather.code.2', illustration: 'cloudy' },
  3: { labelKey: 'weather.code.3', illustration: 'cloudy' },
  45: { labelKey: 'weather.code.45', illustration: 'fog' },
  48: { labelKey: 'weather.code.48', illustration: 'fog' },
  51: { labelKey: 'weather.code.51', illustration: 'rain' },
  53: { labelKey: 'weather.code.53', illustration: 'rain' },
  55: { labelKey: 'weather.code.55', illustration: 'rain' },
  56: { labelKey: 'weather.code.56', illustration: 'rain' },
  57: { labelKey: 'weather.code.57', illustration: 'rain' },
  61: { labelKey: 'weather.code.61', illustration: 'rain' },
  63: { labelKey: 'weather.code.63', illustration: 'rain' },
  65: { labelKey: 'weather.code.65', illustration: 'rain' },
  66: { labelKey: 'weather.code.66', illustration: 'rain' },
  67: { labelKey: 'weather.code.67', illustration: 'rain' },
  71: { labelKey: 'weather.code.71', illustration: 'snow' },
  73: { labelKey: 'weather.code.73', illustration: 'snow' },
  75: { labelKey: 'weather.code.75', illustration: 'snow' },
  77: { labelKey: 'weather.code.77', illustration: 'snow' },
  80: { labelKey: 'weather.code.80', illustration: 'rain' },
  81: { labelKey: 'weather.code.81', illustration: 'rain' },
  82: { labelKey: 'weather.code.82', illustration: 'rain' },
  85: { labelKey: 'weather.code.85', illustration: 'snow' },
  86: { labelKey: 'weather.code.86', illustration: 'snow' },
  95: { labelKey: 'weather.code.95', illustration: 'storm' },
  96: { labelKey: 'weather.code.96', illustration: 'storm' },
  99: { labelKey: 'weather.code.99', illustration: 'storm' },
};

const UNKNOWN_CONDITION: WeatherCondition = {
  labelKey: 'weather.code.unknown',
  illustration: 'cloudy',
};

/** Kod bilinmiyorsa güvenli bir varsayılan döner (uydurma veri üretilmez). */
export function getWeatherCondition(code: number): WeatherCondition & { label: string } {
  const condition = CONDITIONS[code] ?? UNKNOWN_CONDITION;
  return { ...condition, label: t(condition.labelKey) };
}

/** WMO kodu + gündüz/gece → illüstrasyon (etiket aynı kayıttan gelir). */
export function getWeatherVisual(code: number, isDay: boolean): WeatherVisual {
  return { kind: getWeatherCondition(code).illustration, isDay };
}

/** Kar kodu mu? (WMO 71–77, 85–86) */
export function isSnowCode(code: number): boolean {
  return (code >= 71 && code <= 77) || code === 85 || code === 86;
}

/** Fırtına kodu mu? (WMO 95–99) */
export function isStormCode(code: number): boolean {
  return code >= 95 && code <= 99;
}

/** Yağış içeren kod mu? (çisenti, yağmur, kar, sağanak, fırtına) */
export function isPrecipitationCode(code: number): boolean {
  if (isSnowCode(code)) return true;
  if (code >= 51 && code <= 67) return true;
  if (code >= 80 && code <= 82) return true;
  return code >= 95;
}

/** Açık / az bulutlu kod mu? (0–1) */
export function isClearCode(code: number): boolean {
  return code === 0 || code === 1;
}

/**
 * Gökyüzü/olay sınıfı — çoklu sinyalde öncelik sırasıyla:
 * fırtına → kar → sağanak → yağmur → çisenti → sis → bulut → açık.
 */
export type SkyKind =
  | 'storm'
  | 'snow'
  | 'showers'
  | 'rain'
  | 'drizzle'
  | 'fog'
  | 'cloud'
  | 'clear'
  | 'unknown';

/** WMO kodunu olay sınıfına çevirir (Open-Meteo/WMO tablosuyla birebir). */
export function classifySky(code: number): SkyKind {
  if (isStormCode(code)) return 'storm';
  if (isSnowCode(code)) return 'snow';
  if (code >= 80 && code <= 82) return 'showers';
  if (code >= 61 && code <= 67) return 'rain';
  if (code >= 51 && code <= 57) return 'drizzle';
  if (code === 45 || code === 48) return 'fog';
  if (code === 2 || code === 3) return 'cloud';
  if (code === 0 || code === 1) return 'clear';
  return 'unknown';
}

/** Bant id'sinin kullanıcıya görünen etiketi (i18n). */
export function bandLabel(band: TempBand): string {
  return t(`band.${band}`);
}
