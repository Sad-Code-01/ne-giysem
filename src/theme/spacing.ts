/** Boşluk ve köşe: küçük 16, kart/sheet 24. Kenar 1.5px. Gölge yok. */

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 16,
  card: 24,
  pill: 999,
} as const;

export const BORDER_WIDTH = 1.5;

export const MIN_TOUCH_SIZE = 44;

export const SCREEN_PADDING = spacing.lg;
