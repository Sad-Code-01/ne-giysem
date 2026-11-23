/**
 * Uygulamanın tüm veri tipleri (v2).
 * `any` kullanılmaz; dış kaynaklı (API) veriler `unknown` üzerinden doğrulanır.
 */

/** Konum bilgisi (GPS veya şehir araması). */
export interface Place {
  /** Görünen ana ad: ilçe ya da il. */
  name: string;
  /** Görünen ikincil ad: il ya da ülke. */
  region: string;
  country: string;
  latitude: number;
  longitude: number;
  source: 'gps' | 'search';
}

/** Anlık hava durumu. */
export interface CurrentWeather {
  /** ISO benzeri yerel zaman, örn. "2026-11-05T10:15". */
  time: string;
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  /** Son ölçülen yağış (mm). */
  precipitation: number;
  weatherCode: number;
  windSpeed: number;
  isDay: boolean;
  /** İçinde bulunulan saat için yağış ihtimali (%). */
  precipitationProbability: number;
  /** İçinde bulunulan saat için UV indeksi. */
  uvIndex: number;
  /** Görüş mesafesi (metre). */
  visibility: number;
}

/** Saatlik tahmin noktası. */
export interface HourlyPoint {
  /** Yerel ISO zaman, örn. "2026-11-05T10:00". */
  time: string;
  temperature: number;
  apparentTemperature: number;
  precipitationProbability: number;
  /** Saatlik yağış miktarı (mm). */
  precipitationMm: number;
  weatherCode: number;
  windSpeed: number;
  uvIndex: number;
  isDay: boolean;
  /** Görüş mesafesi (metre); API vermezse undefined. */
  visibility?: number;
  /** Bulutluluk (%0-100); API vermezse undefined. */
  cloudCover?: number;
  /** Çiy noktası sıcaklığı (°C); API vermezse undefined. */
  dewPoint?: number;
}

/** Günlük özet (geçmiş günler de dahil; `isPast` ile ayrılır). */
export interface DailySummary {
  /** "YYYY-MM-DD" */
  date: string;
  temperatureMax: number;
  temperatureMin: number;
  /** Günlük ortalama sıcaklık (geçmiş ortalaması için). */
  temperatureMean: number;
  /** Gün baskın WMO kodu. */
  weatherCode: number;
  windSpeedMax: number;
  precipitationSum: number;
  precipitationProbabilityMax: number;
  uvIndexMax: number;
  sunrise: string;
  sunset: string;
  /** Geçmişe ait gün mü (geçmiş 14 gün ortalaması için). */
  isPast: boolean;
}

/** Öneri motorunun girdisi: normalize edilmiş hava durumu. */
export interface WeatherSnapshot {
  place: Place;
  current: CurrentWeather;
  /** Yerel saatlik seri (bugün ve sonrası; geçmiş saatler elenmiştir). */
  hourly: HourlyPoint[];
  /** Günlük seriler: önceki 14 gün + 16 günlük tahmin, tarihe göre sıralı. */
  daily: DailySummary[];
  timezone: string;
  /** Verinin çekildiği an (epoch ms). */
  fetchedAt: number;
}

/** Kıyafet kategorileri (6.1). */
export type GarmentCategory =
  | 'top'
  | 'base'
  | 'mid'
  | 'bottom'
  | 'base-bottom'
  | 'outer'
  | 'shoes'
  | 'accessory';

/** Katalogdaki tek bir kıyafet/aksesuar (6.1). */
export interface Garment {
  id: string;
  label: string;
  category: GarmentCategory;
  /** Sıcaklık puanı 0–10. */
  warmth: number;
  waterproof: boolean;
  windproof: boolean;
}

/** Hava illüstrasyonu türleri (7.5). */
export type IllustrationKind =
  | 'sunny'
  | 'partly'
  | 'cloudy'
  | 'rain'
  | 'snow'
  | 'wind'
  | 'fog'
  | 'storm';

/** WMO kodu + gündüz/gece → illüstrasyon eşlemesi. */
export interface WeatherVisual {
  kind: IllustrationKind;
  isDay: boolean;
}

/** Zaman dilimleri (6.4): Sabah 08–12, Öğle 12–17, Akşam 17–22. */
export type TimeSlotId = 'sabah' | 'ogle' | 'aksam';

/** Bir dilimin hesaplanmış hava verisi. */
export interface SlotWeather {
  slot: TimeSlotId;
  /** "Sabah" */
  label: string;
  /** "08–12" */
  hourLabel: string;
  /** Saatlik `apparent_temperature` ortalaması. */
  avgApparent: number;
  /** Saatlik `temperature_2m` ortalaması. */
  avgTemp: number;
  maxWind: number;
  maxUv: number;
  precipitationProbabilityMax: number;
  /** Dilimdeki maksimum saatlik yağış miktarı (mm). */
  precipitationMaxMm: number;
  /** Dilimdeki WMO kodları (sırayla). */
  weatherCodes: number[];
  /** Dilimdeki en düşük görüş mesafesi (metre); veri yoksa Infinity. */
  visibilityMin: number;
  /** Dilimdeki maksimum bulutluluk (%). */
  cloudCoverMax: number;
  /** Dilimdeki maksimum çiy noktası (°C). */
  dewPointMax: number;
  /** Dilimde baskın yağış kodu (illüstrasyon için). */
  dominantCode: number;
  /** Dilimde gün ışığı var mı. */
  isDay: boolean;
  /** Dilim saati geçti mi (aynı gün için). */
  past: boolean;
  /** 6.2'ye göre hesaplanmış etkili sıcaklık. */
  effectiveTemp: number;
}

