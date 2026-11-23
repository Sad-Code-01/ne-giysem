import { buildDayOutfit, defaultDayOffset } from '@/logic/outfitEngine';
import { makeDaily, makeSnapshot, makeTwoDays, TEST_PROFILE } from './helpers';
import type { OutfitProfile } from '@/types';

const TODAY = '2026-11-05';
const TOMORROW = '2026-11-06';

/** Tüm saatlerde sabit koşul veren snapshot. */
function uniformSnapshot(
  overrides: Parameters<typeof makeTwoDays>[2] = {},
  currentTime = `${TODAY}T10:00`
) {
  return makeSnapshot({
    currentTime,
    hourly: makeTwoDays(TODAY, TOMORROW, overrides),
    daily: makeDaily(TODAY),
  });
}

const itemIds = (outfit: ReturnType<typeof buildDayOutfit>): string[] =>
  outfit.slots.flatMap((slot) => slot.items.map((item) => item.id));

describe('sıcaklık bantları (6.3)', () => {
  const heroFor = (apparent: number): string =>
    buildDayOutfit(uniformSnapshot({ apparentTemperature: apparent, temperature: apparent })).dayHero.id;

  it('bant sınırlarını doğru seçer (kahraman = dış ?? üst)', () => {
    expect(heroFor(33)).toBe('atlet');
    expect(heroFor(30)).toBe('atlet');
    expect(heroFor(29)).toBe('tisort');
    expect(heroFor(25)).toBe('tisort');
    expect(heroFor(22)).toBe('tisort');
    expect(heroFor(20)).toBe('uzun-kollu');
    expect(heroFor(19)).toBe('uzun-kollu');
    expect(heroFor(15)).toBe('ince-ceket');
    expect(heroFor(10)).toBe('mont');
    expect(heroFor(3)).toBe('kalin-mont');
    expect(heroFor(-2)).toBe('cok-kalin-mont');
  });

  it('ılık bantta effective ≥21 ise tişört, altı uzun kollu', () => {
    const hot = buildDayOutfit(uniformSnapshot({ apparentTemperature: 22, temperature: 22 }));
    const mild = buildDayOutfit(uniformSnapshot({ apparentTemperature: 19, temperature: 19 }));
    expect(hot.slots[0].items.map((i) => i.id)).toContain('tisort');
    expect(mild.slots[0].items.map((i) => i.id)).toContain('uzun-kollu');
  });
});

describe('aynı sıcaklıkta farklı koşullar (kabul kriteri)', () => {
  const base = uniformSnapshot({ apparentTemperature: 20, temperature: 20, weatherCode: 3, windSpeed: 5 });
  const windy = uniformSnapshot({ apparentTemperature: 20, temperature: 20, weatherCode: 3, windSpeed: 35 });
  const sunny = uniformSnapshot({ apparentTemperature: 20, temperature: 22, weatherCode: 0, windSpeed: 5, uvIndex: 8 });
  const rainy = uniformSnapshot({ apparentTemperature: 20, temperature: 20, weatherCode: 61, windSpeed: 5, precipitationProbability: 80 });

  it('dört senaryo farklı çıktı üretir', () => {
    const results = [base, windy, sunny, rainy].map((s) =>
      JSON.stringify(buildDayOutfit(s, TEST_PROFILE))
    );
    expect(new Set(results).size).toBe(4);
  });

  it('rüzgârlıda rüzgârlık önerilir', () => {
    const outfit = buildDayOutfit(windy, TEST_PROFILE);
    expect(itemIds(outfit)).toContain('ruzgarlik');
  });

  it('güneşlide şapka + gözlük önerilir', () => {
    const outfit = buildDayOutfit(sunny, TEST_PROFILE);
    expect(itemIds(outfit)).toContain('sapka');
    expect(itemIds(outfit)).toContain('gunes-gozlugu');
  });

  it('yağmurluda şemsiye + su geçirmez önerilir', () => {
    const outfit = buildDayOutfit(rainy, TEST_PROFILE);
    expect(itemIds(outfit)).toContain('semsiye');
    expect(itemIds(outfit)).toContain('su-gecirmez-bot');
  });

  it('motosiklette daha kalın giyim önerilir (rüzgâr ≥10)', () => {
    const windyBike = uniformSnapshot({
      apparentTemperature: 20,
      temperature: 20,
      weatherCode: 3,
      windSpeed: 15,
    });
    const walk = buildDayOutfit(windyBike, TEST_PROFILE);
    const moto: OutfitProfile = { ...TEST_PROFILE, transport: 'motorcycle' };
    const motoOutfit = buildDayOutfit(windyBike, moto);
    // effective: 20 -3 = 17 → hafif-serin (sweatshirt+ince-ceket) vs yürüyüş 20 → ilık
    expect(motoOutfit.slots[0].band).not.toBe(walk.slots[0].band);
  });
});

