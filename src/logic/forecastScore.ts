/**
 * Tahmin doğruluğu (roadmap §5.4): arşivlenen günlük tahmin ile gerçekleşen
 * yağış/sıcaklık karşılaştırılır. Yağmur için Brier skoru (0 = mükemmel,
 * 1 = en kötü), sıcaklık için MAE (°C) hesaplanır.
 * Tamamen saf fonksiyonlar — ağ/depoya dokunmaz, test edilebilir.
 */

/** Arşivdeki tek bir gün tahmini. */
export interface ForecastRecord {
  /** Tahminin geçerli olduğu gün, "YYYY-MM-DD". */
  targetDate: string;
  /** Kaydın alındığı an (epoch ms). */
  recordedAt: number;
  latitude: number;
  longitude: number;
  /** Yağmur gerçekleşme eşiği: precipitation_sum bu değerin üstündeyse "yağdı". */
  tempMax: number | null;
  tempMin: number | null;
  /** Günlük maksimum yağış olasılığı (%0-100); veri yoksa null. */
  precipProbMax: number | null;
}

/** Gerçekleşen gün sonucu (geçmiş veri). */
export interface ActualDay {
  precipitationSum: number | null;
  temperatureMax: number | null;
}

/** Doğrulama sonucu. */
export interface DayVerification {
  /** Brier skoru 0..1; olasılık verisi yoksa null. */
  brier: number | null;
  /** Yağmur gerçekleşti mi (eşik: ≥0.1 mm). */
  precipOccurred: boolean | null;
  /** |tahmin max − gerçek max| (°C); veri yoksa null. */
  tempMaxError: number | null;
  verifiedAt: number;
}

/** Brier skoru: (p − o)² — p olasılık (0..1), o sonuç (0/1). */
export function brierScore(probability: number, occurred: boolean): number {
  const p = Math.min(1, Math.max(0, probability));
  const o = occurred ? 1 : 0;
  return (p - o) * (p - o);
}

/** Tek gün tahminini gerçekleşen sonuçla puanlar. */
export function scoreForecastDay(
  forecast: Pick<ForecastRecord, 'tempMax' | 'precipProbMax'>,
  actual: ActualDay,
  verifiedAt: number
): DayVerification {
  const precipOccurred =
    actual.precipitationSum === null ? null : actual.precipitationSum >= 0.1;
  const brier =
    forecast.precipProbMax === null || precipOccurred === null
      ? null
      : brierScore(forecast.precipProbMax / 100, precipOccurred);
  const tempMaxError =
    forecast.tempMax === null || actual.temperatureMax === null
      ? null
      : Math.abs(forecast.tempMax - actual.temperatureMax);

  return { brier, precipOccurred, tempMaxError, verifiedAt };
}

export interface AccuracySummary {
  /** Doğrulanmış gün sayısı. */
  count: number;
  /** Ortalama Brier skoru (null Brier'ler elenir). */
  avgBrier: number | null;
  /** Ortalama sıcaklık hatası (°C). */
  avgTempError: number | null;
  lastVerifiedAt: number | null;
}

/** Doğrulama listesinden özet istatistik üretir. */
export function summarizeVerifications(
  verifications: { brier: number | null; tempMaxError: number | null; verifiedAt: number }[]
): AccuracySummary {
  const briers = verifications.map((v) => v.brier).filter((v): v is number => v !== null);
  const temps = verifications.map((v) => v.tempMaxError).filter((v): v is number => v !== null);
  const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  return {
    count: verifications.length,
    avgBrier: briers.length ? avg(briers) : null,
    avgTempError: temps.length ? avg(temps) : null,
    lastVerifiedAt: verifications.length
      ? Math.max(...verifications.map((v) => v.verifiedAt))
      : null,
  };
}
