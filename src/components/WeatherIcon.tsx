import { SvgXml } from 'react-native-svg';

import { WEATHER_ICON_XML } from '@/components/weatherIcons.generated';
import type { IllustrationKind } from '@/types';

interface WeatherIconProps {
  kind: IllustrationKind;
  isDay: boolean;
  size?: number;
  /** Eski Phosphor API uyumluluğu — Meteocons kendi renklerini kullanır. */
  color?: string;
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
}

/** Hava durumu ikonu — Meteocons flat seti (react-native-svg SvgXml). */
export function WeatherIcon({ kind, isDay, size = 32 }: WeatherIconProps) {
  const key = `${kind}:${isDay ? 'day' : 'night'}`;
  const xml = WEATHER_ICON_XML[key] ?? WEATHER_ICON_XML[`${kind}:day`];
  if (!xml) return null;
  return <SvgXml xml={xml} width={size} height={size} />;
}