describe('kişiselleştirme', () => {
  it('üşüme hassasiyeti bandı değiştirir', () => {
    const snapshot = uniformSnapshot({ apparentTemperature: 13, temperature: 13 });
    const normal = buildDayOutfit(snapshot, TEST_PROFILE);
    const veryCold: OutfitProfile = { ...TEST_PROFILE, coldSensitivity: 'very' };
    const cold = buildDayOutfit(snapshot, veryCold);
    // normal: 13 → hafif-serin; very: 13-3=10 → serin
    expect(normal.slots[0].band).toBe('hafif-serin');
    expect(cold.slots[0].band).toBe('serin');
  });

  it('başlık kahraman etiketinden gelir', () => {
    const cold = uniformSnapshot({ apparentTemperature: 3, temperature: 3 });
    const outfit = buildDayOutfit(cold, TEST_PROFILE);
    expect(outfit.title).toBe('Kalın mont havası.');
  });
});

describe('kaçınılmaz durum (6.4)', () => {
  it('fırtına kodu → "Bugün çıkma."', () => {
    const storm = uniformSnapshot({ weatherCode: 95, apparentTemperature: 20, temperature: 20 });
    const outfit = buildDayOutfit(storm, TEST_PROFILE);
    expect(outfit.avoid).toBe(true);
    expect(outfit.title).toBe('Bugün çıkma.');
    expect(outfit.avoidNote).toContain('evde kal');
  });

  it('aşırı rüzgâr (≥60) → "Bugün çıkma."', () => {
    const windy = uniformSnapshot({ windSpeed: 65, apparentTemperature: 20, temperature: 20 });
    const outfit = buildDayOutfit(windy, TEST_PROFILE);
    expect(outfit.avoid).toBe(true);
  });

  it('normal hava → avoid değil', () => {
    const outfit = buildDayOutfit(uniformSnapshot(), TEST_PROFILE);
    expect(outfit.avoid).toBe(false);
  });
});

describe('akşam dönüşü (6.6)', () => {
  it('akşam belirgin soğuksa uyarı verir', () => {
    // Sabah/öğle ılık (20°), akşam serin (10°) → akşam bandı daha soğuk.
    const hours = [];
    for (let h = 0; h < 24; h += 1) {
      const hh = String(h).padStart(2, '0');
      const evening = h >= 17;
      hours.push({
        time: `${TODAY}T${hh}:00`,
        temperature: evening ? 10 : 20,
        apparentTemperature: evening ? 10 : 20,
        precipitationProbability: 0,
        precipitationMm: 0,
        weatherCode: 3,
        windSpeed: 5,
        uvIndex: 0,
        isDay: h >= 7 && h < 20,
      });
    }
    // Yarın için de aynı seriyi ekle (buildDayOutfit yarını da hesaplayabilir).
    const tomorrowHours = hours.map((p) => ({ ...p, time: p.time.replace(TODAY, TOMORROW) }));
    const snapshot = makeSnapshot({
      currentTime: `${TODAY}T10:00`,
      hourly: [...hours, ...tomorrowHours],
      daily: makeDaily(TODAY),
    });
    const outfit = buildDayOutfit(snapshot, TEST_PROFILE, 0);
    expect(outfit.eveningTurn).toBe(true);
    expect(outfit.warnings).toContain('Akşam hava dönüyor, yanına kat al.');
  });
});

