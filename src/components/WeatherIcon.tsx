import { SvgXml } from 'react-native-svg';

import { WEATHER_ICON_XML, WEATHER_ICON_XML_MONO } from '@/components/weatherIcons.generated';
import { useAppTheme } from '@/theme/useAppTheme';
import type { IllustrationKind } from '@/types';

interface WeatherIconProps {
  kind: IllustrationKind;
  isDay: boolean;
  size?: number;
  /** İkon rengi — verilmezse tema metin rengi kullanılır (monochrome varyant). */
  color?: string;
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
}

/**
 * Hava durumu ikonu — Meteocons seti.
 * Koyu tema: renkli 'flat' varyant. Açık tema: 'monochrome' varyant
 * tema rengiyle boyanır (beyaz bulutlar açık zeminde görünmezdi).
 */
export function WeatherIcon({ kind, isDay, size = 32, color }: WeatherIconProps) {
  const theme = useAppTheme();
  const key = `${kind}:${isDay ? 'day' : 'night'}`;
  if (theme.isDark) {
    const xml = WEATHER_ICON_XML[key] ?? WEATHER_ICON_XML[`${kind}:day`];
    if (!xml) return null;
    return <SvgXml xml={xml} width={size} height={size} />;
  }
  const mono = WEATHER_ICON_XML_MONO[key] ?? WEATHER_ICON_XML_MONO[`${kind}:day`];
  if (!mono) return null;
  return <SvgXml xml={mono} width={size} height={size} color={color ?? theme.text} />;
}
