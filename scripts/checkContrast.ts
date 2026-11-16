/**
 * Kontrast denetimi: metin/zemin çiftleri WCAG AA.
 * Normal metin ≥ 4.5:1, büyük metin ≥ 3:1.
 * Açık ve koyu temaların tüm paletleri denetlenir.
 * Çalıştırma: `npm run check:contrast` — başarısızsa çıkış kodu 1.
 */
import { DARK_THEME, LIGHT_THEME, type AppTheme } from '../src/theme/tokens';

interface Pair {
  name: string;
  fg: string;
  bg: string;
  large?: boolean;
}

function parseColor(color: string): number {
  const hex = color.match(/^#([0-9a-fA-F]{6})$/);
  if (!hex) throw new Error(`Desteklenmeyen renk: ${color}`);
  return parseInt(hex[1], 16);
}

function luminance(color: string): number {
  const c = parseColor(color);
  const r = (c >> 16) & 255;
  const g = (c >> 8) & 255;
  const b = c & 255;
  const f = (v: number): number => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function contrast(fg: string, bg: string): number {
  const l1 = luminance(fg);
  const l2 = luminance(bg);
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

/** Bir temanın metin taşıyan tüm yüzey çiftleri. */
function pairsFor(theme: AppTheme, label: string): Pair[] {
  return [
    { name: `${label} text/bg`, fg: theme.text, bg: theme.bg },
    { name: `${label} textSecondary/bg`, fg: theme.textSecondary, bg: theme.bg },
    { name: `${label} text/surface`, fg: theme.text, bg: theme.surface },
    { name: `${label} textSecondary/surface`, fg: theme.textSecondary, bg: theme.surface },
    { name: `${label} onPrimary/primary`, fg: theme.onPrimary, bg: theme.primary },
    { name: `${label} onAccent/accent`, fg: theme.onAccent, bg: theme.accent },
    { name: `${label} onPrimary/secondary`, fg: theme.onPrimary, bg: theme.secondary },
  ];
}

const pairs: Pair[] = [...pairsFor(LIGHT_THEME, 'açık'), ...pairsFor(DARK_THEME, 'koyu')];

let failures = 0;

for (const pair of pairs) {
  const ratio = contrast(pair.fg, pair.bg);
  const required = pair.large ? 3 : 4.5;
  const ok = ratio >= required;
  if (!ok) failures += 1;
  console.log(
    `${ok ? 'PASS' : 'FAIL'} ${pair.name}: ${ratio.toFixed(2)}:1 (gerekli ≥ ${required}:1)`
  );
}

if (failures > 0) {
  console.error(`\n${failures} kontrast çifti WCAG eşiğinin altında.`);
  process.exit(1);
}
console.log('\nTüm kontrast çiftleri WCAG AA eşiğini karşılıyor.');
