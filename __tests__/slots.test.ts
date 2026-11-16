import { buildSlotWeathers, addDays, meanPast14 } from '@/logic/slots';
import { makeSnapshot, makeTwoDays, TEST_PROFILE } from './helpers';

const TODAY = '2026-11-05';
const TOMORROW = '2026-11-06';

describe('buildSlotWeathers — dilim tanımları', () => {
  it('üç dilim üretir: sabah/öğle/akşam', () => {
    const snapshot = makeSnapshot({
      hourly: makeTwoDays(TODAY, TOMORROW),
    });
    const slots = buildSlotWeathers(snapshot, TODAY, TEST_PROFILE);
    expect(slots.map((s) => s.slot)).toEqual(['sabah', 'ogle', 'aksam']);
    expect(slots.map((s) => s.hourLabel)).toEqual(['08–12', '12–17', '17–22']);
  });

  it('sabah 08–11, öğle 12–16, akşam 17–21 saatlerini kapsar', () => {
    // Her saate farklı sıcaklık ver; ortalamalar doğrulanır.
    const hours = [];
    for (let h = 0; h < 24; h += 1) {
      const hh = String(h).padStart(2, '0');
      hours.push({
        time: `${TODAY}T${hh}:00`,
        temperature: h,
        apparentTemperature: h,
        precipitationProbability: 0,
        weatherCode: 3,
        windSpeed: 5,
        uvIndex: 0,
        isDay: h >= 7 && h < 20,
      });
    }
    const snapshot = makeSnapshot({ hourly: hours });
    const slots = buildSlotWeathers(snapshot, TODAY, TEST_PROFILE);
    // Sabah: 8+9+10+11 = 38/4 = 9.5
    expect(slots[0].avgApparent).toBeCloseTo(9.5, 5);
    // Öğle: 12..16 = 70/5 = 14
    expect(slots[1].avgApparent).toBeCloseTo(14, 5);
    // Akşam: 17..21 = 95/5 = 19
    expect(slots[2].avgApparent).toBeCloseTo(19, 5);
  });
});

describe('buildSlotWeathers — geçmiş dilim', () => {
  it('saat 10:00 iken sabah bitmemiş sayılır (bitiş 12)', () => {
    const snapshot = makeSnapshot({
      currentTime: `${TODAY}T10:00`,
      hourly: makeTwoDays(TODAY, TOMORROW),
    });
    const slots = buildSlotWeathers(snapshot, TODAY, TEST_PROFILE);
    expect(slots.every((s) => !s.past)).toBe(true);
  });

  it('saat 13:00 iken sabah geçmiş sayılır', () => {
    const snapshot = makeSnapshot({
      currentTime: `${TODAY}T13:00`,
      hourly: makeTwoDays(TODAY, TOMORROW),
    });
    const slots = buildSlotWeathers(snapshot, TODAY, TEST_PROFILE);
    expect(slots[0].past).toBe(true);
    expect(slots[1].past).toBe(false);
    expect(slots[2].past).toBe(false);
  });

  it('yarının dilimleri asla geçmiş sayılmaz', () => {
    const snapshot = makeSnapshot({
      currentTime: `${TODAY}T23:00`,
      hourly: makeTwoDays(TODAY, TOMORROW),
    });
    const slots = buildSlotWeathers(snapshot, TOMORROW, TEST_PROFILE);
    expect(slots.every((s) => !s.past)).toBe(true);
  });
});

describe('buildSlotWeathers — özet alanlar', () => {
  it('max rüzgâr, max UV ve yağış olasılığı doğru hesaplanır', () => {
    const hours = [];
    for (let h = 0; h < 24; h += 1) {
      const hh = String(h).padStart(2, '0');
      hours.push({
        time: `${TODAY}T${hh}:00`,
        temperature: 20,
        apparentTemperature: 20,
        precipitationProbability: h === 9 ? 70 : 10,
        weatherCode: h === 9 ? 61 : 3,
        windSpeed: h === 14 ? 40 : 5,
        uvIndex: h === 13 ? 8 : 1,
        isDay: h >= 7 && h < 20,
      });
    }
    const snapshot = makeSnapshot({ hourly: hours });
    const slots = buildSlotWeathers(snapshot, TODAY, TEST_PROFILE);
    expect(slots[0].precipitationProbabilityMax).toBe(70);
    expect(slots[1].maxWind).toBe(40);
    expect(slots[1].maxUv).toBe(8);
  });

  it('effectiveTemp her dilim için hesaplanır', () => {
    const snapshot = makeSnapshot({ hourly: makeTwoDays(TODAY, TOMORROW) });
    const slots = buildSlotWeathers(snapshot, TODAY, TEST_PROFILE);
    for (const slot of slots) {
      expect(typeof slot.effectiveTemp).toBe('number');
      expect(Number.isFinite(slot.effectiveTemp)).toBe(true);
    }
  });
});

describe('yardımcılar', () => {
  it('addDays tarih taşmasını doğru yapar', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('meanPast14 yalnız geçmiş günleri ortalar', () => {
    const snapshot = makeSnapshot();
    const mean = meanPast14(snapshot);
    expect(mean).toBeCloseTo(15, 5);
  });
});
