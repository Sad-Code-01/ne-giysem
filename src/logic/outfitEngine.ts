import { OUTFIT_THRESHOLDS } from '@/constants/config';
import { garmentLabel, requireGarment } from '@/logic/garmentCatalog';
import { t } from '@/i18n';
import {
  bandLabel,
  isPrecipitationCode,
  isSnowCode,
  isStormCode,
} from '@/logic/weatherCodes';
import { addDays, buildSlotWeathers, dayKeyOf } from '@/logic/slots';
import { applyWardrobe, wardrobeContextForSlot } from '@/logic/wardrobe';
import type {
  DayAlert,
  DayOutfit,
  Garment,
  OutfitProfile,
  RainPreference,
  TimeSlotId,
  SlotOutfit,
  SlotWeather,
  TempBand,
  WeatherSnapshot,
} from '@/types';
import { DEFAULT_PROFILE } from '@/logic/effectiveTemp';

/**
 * Öneri motoru v2 (Yönerge 6.3–6.6). Saf ve deterministiktir; aynı girdi → aynı çıktı.
 */

interface BandSpec {
  band: TempBand;
  /** Üst katman kimlikleri (sırayla). */
  tops: string[];
  /** Alt katman kimlikleri. */
  bottoms: string[];
  /** Ara katman (opsiyonel). */
  mids: string[];
  /** Dış giyim kimlikleri. */
  outers: string[];
  /** Ayakkabı kimliği. */
  shoes: string;
  /** Ek aksesuarlar. */
  accessories: string[];
}

/** 6.3 sıcaklık bantları: `effective`'e göre taban kombin. */
function bandFor(effective: number): BandSpec {
  if (effective >= 30) {
    return {
      band: 'cok-sicak', tops: ['atlet'], bottoms: ['sort'], mids: [], outers: [],
      shoes: 'sandalet', accessories: [],
    };
  }
  if (effective >= 24) {
    return {
      band: 'sicak', tops: ['tisort'], bottoms: ['sort'], mids: [], outers: [],
      shoes: 'spor-ayakkabi', accessories: [],
    };
  }
  if (effective >= 18) {
    return {
      band: 'ilik',
      tops: [effective >= 21 ? 'tisort' : 'uzun-kollu'],
      bottoms: ['jean'], mids: [], outers: [],
      shoes: 'spor-ayakkabi', accessories: [],
    };
  }
  if (effective >= 12) {
    return {
      band: 'hafif-serin', tops: ['sweatshirt'], bottoms: ['jean'], mids: [],
      outers: ['ince-ceket'], shoes: 'spor-ayakkabi', accessories: [],
    };
  }
  if (effective >= 6) {
    return {
      band: 'serin', tops: ['kazak'], bottoms: ['kalin-pantolon'], mids: [],
      outers: ['mont'], shoes: 'kapali-ayakkabi', accessories: [],
    };
  }
  if (effective >= 0) {
    return {
      band: 'soguk', tops: ['termal-ust', 'kazak'], bottoms: ['kalin-pantolon'], mids: [],
      outers: ['kalin-mont'], shoes: 'bot', accessories: ['bere', 'atki'],
    };
  }
  return {
    band: 'cok-soguk', tops: ['termal-ust', 'kazak'], bottoms: ['termal-alt', 'kalin-pantolon'],
    mids: [], outers: ['cok-kalin-mont'], shoes: 'su-gecirmez-bot',
    accessories: ['bere', 'atki', 'eldiven'],
  };
}

/** Listede kategoriye göre ilk parçayı bulur. */
function findByCategory(items: Garment[], category: Garment['category']): Garment | undefined {
  return items.find((item) => item.category === category);
}

/** Parçayı listede id'ye göre değiştirir; yoksa ekler. */
function upsert(items: Garment[], garment: Garment): Garment[] {
  const index = items.findIndex((item) => item.id === garment.id);
  if (index >= 0) {
    const next = [...items];
    next[index] = garment;
    return next;
  }
  return [...items, garment];
}

