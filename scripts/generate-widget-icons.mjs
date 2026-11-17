/**
 * Phosphor ikonlarının `regular` ağırlığındaki path verilerini
 * react-native-android-widget SvgWidget için SVG dizgilerine çevirir.
 *
 * Çalıştırma: `node scripts/generate-widget-icons.mjs`
 * Çıktı: `src/widgets/icons.ts` (üretilmiş dosya — elle düzenleme).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DEFS_DIR = join(ROOT, 'node_modules', 'phosphor-react-native', 'src', 'defs');
const OUT_FILE = join(ROOT, 'src', 'widgets', 'icons.ts');

/** Widget'larda kullanılan ikonlar: Phosphor dosya adı → dışa aktarılan anahtar. */
const ICONS = {
  Sun: 'sun',
  Moon: 'moon',
  CloudSun: 'cloudSun',
  CloudMoon: 'cloudMoon',
  Cloud: 'cloud',
  CloudRain: 'cloudRain',
  CloudSnow: 'cloudSnow',
  Wind: 'wind',
  CloudFog: 'fog',
  CloudLightning: 'storm',
};

/** Def dosyasında 'regular' ağırlığındaki Path `d` değerlerini toplar. */
function extractRegularPaths(file) {
  const source = readFileSync(join(DEFS_DIR, `${file}.tsx`), 'utf8');
  const marker = source.indexOf("'regular'");
  if (marker < 0) throw new Error(`${file}: 'regular' ağırlığı bulunamadı`);

  // 'regular' bölümünü bir sonraki ağırlık girdisine kadar kes.
  const rest = source.slice(marker);
  const nextEntry = rest.slice(1).search(/\n\s*\[\s*'/);
  const section = nextEntry < 0 ? rest : rest.slice(0, nextEntry + 1);

  const paths = [];
  const re = /<Path\s+d="([^"]+)"/g;
  let match;
  while ((match = re.exec(section)) !== null) {
    paths.push(match[1]);
  }
  if (paths.length === 0) throw new Error(`${file}: path bulunamadı`);
  return paths;
}

function toSvg(paths) {
  const body = paths.map((d) => `<path d="${d}" fill="__COLOR__"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">${body}</svg>`;
}

const entries = Object.entries(ICONS).map(([file, key]) => {
  const svg = toSvg(extractRegularPaths(file));
  return `  ${key}: ${JSON.stringify(svg)},`;
});

const output = `/**
 * ÜRETİLMİŞ DOSYA — \`scripts/generate-widget-icons.mjs\` ile oluşturulur.
 * Kaynak: phosphor-react-native defs (regular ağırlığı, MIT lisansı).
 * \`__COLOR__\` yer tutucusu render sırasında gerçek renkle değiştirilir.
 */
export const WIDGET_ICON_SVGS: Record<string, string> = {
${entries.join('\n')}
};

/** İkon anahtarı + renk → SvgWidget'e verilecek SVG dizgisi. */
export function widgetIconSvg(key: string, color: string): string {
  const template = WIDGET_ICON_SVGS[key];
  return template ? template.split('__COLOR__').join(color) : '';
}
`;

writeFileSync(OUT_FILE, output, 'utf8');
console.log(`Yazıldı: ${OUT_FILE} (${Object.keys(ICONS).length} ikon)`);
