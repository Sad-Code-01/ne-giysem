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

import { CoatIcon } from '@/components/CoatIcon';
import type { Garment, GarmentCategory } from '@/types';

/**
 * Kıyafet öğesi → Phosphor ikonu (tek paket: Phosphor).
 * Dış giyim (mont/ceket ailesi) özel `CoatIcon` SVG'si kullanır —
 * Phosphor'da mont glifi yok; gerisi Phosphor'dan gelir.
 * Atkı → Infinity düğüm, kazak/sweatshirt → Hoodie.
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
  // Dış giyim (mont/ceket ailesi → mont silüeti)
  'ince-ceket': CoatIcon,
  ruzgarlik: CoatIcon,
  yagmurluk: CoatIcon,
  mont: CoatIcon,
  'su-gecirmez-mont': CoatIcon,
  'kalin-mont': CoatIcon,
  'cok-kalin-mont': CoatIcon,
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
  outer: CoatIcon,
  shoes: Sneaker,
  accessory: Tag,
};

/** Öğe kimliğine göre ikon; bilinmiyorsa kategori ikonu. */
export function garmentIcon(garment: Garment): Icon {
  return GARMENT_ICONS[garment.id] ?? CATEGORY_ICON[garment.category] ?? Tag;
}
