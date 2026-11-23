/**
 * Uygulama genelinde kullanılan sabitler.
 * Tüm eşik değerler tek yerde tutulur ki öneri motoru ve testler aynı kaynağı kullansın.
 */

export const FORECAST_API_URL = 'https://api.open-meteo.com/v1/forecast';
/** 16 gün ötesi için geçmiş yıl ortalaması (Faz 4'te kullanılır). */
export const ARCHIVE_API_URL = 'https://archive-api.open-meteo.com/v1/archive';
export const GEOCODING_API_URL = 'https://geocoding-api.open-meteo.com/v1/search';

/** Tek bir ağ isteği için zaman aşımı (ms). */
export const REQUEST_TIMEOUT_MS = 10_000;
/** Başarısız istekte en fazla kaç kez denenir. */
export const MAX_ATTEMPTS = 2;

/** Önbellekteki hava verisinin "taze" sayıldığı süre (15 dakika). */
export const CACHE_MAX_AGE_MS = 15 * 60 * 1000;
/** Uygulama ön plana döndüğünde bu süreden eskiyse hava verisi yenilenir (30 dakika). */
export const FOREGROUND_REFRESH_MS = 30 * 60 * 1000;

/** Open-Meteo `current` alanları. */
export const CURRENT_FIELDS = [
  'temperature_2m',
  'apparent_temperature',
  'relative_humidity_2m',
  'precipitation',
  'weather_code',
  'wind_speed_10m',
  'is_day',
  'visibility',
] as const;

/** Open-Meteo `hourly` alanları. */
export const HOURLY_FIELDS = [
  'temperature_2m',
  'apparent_temperature',
  'precipitation_probability',
  'precipitation',
  'weather_code',
  'wind_speed_10m',
  'uv_index',
  'is_day',
  'visibility',
  'cloud_cover',
  'dew_point_2m',
] as const;

/** Open-Meteo `daily` alanları (geçmiş 14 gün + 16 günlük tahmin). */
export const DAILY_FIELDS = [
  'temperature_2m_max',
  'temperature_2m_min',
  'temperature_2m_mean',
  'weather_code',
  'wind_speed_10m_max',
  'precipitation_sum',
  'precipitation_probability_max',
  'uv_index_max',
  'sunrise',
  'sunset',
] as const;

/** İleriye dönük tahmin günü (Yönerge: 16). */
export const FORECAST_DAYS = 16;
/** Geriye dönük gün — iklim alışması için ortalama (Yönerge: 14). */
export const PAST_DAYS = 14;

/** Şehir aramada en az kaç karakter aranır. */
export const MIN_SEARCH_LENGTH = 2;
/** Şehir aramada bekleme süresi (ms) — Yönerge 7.7: 300ms. */
export const SEARCH_DEBOUNCE_MS = 300;

/** AsyncStorage anahtarları. */
export const STORAGE_KEYS = {
  /** Gizlilik onayı: {version, acceptedAt}. */
  consent: 'negiysem:consent:v1',
  /** Karşılama akışı tamamlandı mı (konum + bildirim adımları dahil). */
  onboardingDone: 'negiysem:onboarding:v2',
  selectedPlace: 'negiysem:selectedPlace',
  /** v2 şema; eski v1 kayıtları okunmaz. */
  lastSnapshot: 'negiysem:lastSnapshot:v2',
} as const;

/** Günlük kıyafet hatırlatması varsayılanları. */
export const NOTIFICATION_DEFAULTS = {
  enabled: false,
  period: 'aksam' as const,
  hour: 21,
  minute: 0,
  /** Android bildirim kanalı kimliği. */
  channelId: 'gunluk-kiyafet',
  /** Zamanlanmış bildirimin sabit kimliği (yeniden zamanlarken üzerine yazılır). */
  identifier: 'negiysem:gunluk-kiyafet',
} as const;

/** Bildirim planlaması için hava verisinin kabul edilebilir en yüksek yaşı (24 saat). */
export const NOTIFICATION_MAX_DATA_AGE_MS = 24 * 60 * 60 * 1000;

/** "Bugün nasıldı?" sorusunun en sık sorulma aralığı — kullanıcıyı yormamak için 3 gün. */
export const FEEDBACK_PROMPT_INTERVAL_MS = 3 * 24 * 60 * 60 * 1000;

/** Öneri motoru v2 eşikleri (Yönerge 6.2–6.6). */
export const OUTFIT_THRESHOLDS = {
  /** Dilim maks rüzgâr bu değerin üstündeyse −1°C (km/h). */
  windColdPenalty: 30,
  /** Güneş bonusu: UV eşiği ve ort. sıcaklık eşiği. */
  sunnyUvBonus: 6,
  sunnyTemperatureMin: 20,
  /** Ulaşım cezası yalnızca dilim maks rüzgâr bu değerin üstündeyse işler (km/h). */
  transportWindMin: 10,
  /** İklime alışma: son 14 gün ortalaması bu değerin altındaysa üşüme eklenir. */
  acclimationReferenceTemp: 15,
  acclimationFactor: 0.15,
  acclimationMin: -2,
  acclimationMax: 2,
  /** Öğrenme ofseti sınırları. */
  learnedOffsetMin: -3,
  learnedOffsetMax: 3,

  /** Koşul düzeltmeleri (6.5). */
  rainUmbrella: 40,
  rainWaterproof: 60,
  /** Bu etkili sıcaklığın altındaki yağmurda bot da önerilir. */
  rainShoeBelow: 15,
  windOuterLayer: 25,
  uvProtection: 6,
  humidWarmHumidity: 75,
  humidWarmTemperature: 26,
  /** Çiy noktası bu değerin üstünde + sıcaklık eşiği → bunaltıcı nem. */
  muggyDewPoint: 21,
  muggyTemperature: 24,
  /** Görüş bu değerin (metre) altındaysa sis uyarısı. */
  fogVisibilityM: 1000,
  layersDailySwing: 10,
  /** Günlük not eşiği (°C). */
  noteDailySwing: 8,

  /** Kaçınılmaz durum (6.4). */
  avoidStormCodes: [95, 96, 99] as const,
  avoidHeavySnowCodes: [75, 86] as const,
  avoidEffectiveTemp: -12,
  avoidWindSpeed: 60,

  /** Akşam dönüşü (6.6). */
  eveningTurnBandDiff: 1,
  eveningTurnRain: 60,
  eveningTurnRainMorningMax: 40,
} as const;
