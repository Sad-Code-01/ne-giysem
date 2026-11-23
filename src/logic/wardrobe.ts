import { GARMENTS } from '@/logic/garmentCatalog';
import type { Garment } from '@/types';

/**
 * Gardırop entegrasyonu: önerilen parça kullanıcıda yoksa, aynı kategoride
 * en yakın warmth puanına sahip sahip olunan parça ile değiştirilir.
 * Kategoride hiç sahip olunan parça yoksa öneri korunur (ödünç/alışveriş
 * senaryosu için motorun genel önerisi geçerli kalır).
 */

function substitute(item: Garment, ownedIds: ReadonlySet<string>): Garment {
  if (ownedIds.has(item.id)) return item;
  let best: Garment | null = null;
  let bestDiff = Number.POSITIVE_INFINITY;
  for (const candidate of GARMENTS) {
    if (!ownedIds.has(candidate.id) || candidate.category !== item.category) continue;
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
  ownedIds: ReadonlySet<string>
): Garment[] {
  const out: Garment[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    const next = substitute(item, ownedIds);
    if (seen.has(next.id)) continue;
    seen.add(next.id);
    out.push(next);
  }
  return out;
}
