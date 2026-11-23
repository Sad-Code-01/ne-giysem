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
const SVG_DIR = join(ROOT, 'node_modules', '@meteocons', 'svg-static', 'flat');
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

const entries = [];
for (const [key, slug] of Object.entries(MAP)) {
  const file = join(SVG_DIR, `${slug}.svg`);
  const xml = readFileSync(file, 'utf8').trim();
  entries.push(`  ${JSON.stringify(key)}: ${JSON.stringify(xml)},`);
}

const content = `/** ÜRETİLMİŞ DOSYA — scripts/generate-weather-icons.mjs ile oluşturuldu. Elle düzenleme. */
export const WEATHER_ICON_XML: Record<string, string> = {
${entries.join('\n')}
};
`;

writeFileSync(OUT, content, 'utf8');
console.log(`weatherIcons.generated.ts yazildi (${entries.length} ikon)`);