/** Sıcaklık bantları (6.3). */
export type TempBand =
  | 'cok-sicak'
  | 'sicak'
  | 'ilik'
  | 'hafif-serin'
  | 'serin'
  | 'soguk'
  | 'cok-soguk';

/** Tek dilim için öneri çıktısı (6.5). */
export interface SlotOutfit {
  slot: TimeSlotId;
  band: TempBand;
  /** Bant etiketi, örn. "Serin". */
  bandLabel: string;
  /** Dış varsa o, yoksa ilk üst — "tek kelime". */
  hero: Garment;
  /** Tüm önerilen parçalar (sıralı, tekrarsız). */
  items: Garment[];
  warnings: string[];
  /** Bu dilime özel tek yağmur cümlesi. */
  rainNote?: string;
  /** 'avoid' → "Bugün çıkma." koşulu. */
  level: 'normal' | 'avoid';
  effectiveTemp: number;
  /** Dilim saati geçti mi (yalnızca bugün için anlamlı). */
  past: boolean;
}

/** Uyarı önem derecesi: bilgi < ihtiyat < şiddetli. */
export type AlertSeverity = 'info' | 'caution' | 'severe';

/**
 * Yapılandırılmış uyarı: metin + hangi dilim/saat aralığı için + önem.
 * `warnings` metinleri geriye uyumluluk için durur; `alerts` makine
 * tarafından okunabilir kopyadır (neden ve zaman penceresi taşır).
 */
export interface DayAlert {
  /** Kararlı kimlik: '<slot|day>:<warningIndex>'. */
  id: string;
  severity: AlertSeverity;
  /** Uyarının ait olduğu dilim; gün geneli notlarda undefined. */
  slot?: TimeSlotId;
  /** "08–12" gibi saat aralığı; gün geneli notlarda undefined. */
  window?: string;
  /** Kullanıcıya gösterilen metin (i18n çıktısı). */
  warning: string;
}

/** Gün (Bugün/Yarın) için tam öneri. */
export interface DayOutfit {
  /** "YYYY-MM-DD" */
  date: string;
  /** Sonuç başlığı: "Mont havası." ya da "Bugün çıkma." */
  title: string;
  /** Gün kaçınılmaz derecede kötü mü (6.4). */
  avoid: boolean;
  /** Kaçınılmaz durum açıklaması. */
  avoidNote?: string;
  /** Sabah/Öğle/Akşam önerileri. */
  slots: SlotOutfit[];
  /** Üç kahramandan en yüksek puanlısı — başlık kaynağı. */
  dayHero: Garment;
  /** Birleşik uyarılar (akşam dönüşü dahil). */
  warnings: string[];
  /** Aynı uyarıların yapılandırılmış hâli (önem + zaman penceresi). */
  alerts: DayAlert[];
  /** Günün tek yağmur cümlesi. Kuru günde yok. */
  rainLine?: string;
  /** Akşam bandı belirgin şekilde daha soğuk/yağışlı mı (6.6). */
  eveningTurn: boolean;
  /** Gün içi fark ≥ 8°C ise tek cümlelik not. */
  dailyNote?: string;
}

/** Kişiselleştirme girdileri (6.2). Faz 2'de profileStore'dan gelir. */
export type ColdSensitivity = 'none' | 'little' | 'normal' | 'quick' | 'very';
export type TransportMode = 'walk' | 'bike' | 'motorcycle' | 'transit' | 'car';
/** Günlük aktivite — metabolik ısı üretimi etkili sıcaklığı değiştirir. */
export type ActivityLevel = 'desk' | 'walk' | 'active';
/** Yağmur donanım tercihi — şemsiye mi yağmurluk mu ağırlıklı. */
export type RainPreference = 'umbrella' | 'raincoat' | 'both' | 'strong-only';

export interface OutfitProfile {
  coldSensitivity: ColdSensitivity;
  transport: TransportMode;
  /** Öğrenilen ofset, −3…+3 (6.10). */
  learnedOffset: number;
  /** Gardırop: kullanıcının sahip olduğu garment id'leri (opsiyonel). */
  wardrobe?: string[];
  /** Aktivite seviyesi (opsiyonel, varsayılan 'walk'). */
  activity?: ActivityLevel;
  /** Yağmur donanım tercihi (opsiyonel, varsayılan 'both'). */
  rainPreference?: RainPreference;
}

/** Hava/kalıcı hata türleri. */
export type ServiceErrorKind = 'offline' | 'api' | 'parse' | 'permission' | 'location';
