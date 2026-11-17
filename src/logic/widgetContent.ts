import { garmentLabel } from '@/logic/garmentCatalog';
import { buildDayOutfit, defaultDayOffset } from '@/logic/outfitEngine';
import { getWeatherCondition, getWeatherVisual } from '@/logic/weatherCodes';
import { t } from '@/i18n';
import type { DayOutfit, Garment, IllustrationKind, OutfitProfile, WeatherSnapshot } from '@/types';
import type { WidgetBgMode } from '@/storage/profileStore';

/**
 * Android widget'ları için saf içerik üretimi.
 * AsyncStorage/ağ yok; girdi `WeatherSnapshot` + `OutfitProfile`.
 * Uydurma veri üretmez — widget yalnızca gerçek snapshot'tan beslenir.
 */

/** Widget'ta gösterilen saatlik nokta (önümüzdeki 4 saat). */
export interface WidgetHourlyPoint {
  /** "14:00" */
  hourLabel: string;
  temperatureC: number;
  iconKey: string;
}

/** Orta widget'ın sağ kolonundaki tek madde. */
export interface WidgetSuggestionPart {
  /** "Üst", "Dış", "Aksesuar" */
  label: string;
  /** "Kazak", "Mont + Bere" gibi birleşik parça adları. */
  value: string;
}

export type WidgetContentState = 'empty' | 'ready' | 'stale';

export interface WidgetContent {
  state: WidgetContentState;
  /** "Üsküdar" gibi kısa konum adı. */
  placeName: string;
  temperatureC: number | null;
  conditionLabel: string | null;
  weatherIconKey: string | null;
  isDay: boolean;
  minTempC: number | null;
  maxTempC: number | null;
  feelsLikeC: number | null;
  /** "Mont havası." / "Bugün çıkma." */
  suggestionTitle: string | null;
  /** "Kazak + mont" gibi kısa öneri. */
  suggestionShort: string | null;
  /** Orta widget için üst/dış/aksesuar maddeleri. */
  suggestionParts: WidgetSuggestionPart[] | null;
  /** Bayat veride "Güncel değil · HH:MM". */
  staleLabel: string | null;
  hourly: WidgetHourlyPoint[];
  /** Arka plan saydamlığı modu (widget paleti bunu okur). */
  bgMode: WidgetBgMode;
}

export const WIDGET_EMPTY_CONTENT: WidgetContent = {
  state: 'empty',
  placeName: '',
  temperatureC: null,
  conditionLabel: null,
  weatherIconKey: null,
  isDay: true,
  minTempC: null,
  maxTempC: null,
  feelsLikeC: null,
  suggestionTitle: null,
  suggestionShort: null,
  suggestionParts: null,
  staleLabel: null,
  hourly: [],
  bgMode: 'solid',
};

/** `IllustrationKind` → üretilmiş SVG ikon anahtarı. Gece varyantları ayrı. */
const KIND_ICON: Record<IllustrationKind, { day: string; night: string }> = {
  sunny: { day: 'sun', night: 'moon' },
  partly: { day: 'cloudSun', night: 'cloudMoon' },
  cloudy: { day: 'cloud', night: 'cloud' },
  rain: { day: 'cloudRain', night: 'cloudRain' },
  snow: { day: 'cloudSnow', night: 'cloudSnow' },
  wind: { day: 'wind', night: 'wind' },
  fog: { day: 'fog', night: 'fog' },
  storm: { day: 'storm', night: 'storm' },
};

export function weatherIconKey(code: number, isDay: boolean): string {
  const visual = getWeatherVisual(code, isDay);
  return KIND_ICON[visual.kind][isDay ? 'day' : 'night'];
}

function formatHourLabel(isoTime: string): string {
  return isoTime.slice(11, 16);
}

/** Verilen günün öğle diliminden öneri metinlerini üretir. */
function suggestionFromDay(day: DayOutfit): {
  title: string;
  short: string;
  parts: WidgetSuggestionPart[];
} {
  const ogle = day.slots.find((slot) => slot.slot === 'ogle') ?? day.slots[1] ?? day.slots[0];
  const items = ogle?.items ?? [];

  const heroLabel = garmentLabel(day.dayHero);
  const second = items.find((item) => garmentLabel(item) !== heroLabel);
  const short = second ? `${heroLabel} + ${garmentLabel(second)}` : heroLabel;

  const pick = (categories: Garment['category'][]): string => {
    const matched = items.filter((item) => categories.includes(item.category));
    const unique = matched.filter(
      (item, index) => matched.findIndex((other) => other.id === item.id) === index
    );
    return unique.map(garmentLabel).join(' + ');
  };

  const parts: WidgetSuggestionPart[] = [];
  const top = pick(['top', 'base', 'mid']);
  const outer = pick(['outer']);
  const accessory = pick(['accessory', 'shoes', 'bottom', 'base-bottom']);
  if (top) parts.push({ label: t('widget.partTop'), value: top });
  if (outer) parts.push({ label: t('widget.partOuter'), value: outer });
  if (accessory) parts.push({ label: t('widget.partAccessory'), value: accessory });

  return { title: day.title, short, parts: parts.slice(0, 3) };
}

/**
 * Snapshot'tan widget içeriği üretir.
 * `includeSuggestion=false` → 3 saatten eski veride öneri iddiası gösterilmez.
 */
export function buildWidgetContent(
  snapshot: WeatherSnapshot,
  profile: OutfitProfile,
  options: { staleLabel?: string | null; includeSuggestion?: boolean; bgMode?: WidgetBgMode } = {}
): WidgetContent {
  const { current, place } = snapshot;
  const daily = snapshot.daily.find(
    (day) => day.date === snapshot.current.time.slice(0, 10) && !day.isPast
  );

  const isDay = current.isDay;
  const iconKey = weatherIconKey(current.weatherCode, isDay);
  const conditionLabel = getWeatherCondition(current.weatherCode).label;

  const hourly: WidgetHourlyPoint[] = snapshot.hourly.slice(0, 4).map((point) => ({
    hourLabel: formatHourLabel(point.time),
    temperatureC: Math.round(point.temperature),
    iconKey: weatherIconKey(point.weatherCode, point.isDay),
  }));

  const includeSuggestion = options.includeSuggestion !== false;
  let suggestionTitle: string | null = null;
  let suggestionShort: string | null = null;
  let suggestionParts: WidgetSuggestionPart[] | null = null;
  if (includeSuggestion) {
    const day = buildDayOutfit(snapshot, profile, defaultDayOffset(snapshot));
    const suggestion = suggestionFromDay(day);
    suggestionTitle = suggestion.title;
    suggestionShort = suggestion.short;
    suggestionParts = suggestion.parts;
  }

  return {
    state: options.staleLabel ? 'stale' : 'ready',
    placeName: place.name,
    temperatureC: Math.round(current.temperature),
    conditionLabel,
    weatherIconKey: iconKey,
    isDay,
    minTempC: daily ? Math.round(daily.temperatureMin) : null,
    maxTempC: daily ? Math.round(daily.temperatureMax) : null,
    feelsLikeC: Math.round(current.apparentTemperature),
    suggestionTitle,
    suggestionShort,
    suggestionParts,
    staleLabel: options.staleLabel ?? null,
    hourly,
    bgMode: options.bgMode ?? 'solid',
  };
}
