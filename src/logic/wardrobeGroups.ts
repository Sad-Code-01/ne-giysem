import type { Garment, GarmentCategory } from '@/types';

/**
 * Gardırop görüntüleme grupları — motor kategorileri burada birleştirilir.
 * Dolap ekranı ve karşılama seçimi ortak kullanır.
 */
export type WardrobeGroupKey = 'top' | 'bottom' | 'outer' | 'shoes' | 'accessory';

export const GROUP_OF: Record<GarmentCategory, WardrobeGroupKey> = {
  top: 'top',
  base: 'top',
  mid: 'top',
  bottom: 'bottom',
  'base-bottom': 'bottom',
  outer: 'outer',
  shoes: 'shoes',
  accessory: 'accessory',
};

export const GROUP_ORDER: WardrobeGroupKey[] = ['top', 'bottom', 'outer', 'shoes', 'accessory'];

export const GROUP_LABEL: Record<WardrobeGroupKey, string> = {
  top: 'cat.top',
  bottom: 'cat.bottom',
  outer: 'cat.outer',
  shoes: 'cat.shoes',
  accessory: 'cat.accessory',
};

export interface WardrobeGroup {
  key: WardrobeGroupKey;
  items: Garment[];
}

/** Katalogu görüntüleme gruplarına böler (sıralı). */
export function groupGarments(garments: readonly Garment[]): WardrobeGroup[] {
  const map = new Map<WardrobeGroupKey, Garment[]>();
  for (const garment of garments) {
    const key = GROUP_OF[garment.category];
    const list = map.get(key) ?? [];
    list.push(garment);
    map.set(key, list);
  }
  return GROUP_ORDER.filter((key) => map.has(key)).map((key) => ({
    key,
    items: map.get(key) ?? [],
  }));
}
