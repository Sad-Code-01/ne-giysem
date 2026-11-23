import { OUTFIT_THRESHOLDS } from '@/constants/config';

/**
 * Öneri geri bildirimi (roadmap §5). Kullanıcı "nasıldı?" sorusuna
 * cevap verir; yalnızca `cold`/`hot` öğrenilen ofseti küçük adımlarla
 * günceller — tek cevapla büyük eşik değişimi olmaz (§5.3).
 */
export type OutfitFeedback = 'cold' | 'perfect' | 'hot' | 'rain' | 'dislike';

/** Tek geri bildirimde ofset adımı (±0.25, sınır ±3). */
const STEP = 0.25;

function clampOffset(value: number): number {
  return Math.min(
    OUTFIT_THRESHOLDS.learnedOffsetMax,
    Math.max(OUTFIT_THRESHOLDS.learnedOffsetMin, value)
  );
}

/**
 * Geri bildirime göre yeni learnedOffset.
 * - üşüdüm  → daha soğuk giy (offset azalır)
 * - sıcakladım → daha serin giy (offset artar)
 * - tam isabet → ofseti sıfıra doğru %10 geri çek (pekiştirme)
 * - ıslak/smadım → ofset değişmez (kayıt için saklanır)
 */
export function applyFeedbackToOffset(offset: number, value: OutfitFeedback): number {
  switch (value) {
    case 'cold':
      return clampOffset(offset - STEP);
    case 'hot':
      return clampOffset(offset + STEP);
    case 'perfect':
      if (offset === 0) return 0;
      return clampOffset(offset - Math.sign(offset) * Math.min(0.3, Math.abs(offset) * 0.1));
    default:
      return offset;
  }
}