/** Kategoriye göre ilk parçayı başka bir parçayla değiştirir. */
function replaceFirstOfCategory(
  items: Garment[],
  category: Garment['category'],
  garment: Garment
): Garment[] {
  const index = items.findIndex((item) => item.category === category);
  if (index < 0) return upsert(items, garment);
  const next = [...items];
  next[index] = garment;
  return next;
}

function hasId(items: Garment[], id: string): boolean {
  return items.some((item) => item.id === id);
}

/**
 * Tek dilim için taban kombin + koşul düzeltmeleri (6.5).
 * `humidity`: nem kontrolü için anlık nem (%).
 */
export function buildSlotOutfit(
  slot: SlotWeather,
  humidity: number,
  options?: { rainPreference?: RainPreference }
): SlotOutfit {
  const spec = bandFor(slot.effectiveTemp);
  const warnings: string[] = [];

  let items: Garment[] = [
    ...spec.tops.map(requireGarment),
    ...spec.bottoms.map(requireGarment),
    ...spec.mids.map(requireGarment),
    ...spec.outers.map(requireGarment),
    requireGarment(spec.shoes),
    ...spec.accessories.map(requireGarment),
  ];

  const precip = slot.precipitationProbabilityMax;
  const precipMm = slot.precipitationMaxMm;
  const wetCode = slot.weatherCodes.some(isPrecipitationCode);
  const snowing = slot.weatherCodes.some(isSnowCode);
  const storming = slot.weatherCodes.some(isStormCode);
  const coldRain = slot.effectiveTemp < OUTFIT_THRESHOLDS.rainShoeBelow;
  let rainNote: string | undefined;

  // Yağmur: olasılık, miktar (mm) ve WMO kodu ayrı sinyallerdir;
  // herhangi biri eşiği aşarsa şemsiye önerilir, güçlüsü mont/bot.
  // Kullanıcının yağmur tercihi eşikleri kaydırır (profil.rainPreference).
  const pref = options?.rainPreference ?? 'both';
  const umbrellaMin = pref === 'strong-only' ? 70 : OUTFIT_THRESHOLDS.rainUmbrella;
  const umbrellaMm = pref === 'strong-only' ? 3 : 1;
  const waterproofMin =
    pref === 'raincoat' ? 50 : pref === 'umbrella' ? 80 : OUTFIT_THRESHOLDS.rainWaterproof;
  const waterproofMm = pref === 'raincoat' ? 3 : pref === 'umbrella' ? 6 : 4;
  const codeSignal = wetCode && (pref !== 'strong-only' || precipMm >= 2);
  const rainSignal = codeSignal || precip >= umbrellaMin || precipMm >= umbrellaMm;
  const heavyRain = precip >= waterproofMin || wetCode || precipMm >= waterproofMm;
  if (rainSignal) {
    if (!hasId(items, 'semsiye')) items = upsert(items, requireGarment('semsiye'));
    if (heavyRain) {
      const shellId = coldRain ? 'su-gecirmez-mont' : 'yagmurluk';
      const outer = findByCategory(items, 'outer');
      if (!outer?.waterproof) {
        items = outer
          ? replaceFirstOfCategory(items, 'outer', requireGarment(shellId))
          : upsert(items, requireGarment(shellId));
      }
      items = replaceFirstOfCategory(items, 'shoes', requireGarment('su-gecirmez-bot'));
    }
    if (wetCode && precip < OUTFIT_THRESHOLDS.rainUmbrella && precipMm < 1) {
      rainNote = t('outfit.rainNow', { when: slot.hourLabel });
    } else if (heavyRain) {
      rainNote = coldRain
        ? t('outfit.rainCold', { when: slot.hourLabel })
        : t('outfit.rainWarm', { when: slot.hourLabel });
    } else {
      rainNote = t('outfit.rainChance', { when: slot.hourLabel });
    }
    warnings.push(rainNote);
  }

  // Kar: su geçirmez bot + bere + eldiven.
  if (snowing) {
    items = replaceFirstOfCategory(items, 'shoes', requireGarment('su-gecirmez-bot'));
    if (!hasId(items, 'bere')) items = upsert(items, requireGarment('bere'));
    if (!hasId(items, 'eldiven')) items = upsert(items, requireGarment('eldiven'));
    warnings.push(t('outfit.snow'));
  }

  // Rüzgâr: rüzgâr geçirmez dış katmanı garanti et.
  if (slot.maxWind >= OUTFIT_THRESHOLDS.windOuterLayer) {
    const outer = findByCategory(items, 'outer');
    const windproofOuter = outer?.windproof === true;
    if (!windproofOuter && !hasId(items, 'ruzgarlik')) {
      items = upsert(items, requireGarment('ruzgarlik'));
    }
    warnings.push(t('outfit.wind'));
  }

  // Güneş: gündüz + UV yüksek → şapka + gözlük.
  if (slot.isDay && slot.maxUv >= OUTFIT_THRESHOLDS.uvProtection) {
    if (!hasId(items, 'sapka')) items = upsert(items, requireGarment('sapka'));
    if (!hasId(items, 'gunes-gozlugu')) items = upsert(items, requireGarment('gunes-gozlugu'));
    warnings.push(t('outfit.sun'));
  }

  // Nemli-sıcak: bağıl nem veya çiy noktası (API) eşiği.
  const muggy =
    slot.dewPointMax >= OUTFIT_THRESHOLDS.muggyDewPoint && slot.avgTemp >= OUTFIT_THRESHOLDS.muggyTemperature;
  if (
    (humidity >= OUTFIT_THRESHOLDS.humidWarmHumidity && slot.avgTemp >= OUTFIT_THRESHOLDS.humidWarmTemperature) ||
    muggy
  ) {
    warnings.push(t('outfit.humid'));
  }

  // Sis: görüş 1 km altına düşerse güvenlik uyarısı.
  if (slot.visibilityMin < OUTFIT_THRESHOLDS.fogVisibilityM) {
    warnings.push(t('outfit.fog'));
  }

  // Bant notları.
  if (spec.band === 'cok-sicak') {
    warnings.push(t('outfit.hotNote'));
  }
  if (spec.band === 'soguk' || spec.band === 'cok-soguk') {
    warnings.push(t('outfit.coldNote'));
  }

  // Kaçınılmaz durum (6.4): fırtına, yoğun kar, aşırı soğuk, aşırı rüzgâr.
  const avoid =
    storming ||
    slot.weatherCodes.some((code) =>
      (OUTFIT_THRESHOLDS.avoidHeavySnowCodes as readonly number[]).includes(code)
    ) ||
    slot.effectiveTemp <= OUTFIT_THRESHOLDS.avoidEffectiveTemp ||
    slot.maxWind >= OUTFIT_THRESHOLDS.avoidWindSpeed;

  // Kahraman: dış varsa o, yoksa ilk üst.
  const hero = findByCategory(items, 'outer') ?? findByCategory(items, 'top') ?? items[0];

  return {
    slot: slot.slot,
    band: spec.band,
    bandLabel: bandLabel(spec.band),
    hero,
    items,
    warnings,
    rainNote,
    level: avoid ? 'avoid' : 'normal',
    effectiveTemp: slot.effectiveTemp,
    past: slot.past,
  };
}

