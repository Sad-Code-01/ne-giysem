import type { AppTheme } from '@/theme/tokens';
import type { IllustrationKind } from '@/types';

/**
 * Tek cam malzemesi: tüm cam yüzeyler bu token'ları kullanır.
 * Sekme çubuğundaki malzemenin token karşılığı; ekranlarda sabit
 * renk/ölçü yazılmaz.
 */

export interface GlassMaterial {
  /** Yarı saydam dolgu (blur yokken de aynı görünüm). */
  fill: string;
  /** 1px kenarlık. */
  border: string;
  /** Üst kenarda ince parlak iç çizgi. */
  highlight: string;
  /** Yumuşak gölge. */
  shadow: {
    shadowColor: string;
    shadowOpacity: number;
    shadowRadius: number;
    shadowOffset: { width: number; height: number };
    elevation: number;
  };
  /** Blur devre dışıysa opak yedek dolgu. */
  fallbackFill: string;
}

export type GlassVariant = 'surface' | 'chip' | 'pill' | 'sheet' | 'input';

function material(theme: AppTheme, fill: string, border: string, highlight: string, fallback: string): GlassMaterial {
  return {
    fill,
    border,
    highlight,
    fallbackFill: fallback,
    shadow: {
      shadowColor: '#000',
      shadowOpacity: theme.isDark ? 0.3 : 0.12,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 8 },
      elevation: theme.isDark ? 8 : 6,
    },
  };
}

/** Varyanta göre cam malzemesi. */
export function glassMaterial(theme: AppTheme, variant: GlassVariant = 'surface'): GlassMaterial {
  if (theme.isDark) {
    switch (variant) {
      case 'chip':
        return material(theme, 'rgba(255,255,255,0.07)', 'rgba(255,255,255,0.14)', 'rgba(255,255,255,0.22)', 'rgba(18,26,36,0.92)');
      case 'pill':
        return material(theme, 'rgba(255,255,255,0.10)', 'rgba(255,255,255,0.16)', 'rgba(255,255,255,0.28)', 'rgba(18,26,36,0.92)');
      case 'sheet':
        // Sheet'ler arkadaki içerik okunmasın diye daha opak.
        return material(theme, 'rgba(18,26,36,0.94)', 'rgba(255,255,255,0.16)', 'rgba(255,255,255,0.28)', 'rgba(18,26,36,0.97)');
      case 'input':
        return material(theme, 'rgba(255,255,255,0.08)', 'rgba(255,255,255,0.16)', 'rgba(255,255,255,0.24)', 'rgba(18,26,36,0.92)');
      default:
        return material(theme, 'rgba(255,255,255,0.08)', 'rgba(255,255,255,0.16)', 'rgba(255,255,255,0.28)', 'rgba(18,26,36,0.92)');
    }
  }
  switch (variant) {
    case 'chip':
      return material(theme, 'rgba(255,255,255,0.50)', 'rgba(255,255,255,0.80)', 'rgba(255,255,255,0.90)', 'rgba(246,249,252,0.92)');
    case 'pill':
      return material(theme, 'rgba(255,255,255,0.45)', 'rgba(255,255,255,0.80)', 'rgba(255,255,255,0.90)', 'rgba(246,249,252,0.92)');
    case 'sheet':
      return material(theme, 'rgba(246,249,252,0.92)', 'rgba(255,255,255,0.85)', 'rgba(255,255,255,0.95)', 'rgba(246,249,252,0.96)');
    case 'input':
      return material(theme, 'rgba(255,255,255,0.55)', 'rgba(255,255,255,0.80)', 'rgba(255,255,255,0.90)', 'rgba(246,249,252,0.92)');
    default:
      return material(theme, 'rgba(255,255,255,0.48)', 'rgba(255,255,255,0.80)', 'rgba(255,255,255,0.90)', 'rgba(246,249,252,0.92)');
  }
}

