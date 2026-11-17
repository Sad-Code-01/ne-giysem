import {
  WIDGET_EMPTY_CONTENT,
  buildWidgetContent,
  weatherIconKey,
} from '@/logic/widgetContent';
import {
  WIDGET_MAX_SUGGESTION_AGE_MS,
  WIDGET_REFRESH_AGE_MS,
  WIDGET_UPDATE_PERIOD_MS,
} from '@/constants/widget';
import { makeSnapshot, TEST_PROFILE } from './helpers';

describe('widgetContent', () => {
  it('snapshot’tan hazır içerik üretir', () => {
    const snapshot = makeSnapshot({ currentTime: '2026-11-05T10:00' });
    const content = buildWidgetContent(snapshot, TEST_PROFILE);

    expect(content.state).toBe('ready');
    expect(content.placeName).toBe('Elazığ');
    expect(content.temperatureC).toBe(20);
    expect(content.minTempC).toBe(15);
    expect(content.maxTempC).toBe(22);
    expect(content.feelsLikeC).toBe(20);
    expect(content.conditionLabel).toBeTruthy();
    expect(content.weatherIconKey).toBe('cloud');
    expect(content.hourly.length).toBeGreaterThan(0);
    expect(content.hourly.length).toBeLessThanOrEqual(4);
    expect(content.hourly[0].hourLabel).toMatch(/^\d{2}:\d{2}$/);
  });

  it('öneri başlığı ve kısa öneri üretir', () => {
    const snapshot = makeSnapshot({
      currentTime: '2026-11-05T10:00',
      current: { temperature: 5, apparentTemperature: 2, weatherCode: 61 },
      hourly: undefined,
    });
    const content = buildWidgetContent(snapshot, TEST_PROFILE);

    expect(content.suggestionTitle).toBeTruthy();
    expect(content.suggestionShort).toBeTruthy();
    expect(content.suggestionParts?.length).toBeGreaterThan(0);
    expect(content.suggestionParts?.length).toBeLessThanOrEqual(4);
    for (const part of content.suggestionParts ?? []) {
      expect(['İç', 'Orta', 'Dış', 'Aksesuar']).toContain(part.label);
      expect(part.value.length).toBeGreaterThan(0);
    }
  });

  it('stale + önerisiz durumda öneri alanları boş kalır', () => {
    const snapshot = makeSnapshot();
    const content = buildWidgetContent(snapshot, TEST_PROFILE, {
      staleLabel: 'Güncel değil · 10:00',
      includeSuggestion: false,
    });

    expect(content.state).toBe('stale');
    expect(content.staleLabel).toBe('Güncel değil · 10:00');
    expect(content.suggestionTitle).toBeNull();
    expect(content.suggestionShort).toBeNull();
    expect(content.suggestionParts).toBeNull();
    // Hava verisi yine de gösterilir.
    expect(content.temperatureC).toBe(20);
  });

  it('boş içerik durumu tüm alanları null tutar', () => {
    expect(WIDGET_EMPTY_CONTENT.state).toBe('empty');
    expect(WIDGET_EMPTY_CONTENT.temperatureC).toBeNull();
    expect(WIDGET_EMPTY_CONTENT.suggestionTitle).toBeNull();
    expect(WIDGET_EMPTY_CONTENT.hourly).toEqual([]);
  });
});

describe('weatherIconKey', () => {
  it('gündüz/gece ve WMO koduna göre ikon seçer', () => {
    expect(weatherIconKey(0, true)).toBe('sun');
    expect(weatherIconKey(0, false)).toBe('moon');
    expect(weatherIconKey(1, true)).toBe('cloudSun');
    expect(weatherIconKey(1, false)).toBe('cloudMoon');
    expect(weatherIconKey(2, true)).toBe('cloud');
    expect(weatherIconKey(3, true)).toBe('cloud');
    expect(weatherIconKey(61, true)).toBe('cloudRain');
    expect(weatherIconKey(71, true)).toBe('cloudSnow');
    expect(weatherIconKey(45, true)).toBe('fog');
    expect(weatherIconKey(95, true)).toBe('storm');
    expect(weatherIconKey(80, false)).toBe('cloudRain');
  });
});

describe('widget eşikleri', () => {
  it('yenileme 30 dk, öneri sınırı 3 saat, periyot 30 dk', () => {
    expect(WIDGET_REFRESH_AGE_MS).toBe(30 * 60 * 1000);
    expect(WIDGET_MAX_SUGGESTION_AGE_MS).toBe(3 * 60 * 60 * 1000);
    expect(WIDGET_UPDATE_PERIOD_MS).toBe(1_800_000);
  });
});