const BAND_ORDER: TempBand[] = [
  'cok-sicak',
  'sicak',
  'ilik',
  'hafif-serin',
  'serin',
  'soguk',
  'cok-soguk',
];

function bandIndex(band: TempBand): number {
  return BAND_ORDER.indexOf(band);
}

/**
 * Bir gün (Bugün/Yarın) için tam öneri üretir.
 * `dayOffset`: 0 = bugün, 1 = yarın.
 */
export function buildDayOutfit(
  snapshot: WeatherSnapshot,
  profile: OutfitProfile = DEFAULT_PROFILE,
  dayOffset: number = 0
): DayOutfit {
  const today = dayKeyOf(snapshot.current.time);
  const date = addDays(today, dayOffset);
  const slotWeathers = buildSlotWeathers(snapshot, date, profile);

  const wardrobeIds = profile.wardrobe?.length ? new Set(profile.wardrobe) : null;
  const slots: SlotOutfit[] = slotWeathers.map((slotWeather) => {
    const outfit = buildSlotOutfit(slotWeather, snapshot.current.humidity, {
      rainPreference: profile.rainPreference,
    });
    if (!wardrobeIds) return outfit;
    // Gardırop ikamesi slot'un kendi havasına göre filtrelenir:
    // soğuk/yağmurlu havada uyumsuz parça (şort, ıslak ayakkabı) seçilmez.
    const items = applyWardrobe(outfit.items, wardrobeIds, wardrobeContextForSlot(slotWeather));
    const hero =
      items.find((item) => item.category === 'outer') ??
      items.find((item) => item.category === 'top') ??
      items[0];
    return { ...outfit, items, hero };
  });

  // Geçmiş dilimler "bugünün geleceği" gibi sunulmasın: başlık, kahraman,
  // uyarılar ve akşam analizi yalnızca henüz bitmemiş dilimlerden üretilir.
  // Tüm dilimler geçmişse (gün sonu) mevcut davranış korunur.
  const activeSlots = slots.some((slot) => !slot.past)
    ? slots.filter((slot) => !slot.past)
    : slots;

  // Gün kahramanı: aktif dilim kahramanlarından en yüksek puanlı.
  const dayHero = activeSlots.reduce((best, slot) =>
    slot.hero.warmth > best.hero.warmth ? slot : best
  ).hero;

  const anyAvoid = activeSlots.some((slot) => slot.level === 'avoid');
  const title = anyAvoid
    ? t('outfit.todayExit')
    : t('outfit.titleWeather', { item: garmentLabel(dayHero) });
  const avoidNote = anyAvoid ? t('outfit.exitNote') : undefined;

  // Akşam dönüşü (6.6) — slot hava verisiyle.
  const sabahW = slotWeathers.find((item) => item.slot === 'sabah');
  const ogleW = slotWeathers.find((item) => item.slot === 'ogle');
  const aksamW = slotWeathers.find((item) => item.slot === 'aksam');
  const sabahOut = slots.find((item) => item.slot === 'sabah');
  const ogleOut = slots.find((item) => item.slot === 'ogle');
  const aksamOut = slots.find((item) => item.slot === 'aksam');

  let eveningTurn = false;
  const eveningWarnings: string[] = [];
  // Akşam dilimi geçmişse "akşam daha soğuk/yağmurlu" uyarısı anlamsızlaşır.
  if (sabahW && ogleW && aksamW && sabahOut && ogleOut && aksamOut && !aksamW.past) {
    const morningColdest = Math.min(bandIndex(sabahOut.band), bandIndex(ogleOut.band));
    const colder =
      bandIndex(aksamOut.band) - morningColdest >= OUTFIT_THRESHOLDS.eveningTurnBandDiff;
    const rainTurn =
      aksamW.precipitationProbabilityMax >= OUTFIT_THRESHOLDS.eveningTurnRain &&
      sabahW.precipitationProbabilityMax < OUTFIT_THRESHOLDS.eveningTurnRainMorningMax &&
      ogleW.precipitationProbabilityMax < OUTFIT_THRESHOLDS.eveningTurnRainMorningMax;

    if (colder) {
      eveningTurn = true;
      eveningWarnings.push(t('outfit.eveningTurn'));
    }
    if (rainTurn) {
      eveningTurn = true;
      eveningWarnings.push(t('outfit.eveningRain'));
    }
  }

  // Birleşik uyarılar: slot uyarıları (sırayla, tekil) + akşam + gün notu.
  const warnings: string[] = [];
  const alerts: DayAlert[] = [];
  const seen = new Set<string>();
  const slotWindow = (slotId: TimeSlotId): string | undefined =>
    slotWeathers.find((item) => item.slot === slotId)?.hourLabel;
  const push = (text: string, alert?: Omit<DayAlert, 'warning'>): void => {
    if (seen.has(text)) return;
    seen.add(text);
    warnings.push(text);
    if (alert) alerts.push({ ...alert, warning: text });
  };
  const bandNoteTexts = new Set([t('outfit.hotNote'), t('outfit.coldNote')]);
  for (const slot of activeSlots) {
    slot.warnings.forEach((warning, index) =>
      push(warning, {
        id: `${slot.slot}:${index}`,
        severity: bandNoteTexts.has(warning) ? 'info' : 'caution',
        slot: slot.slot,
        window: slotWindow(slot.slot),
      })
    );
  }
  eveningWarnings.forEach((warning, index) =>
    push(warning, {
      id: `evening:${index}`,
      severity: 'info',
      window: aksamW && !aksamW.past ? aksamW.hourLabel : undefined,
    })
  );

  // Gün içi sıcaklık farkı ≥10 → katmanlı giyin.
  const daySummary = snapshot.daily.find((day) => day.date === date);
  if (daySummary) {
    const swing = daySummary.temperatureMax - daySummary.temperatureMin;
    if (swing >= OUTFIT_THRESHOLDS.layersDailySwing) {
      push(t('outfit.layers'), { id: 'day:layers', severity: 'info' });
    }
  }

  // Günlük not: yalnızca gün içi fark ≥8°C (5.1-E).
  let dailyNote: string | undefined;
  if (daySummary) {
    const swing = Math.round(daySummary.temperatureMax - daySummary.temperatureMin);
    if (swing >= OUTFIT_THRESHOLDS.noteDailySwing) {
      dailyNote = t('outfit.dailyNote');
    }
  }

  let rainLine: string | undefined;
  let bestPrecip = -1;
  activeSlots.forEach((slotOutfit) => {
    const note = slotOutfit.rainNote;
    const precip = slotWeathers.find((item) => item.slot === slotOutfit.slot)?.precipitationProbabilityMax ?? 0;
    if (note && precip >= bestPrecip) {
      bestPrecip = precip;
      rainLine = note;
    }
  });

  return {
    date,
    title,
    avoid: anyAvoid,
    avoidNote,
    slots,
    dayHero,
    warnings,
    alerts,
    rainLine,
    eveningTurn,
    dailyNote,
  };
}

