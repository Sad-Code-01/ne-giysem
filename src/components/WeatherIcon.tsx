import {
  Cloud,
  CloudFog,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSnow,
  CloudSun,
  MoonStars,
  Sun,
  Wind,
  type Icon,
} from 'phosphor-react-native';

import type { IllustrationKind } from '@/types';

const DAY_ICONS: Record<IllustrationKind, Icon> = {
  sunny: Sun,
  partly: CloudSun,
  cloudy: Cloud,
  rain: CloudRain,
  snow: CloudSnow,
  wind: Wind,
  fog: CloudFog,
  storm: CloudLightning,
};

const NIGHT_ICONS: Record<IllustrationKind, Icon> = {
  sunny: MoonStars,
  partly: CloudMoon,
  cloudy: Cloud,
  rain: CloudRain,
  snow: CloudSnow,
  wind: Wind,
  fog: CloudFog,
  storm: CloudLightning,
};

interface WeatherIconProps {
  kind: IllustrationKind;
  isDay: boolean;
  size?: number;
  color?: string;
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
}

/** WMO illüstrasyon türünü Phosphor hava ikonuna çevirir. */
export function WeatherIcon({ kind, isDay, size = 24, color, weight = 'regular' }: WeatherIconProps) {
  const IconComponent = isDay ? DAY_ICONS[kind] : NIGHT_ICONS[kind];
  return <IconComponent size={size} color={color} weight={weight} />;
}
