import {
  CURRENT_FIELDS,
  DAILY_FIELDS,
  FORECAST_API_URL,
  FORECAST_DAYS,
  HOURLY_FIELDS,
  PAST_DAYS,
} from '@/constants/config';
import { ServiceError, fetchJson } from '@/services/http';
import type {
  CurrentWeather,
  DailySummary,
  HourlyPoint,
  Place,
  WeatherSnapshot,
} from '@/types';

/**
 * Open-Meteo Forecast sağlayıcısı (Yönerge 2):
 * `forecast_days=16`, `past_days=14`; günlük seride geçmiş+gelecek birlikte döner.
 */

/** Open-Meteo Forecast API cevabının doğrulanacak ham şekli. */
interface ForecastResponse {
  timezone?: unknown;
  current?: unknown;
  hourly?: unknown;
  daily?: unknown;
}

function asObject(value: unknown, field: string): Record<string, unknown> {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  throw new ServiceError('parse', `${field} alanı beklenen biçimde değil.`);
}

function asNumber(value: unknown, field: string): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  throw new ServiceError('parse', `${field} alanı geçersiz.`);
}

function asString(value: unknown, field: string): string {
  if (typeof value === 'string' && value.length > 0) return value;
  throw new ServiceError('parse', `${field} alanı geçersiz.`);
}

/**
 * Sayı dizisi — Open-Meteo tahmin penceresinin ucunda (son saat/gün)
 * `null` döndürebilir; bu durumda ilgili kayıtlar atlanır, tüm istek
 * parse hatasıyla düşmez.
 */
function asNumberArray(value: unknown, field: string): (number | null)[] {
  if (
    Array.isArray(value) &&
    value.every((item) => item === null || (typeof item === 'number' && Number.isFinite(item)))
  ) {
    return value as (number | null)[];
  }
  throw new ServiceError('parse', `${field} dizisi geçersiz.`);
}

function asStringArray(value: unknown, field: string): string[] {
  if (Array.isArray(value) && value.every((item) => typeof item === 'string')) {
    return value as string[];
  }
  throw new ServiceError('parse', `${field} dizisi geçersiz.`);
}

function asNullableStringArray(value: unknown, field: string): (string | null)[] {
  if (
    Array.isArray(value) &&
    value.every((item) => item === null || typeof item === 'string')
  ) {
    return value as (string | null)[];
  }
  throw new ServiceError('parse', `${field} dizisi geçersiz.`);
}

function assertSameLength(field: string, expected: number, actual: number): void {
  if (expected !== actual) {
    throw new ServiceError('parse', `${field} uzunluğu beklenenle uyuşmuyor.`);
  }
}

/** Saatlik zaman dizisinde, güncel saatle eşleşen indeksi bulur. */
function findHourIndex(times: string[], currentTime: string): number {
  const target = currentTime.slice(0, 13);
  const index = times.findIndex((time) => time.slice(0, 13) === target);
  if (index < 0) {
    throw new ServiceError('parse', 'Güncel saate ait tahmin bulunamadı.');
  }
  return index;
}

