import type { OutfitProfile, WeatherSnapshot } from '@/types';
import { buildDayOutfit } from '@/logic/outfitEngine';
import { buildSlotWeathers } from '@/logic/slots';

/**
 * Anlık hava değişimi bildirimleri (roadmap §5.2 ruhu, "aşırı zorlama yok"):
 * yalnızca hava durumu yenilendiğinde ve eşik gerçekten geçildiğinde,
 * günde bir kez tetiklenir. Saatlik tekrar yok, sessiz saat yok —
 * kullanıcı Ayarlar'dan kapatabilir.
 */
export type InstantAlertKind = 'storm' | 'rain' | 'cold';

export interface InstantAlert {
  kind: InstantAlertKind;
  /** Aynı gün aynı tür için tek seferlik anahtar. */
  key: string;
}

const RAIN_PROB_THRESHOLD = 60;
const RAIN_PREV_MAX = 40;
const COLD_DROP_C = 5;

/** Gelecek (past olmayan) slotların en yüksek yağış olasılığı / mm değeri. */
function upcomingRain(slots: ReturnType<typeof buildSlotWeathers>): {
  prob: number;
  mm: number;
} {
  let prob = 0;
  let mm = 0;
  for (const slot of slots) {
    if (slot.past) continue;
    prob = Math.max(prob, slot.precipitationProbabilityMax);
    mm = Math.max(mm, slot.precipitationMaxMm);
  }
  return { prob, mm };
}

/** Gelecek slotlardaki en düşük hissedilen sıcaklık. */
function upcomingMinApparent(slots: ReturnType<typeof buildSlotWeathers>): number {
  let min = Number.POSITIVE_INFINITY;
  for (const slot of slots) {
    if (slot.past) continue;
    min = Math.min(min, slot.avgApparent);
  }
  return min;
}

/**
 * Önceki ve yeni snapshot'ı karşılaştırır; yeni tetiklenen olayları döner.
 * `prev` null ise (ilk yükleme) boş döner — açılışta eski haber vermeyiz.
 */
export function detectInstantAlerts(
  prev: WeatherSnapshot | null,
  next: WeatherSnapshot,
  profile: OutfitProfile
): InstantAlert[] {
  if (!prev) return [];

  const alerts: InstantAlert[] = [];
  const dateKey = buildDayOutfit(next, profile, 0).date;

  // 1) Şiddetli hava (fırtına/yoğun kar/aşırı soğuk-rüzgâr) — motorun severe alert'i.
  const severeNow = buildDayOutfit(next, profile, 0).alerts.some((a) => a.severity === 'severe');
  const severePrev = buildDayOutfit(prev, profile, 0).alerts.some((a) => a.severity === 'severe');
  if (severeNow && !severePrev) {
    alerts.push({ kind: 'storm', key: `storm:${dateKey}` });
  }

  const nextSlots = buildSlotWeathers(next, dateKey, profile);
  const prevSlots = buildSlotWeathers(prev, dateKey, profile);

  // 2) Yağmur eşiği yeni aşıldı (önceki < %40, şimdi ≥ %60 veya ≥ 4mm).
  const rainNow = upcomingRain(nextSlots);
  const rainPrev = upcomingRain(prevSlots);
  const rainTriggered =
    rainNow.prob >= RAIN_PROB_THRESHOLD || rainNow.mm >= 4;
  const rainWasQuiet = rainPrev.prob < RAIN_PREV_MAX && rainPrev.mm < 1;
  if (rainTriggered && rainWasQuiet) {
    alerts.push({ kind: 'rain', key: `rain:${dateKey}` });
  }

  // 3) Sert sıcaklık düşüşü (≥5°C) — örn. cephenin gelişi.
  const coldNow = upcomingMinApparent(nextSlots);
  const coldPrev = upcomingMinApparent(prevSlots);
  if (Number.isFinite(coldNow) && Number.isFinite(coldPrev) && coldPrev - coldNow >= COLD_DROP_C) {
    alerts.push({ kind: 'cold', key: `cold:${dateKey}` });
  }

  return alerts;
}
