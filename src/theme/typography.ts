/**
 * Başlık: Bricolage Grotesque ExtraBold. Gövde: DM Sans.
 * Ölçek: 12 / 14 / 16 / 20 / 28 / 44. Yazı büyütme üst sınırı 1.3.
 */

export const FONT_FAMILY = {
  display: 'BricolageGrotesque_800ExtraBold',
  regular: 'DMSans_400Regular',
  medium: 'DMSans_500Medium',
  bold: 'DMSans_700Bold',
} as const;

export const typography = {
  /** Sonuç başlığı — 44 ExtraBold. */
  display: {
    fontFamily: FONT_FAMILY.display,
    fontSize: 44,
    lineHeight: 48,
    letterSpacing: -1,
  },
  /** Şehir adı yedeği — fotoğraf yokken büyük başlık. */
  city: {
    fontFamily: FONT_FAMILY.display,
    fontSize: 40,
    lineHeight: 44,
    letterSpacing: -0.8,
  },
  /** Başlık — 28 ExtraBold. */
  titleL: {
    fontFamily: FONT_FAMILY.display,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.4,
  },
  /** Başlık — 20 ExtraBold. */
  titleM: {
    fontFamily: FONT_FAMILY.display,
    fontSize: 20,
    lineHeight: 26,
  },
  /** Satır başlığı — 16 Bold. */
  titleS: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 16,
    lineHeight: 22,
  },
  /** Gövde — 16 Regular. */
  body: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 16,
    lineHeight: 22,
  },
  /** Alt bilgi — 14 Medium. */
  caption: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 14,
    lineHeight: 18,
  },
  /** Mikro — 12 Bold. */
  micro: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.4,
  },
  /** Sekme — 12 Medium. */
  tab: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 12,
    lineHeight: 16,
  },
  /** Ölçü — 14 Medium, tabular. */
  metric: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 14,
    lineHeight: 18,
    fontVariant: ['tabular-nums'] as const,
  },
} as const;
