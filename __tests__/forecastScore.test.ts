import {
  brierScore,
  scoreForecastDay,
  summarizeVerifications,
} from '@/logic/forecastScore';

describe('brierScore', () => {
  it('mükemmel tahminde 0 döner', () => {
    expect(brierScore(1, true)).toBe(0);
    expect(brierScore(0, false)).toBe(0);
  });

  it('tamamen yanlış tahminde 1 döner', () => {
    expect(brierScore(1, false)).toBe(1);
    expect(brierScore(0, true)).toBe(1);
  });

  it('olasılığı 0-1 aralığına kırpar', () => {
    expect(brierScore(1.5, true)).toBe(0);
    expect(brierScore(-0.5, false)).toBe(0);
  });
});

describe('scoreForecastDay', () => {
  it('yağmur gerçekleştiğinde Brier hesaplar', () => {
    const result = scoreForecastDay(
      { tempMax: 20, precipProbMax: 80 },
      { precipitationSum: 2.5, temperatureMax: 21 },
      1000
    );
    expect(result.precipOccurred).toBe(true);
    expect(result.brier).toBeCloseTo(0.04);
    expect(result.tempMaxError).toBe(1);
  });

  it('0.1mm altı yağışı "kuru" sayar', () => {
    const result = scoreForecastDay(
      { tempMax: null, precipProbMax: 30 },
      { precipitationSum: 0.05, temperatureMax: null },
      1000
    );
    expect(result.precipOccurred).toBe(false);
    expect(result.brier).toBeCloseTo(0.09);
    expect(result.tempMaxError).toBeNull();
  });

  it('olasılık yoksa Brier null kalır ama sıcaklık hatası hesaplanır', () => {
    const result = scoreForecastDay(
      { tempMax: 18, precipProbMax: null },
      { precipitationSum: null, temperatureMax: 20 },
      1000
    );
    expect(result.brier).toBeNull();
    expect(result.tempMaxError).toBe(2);
  });
});

describe('summarizeVerifications', () => {
  it('boş listede sıfır özet döner', () => {
    const summary = summarizeVerifications([]);
    expect(summary.count).toBe(0);
    expect(summary.avgBrier).toBeNull();
    expect(summary.avgTempError).toBeNull();
    expect(summary.lastVerifiedAt).toBeNull();
  });

  it('null değerleri ortalamadan eler', () => {
    const summary = summarizeVerifications([
      { brier: 0.2, tempMaxError: 1, verifiedAt: 100 },
      { brier: null, tempMaxError: null, verifiedAt: 300 },
      { brier: 0.4, tempMaxError: 3, verifiedAt: 200 },
    ]);
    expect(summary.count).toBe(3);
    expect(summary.avgBrier).toBeCloseTo(0.3);
    expect(summary.avgTempError).toBe(2);
    expect(summary.lastVerifiedAt).toBe(300);
  });
});
