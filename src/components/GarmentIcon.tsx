import type { Icon } from 'phosphor-react-native';
import { createElement } from 'react';

import { garmentIcon } from '@/logic/itemIcons';
import type { Garment } from '@/types';

interface GarmentIconProps {
  garment: Garment;
  size?: number | string;
  color?: string;
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
}

/** Kıyafet parçasını temsil eden Phosphor ikonu (`logic/itemIcons`). */
export function GarmentIcon({ garment, size = 24, color, weight = 'regular' }: GarmentIconProps) {
  const icon: Icon = garmentIcon(garment);
  return createElement(icon, { size, color, weight });
}