describe('günlük not (5.1-E)', () => {
  it('gün içi fark ≥8°C → not üretir', () => {
    const snapshot = makeSnapshot({
      daily: makeDaily(TODAY, { todayMax: 26, todayMin: 15 }),
      hourly: makeTwoDays(TODAY, TOMORROW),
    });
    const outfit = buildDayOutfit(snapshot, TEST_PROFILE);
    expect(outfit.dailyNote).toBe('Öğleden sonra hava ısınabilir. Sabah çıkıyorsan yanına ceket al.');
  });

  it('gün içi fark <8°C → not yok', () => {
    const snapshot = makeSnapshot({
      daily: makeDaily(TODAY, { todayMax: 21, todayMin: 18 }),
      hourly: makeTwoDays(TODAY, TOMORROW),
    });
    const outfit = buildDayOutfit(snapshot, TEST_PROFILE);
    expect(outfit.dailyNote).toBeUndefined();
  });
});

describe('genel davranış', () => {
  it('deterministik: aynı girdi → aynı çıktı', () => {
    const snapshot = uniformSnapshot({ apparentTemperature: 12, temperature: 12 });
    expect(buildDayOutfit(snapshot, TEST_PROFILE)).toEqual(
      buildDayOutfit(snapshot, TEST_PROFILE)
    );
  });

  it('her dilimde üst+alt+ayakkabı var', () => {
    const outfit = buildDayOutfit(uniformSnapshot({ apparentTemperature: 20, temperature: 20 }), TEST_PROFILE);
    for (const slot of outfit.slots) {
      const cats = slot.items.map((i) => i.category);
      expect(cats).toContain('top');
      expect(cats).toContain('bottom');
      expect(cats).toContain('shoes');
    }
  });

  it('yarın için ayrı hesaplanır (dayOffset=1)', () => {
    const today = buildDayOutfit(uniformSnapshot(), TEST_PROFILE, 0);
    const tomorrow = buildDayOutfit(uniformSnapshot(), TEST_PROFILE, 1);
    expect(today.date).toBe(TODAY);
    expect(tomorrow.date).toBe(TOMORROW);
  });

  it('22:00 sonrası varsayılan yarın', () => {
    const late = uniformSnapshot({}, `${TODAY}T22:30`);
    expect(defaultDayOffset(late)).toBe(1);
    const early = uniformSnapshot({}, `${TODAY}T10:00`);
    expect(defaultDayOffset(early)).toBe(0);
  });
});

describe('yapılandırılmış alerts (Faz 2)', () => {
  it('her uyarı önem derecesi ve zaman penceresi taşır', () => {
    const rainy = makeSnapshot({
      currentTime: `${TODAY}T10:00`,
      hourly: makeTwoDays(TODAY, TOMORROW, {
        weatherCode: 61,
        precipitationProbability: 70,
        precipitationMm: 3,
        apparentTemperature: 10,
        temperature: 10,
      }),
      daily: makeDaily(TODAY),
    });
    const outfit = buildDayOutfit(rainy, TEST_PROFILE, 0);
    expect(outfit.alerts.length).toBeGreaterThan(0);
    for (const alert of outfit.alerts) {
      expect(['info', 'caution', 'severe']).toContain(alert.severity);
      expect(alert.warning.length).toBeGreaterThan(0);
      expect(alert.id.length).toBeGreaterThan(0);
    }
    // Slot kaynaklı uyarılar saat aralığı taşır.
    const slotAlerts = outfit.alerts.filter((a) => a.slot);
    expect(slotAlerts.length).toBeGreaterThan(0);
    for (const alert of slotAlerts) {
      expect(alert.window).toMatch(/\d{2}–\d{2}/);
    }
    // Uyarılar ve alerts aynı metinleri içerir.
    expect(outfit.warnings).toEqual(outfit.alerts.map((a) => a.warning));
  });

  it('kuru havada alerts boş olabilir', () => {
    const dry = uniformSnapshot({ apparentTemperature: 20, temperature: 20 });
    const outfit = buildDayOutfit(dry, TEST_PROFILE, 0);
    // Band notları (ılık) info seviyesinde gelebilir; her alert'in window'u opsiyonel.
    for (const alert of outfit.alerts) {
      expect(alert.warning.length).toBeGreaterThan(0);
    }
  });
});
