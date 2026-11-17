import { garmentLabel } from '@/logic/garmentCatalog';
import type { Garment, GarmentCategory } from '@/types';

/**
 * Kıyafet kartı satır grupları: görünüm katmanında kategoriye göre
 * birleştirilir; outfitEngine'e dokunulmaz.
 * `top`/`base`/`mid` → "Üst", `bottom`/`base-bottom` → "Alt".
 */

export type OutfitGroupKey = 'top' | 'bottom' | 'outer' | 'shoes' | 'accessory';

export interface OutfitGroup {
  key: OutfitGroupKey;
  /** i18n kategori etiketi anahtarı (cat.*). */
  labelKey: string;
  items: Garment[];
}

const GROUP_OF: Record<GarmentCategory, OutfitGroupKey> = {
  top: 'top',
  base: 'top',
  mid: 'top',
  bottom: 'bottom',
  'base-bottom': 'bottom',
  outer: 'outer',
  shoes: 'shoes',
  accessory: 'accessory',
};

const LABEL_KEY: Record<OutfitGroupKey, string> = {
  top: 'cat.top',
  bottom: 'cat.bottom',
  outer: 'cat.outer',
  shoes: 'cat.shoes',
  accessory: 'cat.accessory',
};

/** İlk görülme sırasını koruyarak öğeleri grup hâlinde döner. */
export function groupOutfitItems(items: readonly Garment[]): OutfitGroup[] {
  const groups = new Map<OutfitGroupKey, Garment[]>();
  for (const item of items) {
    const key = GROUP_OF[item.category] ?? 'accessory';
    const list = groups.get(key);
    if (list) list.push(item);
    else groups.set(key, [item]);
  }
  return [...groups.entries()].map(([key, groupItems]) => ({
    key,
    labelKey: LABEL_KEY[key],
    items: groupItems,
  }));
}

/**
 * Grup içi öğe adlarını tek satıra birleştirir:
 * katman grupları "Termal + kazak", aksesuarlar "Bere, atkı".
 */
export function joinGarmentNames(group: OutfitGroup): string {
  const names = group.items.map(garmentLabel);
  return group.key === 'accessory' ? names.join(', ') : names.join(' + ');
}

/** Tekrar eden satırları kaldırır (ilk görülme sırası korunur). */
export function uniqueLines(lines: readonly string[]): string[] {
  return [...new Set(lines)];
}