/** Verilen konum için hava durumunu çeker ve normalize eder. */
export async function fetchOpenMeteoWeather(place: Place): Promise<WeatherSnapshot> {
  const query = [
    `latitude=${place.latitude}`,
    `longitude=${place.longitude}`,
    `current=${CURRENT_FIELDS.join(',')}`,
    `hourly=${HOURLY_FIELDS.join(',')}`,
    `daily=${DAILY_FIELDS.join(',')}`,
    'timezone=auto',
    'wind_speed_unit=kmh',
    `forecast_days=${FORECAST_DAYS}`,
    `past_days=${PAST_DAYS}`,
  ].join('&');

  const response = await fetchJson<ForecastResponse>(`${FORECAST_API_URL}?${query}`);

  const currentRaw = asObject(response.current, 'current');
  const hourlyRaw = asObject(response.hourly, 'hourly');
  const dailyRaw = asObject(response.daily, 'daily');
  const timezone = asString(response.timezone, 'timezone');

  const currentTime = asString(currentRaw.time, 'current.time');
  const todayKey = currentTime.slice(0, 10);
  const nowHourKey = currentTime.slice(0, 13);

  const hourlyTimes = asStringArray(hourlyRaw.time, 'hourly.time');
  const hourlyTemperature = asNumberArray(hourlyRaw.temperature_2m, 'hourly.temperature_2m');
  const hourlyApparent = asNumberArray(hourlyRaw.apparent_temperature, 'hourly.apparent_temperature');
  const hourlyPrecipitation = asNumberArray(
    hourlyRaw.precipitation_probability,
    'hourly.precipitation_probability'
  );
  const hourlyPrecipitationMm = asNumberArray(
    hourlyRaw.precipitation,
    'hourly.precipitation'
  );
  const hourlyCodes = asNumberArray(hourlyRaw.weather_code, 'hourly.weather_code');
  const hourlyWind = asNumberArray(hourlyRaw.wind_speed_10m, 'hourly.wind_speed_10m');
  const hourlyUv = asNumberArray(hourlyRaw.uv_index, 'hourly.uv_index');
  const hourlyIsDay = asNumberArray(hourlyRaw.is_day, 'hourly.is_day');
  const hourlyVisibility = asNumberArray(hourlyRaw.visibility, 'hourly.visibility');
  const hourlyCloudCover = asNumberArray(hourlyRaw.cloud_cover, 'hourly.cloud_cover');
  const hourlyDewPoint = asNumberArray(hourlyRaw.dew_point_2m, 'hourly.dew_point_2m');

  const hourlyLength = hourlyTimes.length;
  assertSameLength('hourly.temperature_2m', hourlyLength, hourlyTemperature.length);
  assertSameLength('hourly.apparent_temperature', hourlyLength, hourlyApparent.length);
  assertSameLength('hourly.precipitation_probability', hourlyLength, hourlyPrecipitation.length);
  assertSameLength('hourly.precipitation', hourlyLength, hourlyPrecipitationMm.length);
  assertSameLength('hourly.weather_code', hourlyLength, hourlyCodes.length);
  assertSameLength('hourly.wind_speed_10m', hourlyLength, hourlyWind.length);
  assertSameLength('hourly.uv_index', hourlyLength, hourlyUv.length);
  assertSameLength('hourly.is_day', hourlyLength, hourlyIsDay.length);
  assertSameLength('hourly.visibility', hourlyLength, hourlyVisibility.length);
  assertSameLength('hourly.cloud_cover', hourlyLength, hourlyCloudCover.length);
  assertSameLength('hourly.dew_point_2m', hourlyLength, hourlyDewPoint.length);

  const hourIndex = findHourIndex(hourlyTimes, currentTime);

  const current: CurrentWeather = {
    time: currentTime,
    temperature: asNumber(currentRaw.temperature_2m, 'current.temperature_2m'),
    apparentTemperature: asNumber(currentRaw.apparent_temperature, 'current.apparent_temperature'),
    humidity: asNumber(currentRaw.relative_humidity_2m, 'current.relative_humidity_2m'),
    precipitation: asNumber(currentRaw.precipitation, 'current.precipitation'),
    weatherCode: asNumber(currentRaw.weather_code, 'current.weather_code'),
    windSpeed: asNumber(currentRaw.wind_speed_10m, 'current.wind_speed_10m'),
    isDay: asNumber(currentRaw.is_day, 'current.is_day') === 1,
    precipitationProbability: hourlyPrecipitation[hourIndex] ?? 0,
    uvIndex: hourlyUv[hourIndex] ?? 0,
    visibility: asNumber(currentRaw.visibility, 'current.visibility'),
    cloudCover: asNumber(currentRaw.cloud_cover, 'current.cloud_cover'),
    dewPoint: asNumber(currentRaw.dew_point_2m, 'current.dew_point_2m'),
  };

  // Saatlik seri: yalnızca bugünden sonrası (geçmiş saatler elenir, dünkü veriler gerekmez).
  // API'nin veri üretmediği saatler (null) atlanır.
  const hourly: HourlyPoint[] = [];
  for (let index = 0; index < hourlyLength; index += 1) {
    const time = hourlyTimes[index];
    if (time.slice(0, 10) < todayKey) continue;
    if (time.slice(0, 13) < nowHourKey) continue;

    const temperature = hourlyTemperature[index];
    const apparentTemperature = hourlyApparent[index];
    const precipitationProbability = hourlyPrecipitation[index];
    const precipitationMm = hourlyPrecipitationMm[index];
    const weatherCode = hourlyCodes[index];
    const windSpeed = hourlyWind[index];
    const uvIndex = hourlyUv[index];
    if (
      temperature == null ||
      apparentTemperature == null ||
      precipitationProbability == null ||
      precipitationMm == null ||
      weatherCode == null ||
      windSpeed == null ||
      uvIndex == null
    ) {
      continue;
    }

    hourly.push({
      time,
      temperature,
      apparentTemperature,
      precipitationProbability,
      precipitationMm,
      weatherCode,
      windSpeed,
      uvIndex,
      isDay: hourlyIsDay[index] === 1,
      visibility: hourlyVisibility[index] ?? undefined,
      cloudCover: hourlyCloudCover[index] ?? undefined,
      dewPoint: hourlyDewPoint[index] ?? undefined,
    });
  }

  // Günlük seri: geçmiş 14 gün + 16 günlük tahmin; `isPast` ile işaretlenir.
  const dailyTimes = asStringArray(dailyRaw.time, 'daily.time');
  const dailyMax = asNumberArray(dailyRaw.temperature_2m_max, 'daily.temperature_2m_max');
  const dailyMin = asNumberArray(dailyRaw.temperature_2m_min, 'daily.temperature_2m_min');
  const dailyMean = asNumberArray(dailyRaw.temperature_2m_mean, 'daily.temperature_2m_mean');
  const dailyCodes = asNumberArray(dailyRaw.weather_code, 'daily.weather_code');
  const dailyWind = asNumberArray(dailyRaw.wind_speed_10m_max, 'daily.wind_speed_10m_max');
  const dailyPrecipSum = asNumberArray(dailyRaw.precipitation_sum, 'daily.precipitation_sum');
  const dailyPrecipitation = asNumberArray(
    dailyRaw.precipitation_probability_max,
    'daily.precipitation_probability_max'
  );
  const dailyUv = asNumberArray(dailyRaw.uv_index_max, 'daily.uv_index_max');
  const dailySunrise = asNullableStringArray(dailyRaw.sunrise, 'daily.sunrise');
  const dailySunset = asNullableStringArray(dailyRaw.sunset, 'daily.sunset');

  const dailyLength = dailyTimes.length;
  assertSameLength('daily.temperature_2m_max', dailyLength, dailyMax.length);
  assertSameLength('daily.temperature_2m_min', dailyLength, dailyMin.length);
  assertSameLength('daily.temperature_2m_mean', dailyLength, dailyMean.length);
  assertSameLength('daily.weather_code', dailyLength, dailyCodes.length);
  assertSameLength('daily.wind_speed_10m_max', dailyLength, dailyWind.length);
  assertSameLength('daily.precipitation_sum', dailyLength, dailyPrecipSum.length);
  assertSameLength('daily.precipitation_probability_max', dailyLength, dailyPrecipitation.length);
  assertSameLength('daily.uv_index_max', dailyLength, dailyUv.length);
  assertSameLength('daily.sunrise', dailyLength, dailySunrise.length);
  assertSameLength('daily.sunset', dailyLength, dailySunset.length);

  // API'nin veri üretmediği günler (null) atlanır; hafta görünümü ilk 7 günü kullanır.
  const daily: DailySummary[] = [];
  for (let index = 0; index < dailyLength; index += 1) {
    const temperatureMax = dailyMax[index];
    const temperatureMin = dailyMin[index];
    const temperatureMean = dailyMean[index];
    const weatherCode = dailyCodes[index];
    const windSpeedMax = dailyWind[index];
    const precipitationSum = dailyPrecipSum[index];
    const precipitationProbabilityMax = dailyPrecipitation[index];
    const uvIndexMax = dailyUv[index];
    if (
      temperatureMax == null ||
      temperatureMin == null ||
      temperatureMean == null ||
      weatherCode == null ||
      windSpeedMax == null ||
      precipitationSum == null ||
      precipitationProbabilityMax == null ||
      uvIndexMax == null
    ) {
      continue;
    }

    daily.push({
      date: dailyTimes[index],
      temperatureMax,
      temperatureMin,
      temperatureMean,
      weatherCode,
      windSpeedMax,
      precipitationSum,
      precipitationProbabilityMax,
      uvIndexMax,
      sunrise: dailySunrise[index] ?? '',
      sunset: dailySunset[index] ?? '',
      isPast: dailyTimes[index] < todayKey,
    });
  }

  if (daily.length === 0) {
    throw new ServiceError('parse', 'Günlük tahmin bulunamadı.');
  }

  return {
    place,
    current,
    hourly,
    daily,
    timezone,
    fetchedAt: Date.now(),
  };
}
