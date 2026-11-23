import type {
  CurrentWeather,
  DailySummary,
  HourlyPoint,
  OutfitProfile,
  Place,
  WeatherSnapshot,
} from '@/types';

/** Testlerde kullanılan temel (nötr) profil. */
export const TEST_PROFILE: OutfitProfile = {
  coldSensitivity: 'normal',
  transport: 'walk',
  learnedOffset: 0,
};

export const TEST_PLACE: Place = {
  name: 'Elazığ',
  region: 'Elazığ',
  country: 'Türkiye',
  latitude: 38.68,
  longitude: 39.22,
  source: 'gps',
};

export interface HourlyOverrides {
  apparentTemperature?: number;
  temperature?: number;
  precipitationProbability?: number;
  precipitationMm?: number;
  weatherCode?: number;
  windSpeed?: number;
  uvIndex?: number;
  isDay?: boolean;
}

/** Tek gün için 24 saatlik seri üretir (varsayılan: 20°, kod 3, rüzgâr 5). */
export function makeDayHours(
  date: string,
  overrides: HourlyOverrides = {},
  hourFilter?: (hour: number) => boolean
): HourlyPoint[] {
  const points: HourlyPoint[] = [];
  for (let hour = 0; hour < 24; hour += 1) {
    if (hourFilter && !hourFilter(hour)) continue;
    const hh = String(hour).padStart(2, '0');
    points.push({
      time: `${date}T${hh}:00`,
      temperature: overrides.temperature ?? 20,
      apparentTemperature: overrides.apparentTemperature ?? 20,
      precipitationProbability: overrides.precipitationProbability ?? 0,
      precipitationMm: overrides.precipitationMm ?? 0,
      weatherCode: overrides.weatherCode ?? 3,
      windSpeed: overrides.windSpeed ?? 5,
      uvIndex: overrides.uvIndex ?? 0,
      isDay: overrides.isDay ?? (hour >= 7 && hour < 20),
    });
  }
  return points;
}

/** İki gün için saatlik seri (bugün + yarın). */
export function makeTwoDays(
  today: string,
  tomorrow: string,
  overrides: HourlyOverrides = {}
): HourlyPoint[] {
  return [...makeDayHours(today, overrides), ...makeDayHours(tomorrow, overrides)];
}

function addDays(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  const yy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

/** Geçmiş 14 gün + bugünkü günlük özet üretir. */
export function makeDaily(
  today: string,
  options: { pastMean?: number; todayMax?: number; todayMin?: number; todayCode?: number } = {}
): DailySummary[] {
  const days: DailySummary[] = [];
  const pastMean = options.pastMean ?? 15;
  for (let i = 14; i >= 1; i -= 1) {
    const date = addDays(today, -i);
    days.push({
      date,
      temperatureMax: pastMean + 3,
      temperatureMin: pastMean - 3,
      temperatureMean: pastMean,
      weatherCode: 3,
      windSpeedMax: 10,
      precipitationSum: 0,
      precipitationProbabilityMax: 10,
      uvIndexMax: 2,
      sunrise: `${date}T07:00`,
      sunset: `${date}T18:00`,
      isPast: true,
    });
  }
  days.push({
    date: today,
    temperatureMax: options.todayMax ?? 22,
    temperatureMin: options.todayMin ?? 15,
    temperatureMean: ((options.todayMax ?? 22) + (options.todayMin ?? 15)) / 2,
    weatherCode: options.todayCode ?? 3,
    windSpeedMax: 10,
    precipitationSum: 0,
    precipitationProbabilityMax: 20,
    uvIndexMax: 3,
    sunrise: `${today}T07:00`,
    sunset: `${today}T18:00`,
    isPast: false,
  });
  return days;
}

export function makeSnapshot(options: {
  currentTime?: string;
  hourly?: HourlyPoint[];
  daily?: DailySummary[];
  current?: Partial<CurrentWeather>;
} = {}): WeatherSnapshot {
  const currentTime = options.currentTime ?? '2026-11-05T10:00';
  const today = currentTime.slice(0, 10);
  const tomorrow = addDays(today, 1);

  const current: CurrentWeather = {
    time: currentTime,
    temperature: 20,
    apparentTemperature: 20,
    humidity: 50,
    precipitation: 0,
    weatherCode: 3,
    windSpeed: 5,
    isDay: true,
    precipitationProbability: 0,
    uvIndex: 0,
    visibility: 10000,
    cloudCover: 20,
    dewPoint: 5,
    ...options.current,
  };

  return {
    place: TEST_PLACE,
    current,
    hourly: options.hourly ?? makeTwoDays(today, tomorrow),
    daily: options.daily ?? makeDaily(today),
    timezone: 'Europe/Istanbul',
    fetchedAt: 0,
  };
}
