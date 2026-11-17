import {
  BaseballCap,
  Beanie,
  Boot,
  BoxingGlove,
  Hoodie,
  Infinity as InfinityIcon,
  Pants,
  ShirtFolded,
  Sneaker,
  Sunglasses,
  Tag,
  TShirt,
  Umbrella,
  type Icon,
} from 'phosphor-react-native';

import type { Garment, GarmentCategory } from '@/types';

/**
 * Kıyafet öğesi → Phosphor ikonu (tek paket: Phosphor).
 * Bilinen boşluklar: atkı ve mont/ceket için özel glif yok;
 * en yakın anlamlı sembol kullanılır (Atkı → Infinity düğüm,
 * mont/ceket → Hoodie). Yanlış anlamlı ikon (askı, el, ayak izi) yok.
 */
const GARMENT_ICONS: Record<string, Icon> = {
  // Üst giyim
  atlet: TShirt,
  tisort: TShirt,
  'uzun-kollu': TShirt,
  gomlek: ShirtFolded,
  sweatshirt: Hoodie,
  kazak: Hoodie,
  hirka: ShirtFolded,
  // Ara katman
  'termal-ust': TShirt,
  // Alt giyim
  sort: Pants,
  'ince-pantolon': Pants,
  jean: Pants,
  chino: Pants,
  'kalin-pantolon': Pants,
  'termal-alt': Pants,
  // Dış giyim (mont/ceket ailesi → kapüşonlu mont silüeti)
  'ince-ceket': Hoodie,
  ruzgarlik: Hoodie,
  yagmurluk: Hoodie,
  mont: Hoodie,
  'su-gecirmez-mont': Hoodie,
  'kalin-mont': Hoodie,
  'cok-kalin-mont': Hoodie,
  // Ayakkabı
  sandalet: Sneaker,
  'spor-ayakkabi': Sneaker,
  'kapali-ayakkabi': Sneaker,
  bot: Boot,
  'su-gecirmez-bot': Boot,
  // Aksesuar
  semsiye: Umbrella,
  sapka: BaseballCap,
  'gunes-gozlugu': Sunglasses,
  bere: Beanie,
  atki: InfinityIcon,
  eldiven: BoxingGlove,
};

/** Kategori yedeği — öğe bilinmiyorsa kategori ikonu. */
export const CATEGORY_ICON: Record<GarmentCategory, Icon> = {
  top: TShirt,
  base: TShirt,
  mid: ShirtFolded,
  bottom: Pants,
  'base-bottom': Pants,
  outer: Hoodie,
  shoes: Sneaker,
  accessory: Tag,
};

/** Öğe kimliğine göre ikon; bilinmiyorsa kategori ikonu. */
export function garmentIcon(garment: Garment): Icon {
  return GARMENT_ICONS[garment.id] ?? CATEGORY_ICON[garment.category] ?? Tag;
}
