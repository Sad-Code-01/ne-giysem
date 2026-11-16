import {
  BaseballCap,
  Beanie,
  Belt,
  CoatHanger,
  Footprints,
  Hand,
  Pants,
  ShirtFolded,
  Sneaker,
  Sunglasses,
  Tag,
  TShirt,
  Umbrella,
  Wind,
  type Icon,
} from 'phosphor-react-native';

import type { Garment, GarmentCategory } from '@/types';

/** Kıyafet id → en yakın Phosphor ikonu. */
const GARMENT_ICONS: Record<string, Icon> = {
  atlet: TShirt,
  tisort: TShirt,
  'uzun-kollu': TShirt,
  gomlek: ShirtFolded,
  sweatshirt: TShirt,
  kazak: TShirt,
  'termal-ust': TShirt,
  hirka: CoatHanger,
  sort: Pants,
  'ince-pantolon': Pants,
  jean: Pants,
  chino: Pants,
  'kalin-pantolon': Pants,
  'termal-alt': Pants,
  'ince-ceket': CoatHanger,
  ruzgarlik: Wind,
  yagmurluk: CoatHanger,
  mont: CoatHanger,
  'su-gecirmez-mont': CoatHanger,
  'kalin-mont': CoatHanger,
  'cok-kalin-mont': CoatHanger,
  sandalet: Footprints,
  'spor-ayakkabi': Sneaker,
  'kapali-ayakkabi': Sneaker,
  bot: Sneaker,
  'su-gecirmez-bot': Sneaker,
  semsiye: Umbrella,
  sapka: BaseballCap,
  'gunes-gozlugu': Sunglasses,
  bere: Beanie,
  atki: Belt,
  eldiven: Hand,
};

const CATEGORY_FALLBACK: Record<GarmentCategory, Icon> = {
  top: TShirt,
  base: TShirt,
  mid: CoatHanger,
  bottom: Pants,
  'base-bottom': Pants,
  outer: CoatHanger,
  shoes: Sneaker,
  accessory: Tag,
};

interface GarmentIconProps {
  garment: Garment;
  size?: number | string;
  color?: string;
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
}

/** Kıyafet parçasını temsil eden Phosphor ikonu. */
export function GarmentIcon({ garment, size = 24, color, weight = 'regular' }: GarmentIconProps) {
  const IconComponent = GARMENT_ICONS[garment.id] ?? CATEGORY_FALLBACK[garment.category] ?? Tag;
  return <IconComponent size={size} color={color} weight={weight} />;
}
