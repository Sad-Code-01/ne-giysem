import { OUTFIT_THRESHOLDS } from '@/constants/config';
import type {
  ActivityLevel,
  ColdSensitivity,
  OutfitProfile,
  TransportMode,
} from '@/types';

/**
 * Etkili sıcaklık (Yönerge 6.2).
 * Saf fonksiyonlar; tüm girdiler açıkça verilir, durum okunmaz.
 */

/** Üşüme hassasiyeti → sabit ofset (°C). */
export const COLD_SENSITIVITY_OFFSET: Record<ColdSensitivity, number> = {
  none: 3,
  little: 1.5,
  normal: 0,
  quick: -1.5,
  very: -3,
};

/** Varsayılan profil (Faz 2'de profileStore'dan gelecek). */
export const DEFAULT_PROFILE: OutfitProfile = {
  coldSensitivity: 'normal',
  transport: 'walk',
  learnedOffset: 0,
};

/** Ulaşım cezası (°C) — yalnızca rüzgâr eşiği aşılınca işler. */
export const TRANSPORT_PENALTY: Record<TransportMode, number> = {
  walk: 0,
  transit: 0,
  car: 0,
  bike: -1.5,
  motorcycle: -3,
};

export interface EffectiveTempInput {
  /** Dilimdeki `apparent_temperature` ortalaması. */
  avgApparent: number;
  /** Dilimdeki `temperature_2m` ortalaması (güneş kontrolü için). */
  avgTemp: number;
  /** Dilimdeki maksimum rüzgâr (km/h). */
  maxWind: number;
  /** Dilimdeki maksimum UV. */
  maxUv: number;
  /** Dilimdeki WMO kodları. */
  weatherCodes: number[];
  /** Profil kaynaklı ofset (COLD_SENSITIVITY_OFFSET). */
  profileOffset: number;
  /** Öğrenilen ofset, −3…+3. */
  learnedOffset: number;
  /** Son 14 gün `temperature_2m_mean` ortalaması. */
  mean14: number;
  /** Ulaşım modu. */
  transport: TransportMode;
  /** Aktivite seviyesi — metabolik ısı; hareketsiz + serin hissi. */
  activity?: ActivityLevel;
}

/** Aktivite ofseti (°C): hareketsiz üşütür, hareket ısıtır. */
export const ACTIVITY_OFFSET: Record<ActivityLevel, number> = {
  desk: -0.5,
  walk: 0,
  active: 0.5,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Kodlar arasında açık/az bulutlu (0–1) var mı? */
function hasClearCode(codes: number[]): boolean {
  return codes.some((code) => code === 0 || code === 1);
}

/**
 * Tek dilim için etkili sıcaklığı hesaplar (6.2):
 * 1) rüzgâr ≥30 → −1 · 2) güneş+UV≥6+ort≥20 → +1 · 3) ulaşım cezası (rüzgâr ≥10 ise)
 * 4) profil + öğrenme ofseti · 5) iklim alışması (son 14 gün ortalaması).
 */
export function computeEffectiveTemp(input: EffectiveTempInput): number {
  let effective = input.avgApparent;

  // 1) Rüzgâr soğuk hissi.
  if (input.maxWind >= OUTFIT_THRESHOLDS.windColdPenalty) {
    effective -= 1;
  }

  // 2) Güneşin ısıtıcı etkisi.
  if (
    hasClearCode(input.weatherCodes) &&
    input.maxUv >= OUTFIT_THRESHOLDS.sunnyUvBonus &&
    input.avgTemp >= OUTFIT_THRESHOLDS.sunnyTemperatureMin
  ) {
    effective += 1;
  }

  // 3) Ulaşım cezası — yalnızca rüzgâr belirginse.
  if (input.maxWind >= OUTFIT_THRESHOLDS.transportWindMin) {
    effective += TRANSPORT_PENALTY[input.transport];
  }

  // 3b) Aktivite: hareketsizlik üşütür, hareket ısıtır.
  effective += ACTIVITY_OFFSET[input.activity ?? 'walk'];

  // 4) Kişisel + öğrenilmiş ofset.
  effective += input.profileOffset + input.learnedOffset;

  // 5) İklime alışma: serin iklime alışkın vücut daha çabuk üşür.
  const acclimation = clamp(
    (OUTFIT_THRESHOLDS.acclimationReferenceTemp - input.mean14) *
      OUTFIT_THRESHOLDS.acclimationFactor,
    OUTFIT_THRESHOLDS.acclimationMin,
    OUTFIT_THRESHOLDS.acclimationMax
  );
  effective += acclimation;

  return effective;
}

/** Profil nesnesinden `profileOffset` üretir. */
export function profileOffsetOf(profile: OutfitProfile): number {
  return COLD_SENSITIVITY_OFFSET[profile.coldSensitivity];
}