/** İç hap (aktif gösterge) dolgusu — sekme çubuğu ve GlassSegmented ortak. */
export function glassIndicatorFill(theme: AppTheme): string {
  return theme.isDark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.75)';
}

export function glassIndicatorBorder(theme: AppTheme): string {
  return theme.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(20,40,70,0.08)';
}

/* ------------------------------------------------------------------ */
/* Zemin: hava + gün/gece gradyanı ve renkli ışık küreleri             */
/* ------------------------------------------------------------------ */

export interface SkyPalette {
  /** Değişim animasyonunda key olarak kullanılır. */
  id: string;
  /** LinearGradient renkleri (üstten alta). */
  colors: readonly [string, string, string];
  /** 3 büyük, çok yumuşak ışık küresi renkleri. */
  orbs: readonly [string, string, string];
}

interface SkySpec {
  day: readonly [string, string, string];
  dayOrbs: readonly [string, string, string];
  night: readonly [string, string, string];
  nightOrbs: readonly [string, string, string];
}

const SKY_SPECS: Record<'sunny' | 'cloudy' | 'rain' | 'snow' | 'fog', SkySpec> = {
  sunny: {
    day: ['#DCEBFF', '#EAF1FB', '#FBEFE3'],
    dayOrbs: ['#8EC5FF', '#FFC9A3', '#B7A6FF'],
    night: ['#0B1119', '#142130', '#1B2733'],
    nightOrbs: ['#2A4A7A', '#3B3A7A', '#1F5C6B'],
  },
  cloudy: {
    day: ['#E3EAF2', '#D3DDE8', '#E9EEF3'],
    dayOrbs: ['#9DB6D3', '#C9D3E0', '#B7C4D4'],
    night: ['#0B1119', '#142130', '#1B2733'],
    nightOrbs: ['#2A4A7A', '#3B3A7A', '#1F5C6B'],
  },
  rain: {
    day: ['#D6E3F0', '#C4D4E6', '#DCE6F1'],
    dayOrbs: ['#7FA7D6', '#A9BFD9', '#8FB0CC'],
    night: ['#0A1018', '#101C2A', '#16222F'],
    nightOrbs: ['#27436B', '#33356E', '#1E5570'],
  },
  snow: {
    day: ['#F3F8FC', '#DDE9F4', '#F7FAFD'],
    dayOrbs: ['#BFD9F2', '#E2EEF9', '#C9DDF0'],
    night: ['#0A1018', '#111A26', '#182230'],
    nightOrbs: ['#2A4A7A', '#3B3A7A', '#1F5C6B'],
  },
  fog: {
    day: ['#E8ECEF', '#D4DAE0', '#EEF1F3'],
    dayOrbs: ['#C3CDD6', '#D8DEE4', '#AEB9C4'],
    night: ['#0B1119', '#121A22', '#1A232D'],
    nightOrbs: ['#2A4A7A', '#3B3A7A', '#1F5C6B'],
  },
};

/** IllustrationKind → gökyüzü ailesi. */
function skyFamily(kind: IllustrationKind): keyof typeof SKY_SPECS {
  switch (kind) {
    case 'sunny':
      return 'sunny';
    case 'rain':
    case 'storm':
      return 'rain';
    case 'snow':
      return 'snow';
    case 'fog':
    case 'wind':
      return 'fog';
    case 'partly':
    case 'cloudy':
    default:
      return 'cloudy';
  }
}

export function skyPalette(kind: IllustrationKind, isDay: boolean): SkyPalette {
  const spec = SKY_SPECS[skyFamily(kind)];
  const family = skyFamily(kind);
  return {
    id: `${family}-${isDay ? 'day' : 'night'}`,
    colors: isDay ? spec.day : spec.night,
    orbs: isDay ? spec.dayOrbs : spec.nightOrbs,
  };
}

/** "#RRGGBB" → "rgba(r,g,b,a)". */
export function hexToRgba(hex: string, alpha: number): string {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
