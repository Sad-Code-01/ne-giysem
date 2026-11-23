import type { WidgetBgMode } from '@/storage/profileStore';

/** Widget renk paleti — RemoteViews blur/gradient kısıtı nedeniyle düz yarı opak renkler. */

type Hex = `#${string}`;

export interface WidgetPalette {
  /** Köşe yuvarlak kart zemini (gradient ucu 1). rgba string olabilir. */
  bgFrom: Hex;
  bgTo: Hex;
  text: Hex;
  textSecondary: Hex;
  accent: Hex;
  iconColor: Hex;
  staleColor: Hex;
}

/** `WidgetBgMode` → arka plan alfası. RemoteViews rgba renkleri destekler. */
const BG_ALPHA: Record<WidgetBgMode, number> = {
  solid: 1,
  translucent: 0.72,
  // 'clear' = tamamen arkaplansız (launcher duvar kağıdı görünür).
  clear: 0,
};

// RemoteViews renkleri #RRGGBB ve rgba(...) kabul eder; palet tipi Hex kalır.
function hexToRgba(hex: Hex, alpha: number): Hex {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})` as Hex;
}

const BASE: Record<'day' | 'night', { bgFrom: Hex; bgTo: Hex; text: Hex; textSecondary: Hex; accent: Hex; iconColor: Hex; staleColor: Hex }> = {
  day: {
    bgFrom: '#F4F8FD',
    bgTo: '#DCE8F3',
    text: '#1B2733',
    textSecondary: '#51616F',
    accent: '#2F6FED',
    iconColor: '#2F6FED',
    staleColor: '#8A5A00',
  },
  night: {
    bgFrom: '#0B1119',
    bgTo: '#1B2733',
    text: '#EAF1F8',
    textSecondary: '#9FB0C0',
    accent: '#8FB8FF',
    iconColor: '#8FB8FF',
    staleColor: '#E8C477',
  },
};

/** Konumun `is_day` değeri + kullanıcının şeffaflık seçimi → palet. */
export function paletteFor(isDay: boolean, bgMode: WidgetBgMode = 'solid'): WidgetPalette {
  const base = isDay ? BASE.day : BASE.night;
  const alpha = BG_ALPHA[bgMode] ?? 1;
  if (alpha >= 1) {
    return { ...base };
  }
  return {
    ...base,
    bgFrom: hexToRgba(base.bgFrom, alpha),
    bgTo: hexToRgba(base.bgTo, alpha),
  };
}
