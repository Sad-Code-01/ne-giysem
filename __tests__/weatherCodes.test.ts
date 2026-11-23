import {
  classifySky,
  getWeatherCondition,
  isClearCode,
  isPrecipitationCode,
  isSnowCode,
  isStormCode,
} from '@/logic/weatherCodes';

/**
 * WMO kod tablosu doğrulaması — Open-Meteo `weather_code` alanı
 * WMO weather interpretation codes kullanır; sınıflandırma
 * fırtına → kar → sağanak → yağmur → çisenti → sis → bulut → açık
 * önceliğiyle yapılır.
 */
describe('classifySky — olay sınıfları', () => {
  it('açık / az bulutlu', () => {
    expect(classifySky(0)).toBe('clear');
    expect(classifySky(1)).toBe('clear');
    expect(isClearCode(0)).toBe(true);
    expect(isClearCode(1)).toBe(true);
    expect(isClearCode(2)).toBe(false);
  });

  it('bulut', () => {
    expect(classifySky(2)).toBe('cloud');
    expect(classifySky(3)).toBe('cloud');
  });

  it('sis', () => {
    expect(classifySky(45)).toBe('fog');
    expect(classifySky(48)).toBe('fog');
  });

  it('çisenti (drizzle) 51–57', () => {
    for (const code of [51, 53, 55, 56, 57]) {
      expect(classifySky(code)).toBe('drizzle');
    }
  });

  it('yağmur 61–67', () => {
    for (const code of [61, 63, 65, 66, 67]) {
      expect(classifySky(code)).toBe('rain');
    }
  });

  it('sağanak 80–82', () => {
    expect(classifySky(80)).toBe('showers');
    expect(classifySky(81)).toBe('showers');
    expect(classifySky(82)).toBe('showers');
  });

  it('kar 71–77 ve 85–86', () => {
    for (const code of [71, 73, 75, 77, 85, 86]) {
      expect(classifySky(code)).toBe('snow');
      expect(isSnowCode(code)).toBe(true);
    }
    expect(isSnowCode(70)).toBe(false);
    expect(isSnowCode(80)).toBe(false);
  });

  it('fırtına/gök gürültüsü 95–99', () => {
    for (const code of [95, 96, 99]) {
      expect(classifySky(code)).toBe('storm');
      expect(isStormCode(code)).toBe(true);
    }
    expect(isStormCode(94)).toBe(false);
    expect(isStormCode(100)).toBe(false);
  });

  it('bilinmeyen kod güvenli varsayılana düşer', () => {
    expect(classifySky(999)).toBe('unknown');
    expect(classifySky(-1)).toBe('unknown');
    const condition = getWeatherCondition(999);
    expect(condition.labelKey).toBe('weather.code.unknown');
    expect(condition.illustration).toBe('cloudy');
  });
});

describe('isPrecipitationCode — yağış içeren kodlar', () => {
  it('yağmur/çisenti/sağanak/kar/fırtına true', () => {
    for (const code of [51, 61, 65, 80, 82, 71, 85, 95, 96, 99]) {
      expect(isPrecipitationCode(code)).toBe(true);
    }
  });

  it('açık/bulut/sis false', () => {
    for (const code of [0, 1, 2, 3, 45, 48]) {
      expect(isPrecipitationCode(code)).toBe(false);
    }
  });
});
