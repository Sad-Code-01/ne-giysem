import { OUTFIT_THRESHOLDS } from '@/constants/config';
import { GARMENTS } from '@/logic/garmentCatalog';
import type { Garment } from '@/types';

/**
 * Gardırop entegrasyonu: önerilen parça kullanıcıda yoksa, aynı kategoride
 * hava koşullarına UYGUN en yakın warmth puanına sahip sahip olunan parça
 * ile değiştirilir.
 *
 * Hard constraint'ler (spec §17.5): hava ile çelişen parça asla önerilmez —
 * örn. 18°C altı hissedilen sıcaklıkta şort, yağmurda su geçirmez olmayan
 * ayakkabı. Uygun aday yoksa jenerik öneri korunur (kullanıcıya "gardırobunda
 * uygun parça yok" mesajı üst katmanda verilebilir).
 */

/** Hissedilen sıcaklık bu değerin altındayken şort/etek önerilmez. */
const COLD_BOTTOM_LIMIT = 18;
/** Bu değerin altındayken açık ayakkabı önerilmez. */
const COLD_OPEN_SHOE_LIMIT = 12;
/** Yağmurda yalnızca su geçirmez ayakkabı aday olabilir. */
const RAIN_SHOE_IDS = new Set(['su-gecirmez-bot']);

export interface WardrobeWeatherContext {
  /** Slot'un efektif (hissedilen) sıcaklığı. */
  effectiveTemp: number;
  /** Bu slot için yağış sinyali var mı (olasılık/miktar/WMO kodu). */
  rain: boolean;
}

/** Parça bu hava koşullarında giyilebilir mi? */
export function isGarmentCompatible(item: Garment, ctx: WardrobeWeatherContext): boolean {
  if ((item.id === 'sort' || item.id === 'etek') && ctx.effectiveTemp < COLD_BOTTOM_LIMIT) {
    return false;
  }
  if (item.category === 'shoes') {
    if (item.id === 'sandalet' && (ctx.effectiveTemp < COLD_OPEN_SHOE_LIMIT || ctx.rain)) {
      return false;
    }
    if (ctx.rain && !item.waterproof && !RAIN_SHOE_IDS.has(item.id)) {
      return false;
    }
  }
  return true;
}

function substitute(
  item: Garment,
  ownedIds: ReadonlySet<string>,
  ctx: WardrobeWeatherContext | null
): Garment {
  if (ownedIds.has(item.id)) {
    // Kullanıcının seçtiği parça bile koşulla çelişiyorsa değiştirilmez —
    // motor zaten o parçayı önermemiş olmalı; yine de güvence olarak
    // uygun alternatife düş.
    if (!ctx || isGarmentCompatible(item, ctx)) return item;
  }
  let best: Garment | null = null;
  let bestDiff = Number.POSITIVE_INFINITY;
  for (const candidate of GARMENTS) {
    if (!ownedIds.has(candidate.id) || candidate.category !== item.category) continue;
    if (ctx && !isGarmentCompatible(candidate, ctx)) continue;
    const diff = Math.abs(candidate.warmth - item.warmth);
    if (diff < bestDiff) {
      best = candidate;
      bestDiff = diff;
    }
  }
  return best ?? item;
}

/** Öğe listesini gardıroba göre uyarlar; aynı parçanın tekrarı elenir. */
export function applyWardrobe(
  items: readonly Garment[],
  ownedIds: ReadonlySet<string>,
  ctx?: WardrobeWeatherContext | null
): Garment[] {
  const out: Garment[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    const next = substitute(item, ownedIds, ctx ?? null);
    if (seen.has(next.id)) continue;
    seen.add(next.id);
    out.push(next);
  }
  return out;
}

/** Slot hava verisinden gardırop uygunluk bağlamı üretir. */
export function wardrobeContextForSlot(slot: {
  effectiveTemp: number;
  precipitationProbabilityMax: number;
  precipitationMaxMm: number;
  weatherCodes: readonly number[];
}): WardrobeWeatherContext {
  const rain =
    slot.precipitationProbabilityMax >= OUTFIT_THRESHOLDS.rainUmbrella ||
    slot.precipitationMaxMm >= 1 ||
    slot.weatherCodes.some((code) => code >= 51 && code <= 82 || code === 95 || code === 96 || code === 99);
  return { effectiveTemp: slot.effectiveTemp, rain };
}
