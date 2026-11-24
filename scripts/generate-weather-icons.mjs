/**
 * Meteocons (@meteocons/svg-static/flat) SVG'lerini WeatherIcon için
 * TS modülüne gömer. react-native-svg SMIL desteklemediği için
 * animasyonsuz 'flat' stil kullanılır.
 *
 * Çalıştırma: `node scripts/generate-weather-icons.mjs`
 * Çıktı: `src/components/weatherIcons.generated.ts`
 * Paket güncellenirse script'i tekrar çalıştır.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FLAT_DIR = join(ROOT, 'node_modules', '@meteocons', 'svg-static', 'flat');
const MONO_DIR = join(ROOT, 'node_modules', '@meteocons', 'svg-static', 'monochrome');
const OUT = join(ROOT, 'src', 'components', 'weatherIcons.generated.ts');

/** IllustrationKind + gündüz/gece → meteocons slug. */
const MAP = {
  'sunny:day': 'clear-day',
  'sunny:night': 'clear-night',
  'partly:day': 'partly-cloudy-day',
  'partly:night': 'partly-cloudy-night',
  'cloudy:day': 'cloudy',
  'cloudy:night': 'cloudy',
  'rain:day': 'rain',
  'rain:night': 'rain',
  'snow:day': 'snow',
  'snow:night': 'snow',
  'wind:day': 'wind',
  'wind:night': 'wind',
  'fog:day': 'fog-day',
  'fog:night': 'fog-night',
  'storm:day': 'thunderstorms-day',
  'storm:night': 'thunderstorms-night',
};

const flatEntries = [];
const monoEntries = [];
for (const [key, slug] of Object.entries(MAP)) {
  const flat = readFileSync(join(FLAT_DIR, `${slug}.svg`), 'utf8').trim();
  flatEntries.push(`  ${JSON.stringify(key)}: ${JSON.stringify(flat)},`);
  const mono = readFileSync(join(MONO_DIR, `${slug}.svg`), 'utf8').trim();
  monoEntries.push(`  ${JSON.stringify(key)}: ${JSON.stringify(mono)},`);
}

const content = `/** ÜRETİLMİŞ DOSYA — scripts/generate-weather-icons.mjs ile oluşturuldu. Elle düzenleme. */
export const WEATHER_ICON_XML: Record<string, string> = {
${flatEntries.join('\n')}
};

/** Açık tema varyantı — currentColor kullanır, renk prop ile boyanır. */
export const WEATHER_ICON_XML_MONO: Record<string, string> = {
${monoEntries.join('\n')}
};
`;

writeFileSync(OUT, content, 'utf8');
console.log(`weatherIcons.generated.ts yazildi (${flatEntries.length} ikon x2)`);