/** UI'da gösterilecek dilimler: geçmiş olanlar hariç; hepsi geçmişse tümü. */
export function upcomingSlots(day: DayOutfit): SlotOutfit[] {
  const active = day.slots.filter((slot) => !slot.past);
  return active.length ? active : day.slots;
}

/** Bugün ekranında en fazla iki satır: akşam, yağmur ya da “yağmur yok”. */
export function adviceLines(day: DayOutfit): string[] {
  const lines: string[] = [];
  const eveningRain = day.warnings.find((line) => line === t('outfit.eveningRain'));
  const eveningTurn = day.warnings.find((line) => line === t('outfit.eveningTurn'));
  if (eveningRain) lines.push(eveningRain);
  else if (eveningTurn) lines.push(eveningTurn);
  if (day.rainLine && !lines.includes(day.rainLine)) lines.push(day.rainLine);
  if (!day.rainLine && !eveningRain) lines.push(t('outfit.noRain'));
  if (lines.length < 2) {
    const extra = day.warnings.find((line) => !lines.includes(line) && line !== day.rainLine);
    if (extra) lines.push(extra);
  }
  return lines.slice(0, 2);
}

const BAND_TARGET: Record<TempBand, number> = {
  'cok-sicak': 2,
  sicak: 3,
  ilik: 5,
  'hafif-serin': 7,
  serin: 10,
  soguk: 13,
  'cok-soguk': 17,
};

/** Dilimin hedef sıcaklık puanı (6.3). */
export function targetScore(band: TempBand): number {
  return BAND_TARGET[band];
}

/** UI'da "Bugün/Yarın" seçimi için varsayılan gün ofseti: 22:00 sonrası → yarın. */
export function defaultDayOffset(snapshot: WeatherSnapshot): 0 | 1 {
  const hour = Number(snapshot.current.time.slice(11, 13));
  return hour >= 22 ? 1 : 0;
}

/** Seçilebilir gün ofsetleri. */
export const DAY_OFFSETS = [0, 1] as const;
