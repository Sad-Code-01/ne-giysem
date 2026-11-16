import {
  COLD_SENSITIVITY_OFFSET,
  computeEffectiveTemp,
  profileOffsetOf,
  TRANSPORT_PENALTY,
} from '@/logic/effectiveTemp';
import { DEFAULT_PROFILE } from '@/logic/effectiveTemp';
import type { EffectiveTempInput } from '@/logic/effectiveTemp';
import type { OutfitProfile } from '@/types';

function baseInput(overrides: Partial<EffectiveTempInput> = {}): EffectiveTempInput {
  return {
    avgApparent: 20,
    avgTemp: 20,
    maxWind: 5,
    maxUv: 0,
    weatherCodes: [3],
    profileOffset: 0,
    learnedOffset: 0,
    mean14: 15,
    transport: 'walk',
    ...overrides,
  };
}

describe('computeEffectiveTemp — rüzgâr', () => {
  it('maks rüzgâr ≥30 → −1°C', () => {
    expect(computeEffectiveTemp(baseInput({ maxWind: 30 }))).toBe(19);
    expect(computeEffectiveTemp(baseInput({ maxWind: 45 }))).toBe(19);
  });

  it('maks rüzgâr <30 → ceza yok', () => {
    expect(computeEffectiveTemp(baseInput({ maxWind: 29 }))).toBe(20);
  });
});

describe('computeEffectiveTemp — güneş', () => {
  it('açık kod + UV≥6 + ort sıcaklık≥20 → +1°C', () => {
    const result = computeEffectiveTemp(
      baseInput({ weatherCodes: [0, 1], maxUv: 6, avgTemp: 20 })
    );
    expect(result).toBe(21);
  });

  it('UV düşükse bonus yok', () => {
    expect(
      computeEffectiveTemp(baseInput({ weatherCodes: [0], maxUv: 5, avgTemp: 25 }))
    ).toBe(20);
  });

  it('ort sıcaklık <20 ise bonus yok', () => {
    expect(
      computeEffectiveTemp(baseInput({ weatherCodes: [0], maxUv: 8, avgTemp: 19 }))
    ).toBe(20);
  });

  it('kapalı kodda bonus yok', () => {
    expect(
      computeEffectiveTemp(baseInput({ weatherCodes: [3], maxUv: 8, avgTemp: 25 }))
    ).toBe(20);
  });
});

describe('computeEffectiveTemp — ulaşım', () => {
  it('motosiklet −3, yalnız rüzgâr ≥10 ise', () => {
    expect(
      computeEffectiveTemp(baseInput({ transport: 'motorcycle', maxWind: 10 }))
    ).toBe(17);
    expect(
      computeEffectiveTemp(baseInput({ transport: 'motorcycle', maxWind: 9 }))
    ).toBe(20);
  });

  it('bisiklet −1.5, rüzgâr ≥10 ise', () => {
    expect(
      computeEffectiveTemp(baseInput({ transport: 'bike', maxWind: 12 }))
    ).toBe(18.5);
  });

  it('yürüyüş/otobüs/araba cezasız', () => {
    for (const transport of ['walk', 'transit', 'car'] as const) {
      expect(
        computeEffectiveTemp(baseInput({ transport, maxWind: 20 }))
      ).toBe(20);
    }
  });
});

describe('computeEffectiveTemp — kişisel ofset', () => {
  it('profileOffset + learnedOffset toplanır', () => {
    expect(
      computeEffectiveTemp(
        baseInput({ profileOffset: -1.5, learnedOffset: 1 })
      )
    ).toBe(19.5);
  });

  it('profileOffsetOf doğru eşler', () => {
    expect(profileOffsetOf({ ...DEFAULT_PROFILE, coldSensitivity: 'very' })).toBe(-3);
    expect(profileOffsetOf({ ...DEFAULT_PROFILE, coldSensitivity: 'none' })).toBe(3);
    expect(COLD_SENSITIVITY_OFFSET.normal).toBe(0);
    expect(TRANSPORT_PENALTY.motorcycle).toBe(-3);
  });
});

describe('computeEffectiveTemp — iklim alışması', () => {
  it('mean14 < 15 → pozitif ofset (daha çabuk üşür)', () => {
    // (15-10)*0.15 = 0.75
    expect(computeEffectiveTemp(baseInput({ mean14: 10 }))).toBe(20.75);
  });

  it('mean14 > 15 → negatif ofset (sıcağa alışkın)', () => {
    // (15-25)*0.15 = -1.5
    expect(computeEffectiveTemp(baseInput({ mean14: 25 }))).toBe(18.5);
  });

  it('ofset −2…+2 aralığında kırpılır', () => {
    // mean14=0 → (15)*0.15=2.25 → kırpılır 2
    expect(computeEffectiveTemp(baseInput({ mean14: 0 }))).toBe(22);
    // mean14=40 → (15-40)*0.15=-3.75 → kırpılır -2
    expect(computeEffectiveTemp(baseInput({ mean14: 40 }))).toBe(18);
  });
});

describe('computeEffectiveTemp — birleşik', () => {
  it('tüm düzeltmeler birlikte uygulanır', () => {
    const result = computeEffectiveTemp(
      baseInput({
        avgApparent: 20,
        maxWind: 35, // -1
        weatherCodes: [0],
        maxUv: 7,
        avgTemp: 22, // +1
        transport: 'motorcycle', // -3 (rüzgâr ≥10)
        profileOffset: -1.5,
        learnedOffset: 0.5,
        mean14: 10, // +0.75
      })
    );
    // 20 -1 +1 -3 -1.5 +0.5 +0.75 = 16.75
    expect(result).toBeCloseTo(16.75, 5);
  });
});
